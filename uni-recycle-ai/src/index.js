/**
 * Cloudflare Worker — Uni-Recycle Go AI Assistant API
 * 
 * 功能：代理 Cloudflare Workers AI 请求，隐藏 API Token，处理 CORS
 * 免费额度：每天 10,000 Neurons（约可进行 200-500 次对话）
 * 
 * 部署步骤：
 * 1. 注册 Cloudflare 账号（免费）：https://dash.cloudflare.com/sign-up
 * 2. 获取 Account ID：登录后在 Workers & Pages 页面查看
 * 3. 创建 API Token：https://dash.cloudflare.com/profile/api-tokens
 *    - 选择 "Create Token" → "Workers AI (beta)" 模板
 *    - 权限：Account.Workers AI:Edit
 * 4. 安装 Wrangler CLI：npm install -g wrangler
 * 5. 登录：wrangler login
 * 6. 创建 Worker：wrangler init uni-recycle-ai
 * 7. 将此文件内容复制到 src/index.js
 * 8. 设置 Secrets：
 *    wrangler secret put CLOUDFLARE_ACCOUNT_ID
 *    wrangler secret put CLOUDFLARE_API_TOKEN
 * 9. 部署：wrangler deploy
 * 10. 获取 Worker URL（如 https://uni-recycle-ai.your-subdomain.workers.dev）
 * 11. 在网站中配置 AI_WORKER_URL 变量
 */

// ============ 配置 ============
// 模型选择（免费可用）：
// - @cf/meta/llama-3.1-8b-instruct（通用，速度快）
// - @cf/mistral/mistral-7b-instruct-v0.1（轻量）
// - @cf/google/gemma-2-9b-it（高质量）
// - @cf/deepseek-ai/deepseek-r1-distill-llama-8b（推理强）
const AI_MODEL = "@cf/meta/llama-3.2-3b-instruct";

// 系统提示词模板 — 根据不同模式设置 AI 角色
const SYSTEM_PROMPTS = {
  customer_service: `You are the AI customer service assistant for Uni-Recycle Go, a Hong Kong & China-based buyer specializing in faulty, non-functional and old smartphones.

Company facts:
- We BUY faulty/old smartphones in bulk (we do NOT sell phones)
- All brands accepted: iPhone, Samsung, Google Pixel, Huawei, Xiaomi, OPPO, OnePlus and more
- We also buy used parts, screens, boards and components
- MOQ: typically 50+ units, container loads preferred
- Payment: T/T, LC, escrow options available
- Shipping: from worldwide to Hong Kong / China
- Grading: Grade A/B/C for functional, Grade F for faulty (our core focus)
- We accept locked/iCloud/blacklist units at adjusted pricing
- Business hours: Mon-Fri 9:00-18:00 HKT
- Email: unirecyclego@outlook.com
- Website: https://perfumeshopgo.github.io/recycle/

Rules:
- Always respond in the SAME LANGUAGE as the user's message
- Be concise and professional
- If unsure about pricing, say "Please submit an enquiry form for a custom quote"
- Never claim to be human — you are an AI assistant
- For complex questions, guide users to the contact form`,

  translation: `You are a professional translation assistant for Uni-Recycle Go, an international smartphone trading company.

Rules:
- Translate the user's text accurately and professionally
- Support all languages: English, Traditional Chinese, Simplified Chinese, Korean, Japanese, Thai, French, Spanish, German, etc.
- For business/trade terms, use industry-standard terminology
- If the user specifies a target language, translate to that language
- If no target language is specified, translate to English by default
- Preserve numbers, brand names, and technical terms
- Format: provide only the translated text, no explanations`,

  marketing: `You are the AI marketing assistant for Uni-Recycle Go, a Hong Kong & China-based buyer of faulty and old smartphones.

Company positioning:
- B2B bulk buyer of faulty/non-functional/old smartphones
- Target suppliers: recyclers, repair shops, insurance carriers, wholesalers worldwide
- Key markets: UK, USA, Europe, Southeast Asia
- Value proposition: competitive pricing, reliable payments, long-term partnerships, container load capacity

Capabilities:
- Generate marketing email templates for supplier outreach
- Create social media posts (LinkedIn, Facebook)
- Write product descriptions and landing page copy
- Draft cold outreach messages
- Suggest marketing strategies and campaign ideas
- Create promotional slogans and taglines

Rules:
- Always respond in the SAME LANGUAGE as the user's request
- Be creative but professional
- Include clear calls-to-action
- Focus on B2B supplier acquisition, not consumer marketing`,

  operations: `You are the AI operations assistant for Uni-Recycle Go, an international smartphone trading company based in Hong Kong & China.

Business context:
- We purchase faulty/old smartphones in bulk from global suppliers
- We inspect, grade, and coordinate export to Hong Kong / China markets
- Key operations: supplier management, quality control, grading, logistics, payment coordination

Capabilities:
- Analyze supplier offers and suggest negotiation strategies
- Help create inspection checklists and QC procedures
- Suggest grading standards and quality control processes
- Help draft supplier contracts and agreements
- Analyze shipping/logistics options and costs
- Suggest inventory management best practices
- Help create operational SOPs and workflows
- Calculate pricing and margin estimates (with user-provided data)

Rules:
- Always respond in the SAME LANGUAGE as the user's request
- Be practical and actionable
- For pricing calculations, ask for specific data if not provided
- Suggest industry best practices for smartphone trading
- Include clear, step-by-step guidance`
};

// ============ CORS 处理 ============
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

// ============ 主处理函数 ============
export default {
  async fetch(request, env) {
    // 处理 OPTIONS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // 只接受 POST 请求
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: CORS_HEADERS
      });
    }

    try {
      const body = await request.json();
      const { message, mode = "customer_service", history = [], language } = body;

      if (!message || typeof message !== "string") {
        return new Response(JSON.stringify({ error: "Message is required" }), {
          status: 400,
          headers: CORS_HEADERS
        });
      }

      // 获取系统提示词
      const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.customer_service;

      // 构建消息历史
      const messages = [
        { role: "system", content: systemPrompt }
      ];

      // 添加历史对话（最多保留 10 轮，控制 token 用量）
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      // 添加当前用户消息
      messages.push({ role: "user", content: message });

      // 调用 Cloudflare Workers AI
      const accountId = env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = env.CLOUDFLARE_API_TOKEN;

      if (!accountId || !apiToken) {
        return new Response(JSON.stringify({
          error: "Server configuration missing. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN secrets."
        }), {
          status: 500,
          headers: CORS_HEADERS
        });
      }

      const aiResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: messages,
            max_tokens: 500,
            temperature: mode === "marketing" ? 0.8 : 0.5
          })
        }
      );

      const aiData = await aiResponse.json();

      if (!aiResponse.ok) {
        console.error("AI API error:", aiData);
        return new Response(JSON.stringify({
          error: aiData.errors?.[0]?.message || "AI service error",
          details: aiData
        }), {
          status: aiResponse.status,
          headers: CORS_HEADERS
        });
      }

      const reply = aiData.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

      // 返回回复
      return new Response(JSON.stringify({
        reply: reply,
        mode: mode,
        model: AI_MODEL,
        usage: aiData.usage || null
      }), {
        status: 200,
        headers: CORS_HEADERS
      });

    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        details: error.message
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
  }
};
