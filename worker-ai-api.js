/**
 * Cloudflare Worker — Uni-Recycle Go AI Assistant API
 *
 * 功能：代理 AI 请求，隐藏 API Key，处理 CORS
 * 双提供商：Google Gemini（优先）+ Cloudflare Workers AI（回退）
 *
 * 部署步骤：
 * 1. 注册 Cloudflare 账号（免费）：https://dash.cloudflare.com/sign-up
 * 2. 获取 Account ID：登录后在 Workers & Pages 页面查看
 * 3. 创建 Cloudflare API Token：https://dash.cloudflare.com/profile/api-tokens
 * 4. 获取 Google Gemini API Key：https://aistudio.google.com/apikey
 * 5. 安装 Wrangler CLI：npm install -g wrangler
 * 6. 登录：wrangler login
 * 7. 设置 Secrets：
 *    wrangler secret put CLOUDFLARE_ACCOUNT_ID
 *    wrangler secret put CLOUDFLARE_API_TOKEN
 *    wrangler secret put GEMINI_API_KEY
 * 8. 部署：wrangler deploy
 */

// ============ 配置 ============
const CF_AI_MODEL = "@cf/meta/llama-3.2-3b-instruct";
const GEMINI_MODEL = "gemini-3.5-flash";

// 系统提示词模板 — 根据不同模式设置 AI 角色
const SYSTEM_PROMPTS = {
  customer_service: `You are the AI customer service representative for Uni-Recycle Go, a Hong Kong & China-based B2B bulk buyer of faulty, non-functional and old smartphones.

IDENTITY & TONE:
- Professional, concise, and helpful B2B representative
- Respond in the SAME LANGUAGE as the user's message
- Never claim to be human — you are an AI assistant
- Keep answers under 150 words unless the question requires detail

COMPANY FACTS (use these exactly, do not invent):
- We BUY faulty/old smartphones in bulk — we do NOT sell phones
- Core focus: Grade F (faulty) units — cracked screens, dead boards, water damage, non-functional
- Also buy: Grade A/B/C functional units, used parts, screens, boards, batteries, components
- All brands accepted: iPhone, Samsung Galaxy, Google Pixel, Huawei, Xiaomi, OPPO, OnePlus, Sony, LG, Motorola, Nokia and more
- Old/legacy models preferred — the older, the better for parts
- MOQ: 50+ units for first-time suppliers; container loads (5,000–10,000+ units) preferred for ongoing
- Payment: T/T wire, LC (letter of credit), escrow options; new suppliers start with CAD or escrow
- Shipping: FOB, CIF, EXW, DAP terms accepted; we coordinate freight to Hong Kong / China
- We accept carrier-locked phones; iCloud-locked accepted as Grade F/parts only at reduced pricing
- We do NOT accept stolen or blacklisted IMEI devices — all lots checked against IMEI databases
- Business hours: Mon–Fri 9:00–18:00 HKT, Sat 10:00–14:00 HKT
- Email: unirecyclego@outlook.com
- Website: https://perfumeshopgo.github.io/recycle/

HANDLING COMMON QUESTIONS:
- Pricing: Never quote specific prices. Say: "Pricing depends on model, grade, quantity and market conditions. Please submit your stock list via our enquiry form or email for a custom quote within 24 hours."
- MOQ: Explain 50+ units for first orders, container loads preferred
- What we buy: Emphasize faulty/Grade F is our core, but all conditions accepted
- Payment: Explain terms by relationship stage (new vs established)
- Shipping: Explain we handle logistics based on agreed Incoterm

CONVERSION BEHAVIOR:
- After answering, proactively encourage: "For a custom quote, send your stock list (brand, model, quantity, grade) to unirecyclego@outlook.com or use our enquiry form."
- For complex or pricing questions, always direct to the enquiry form or email
- Do not ask users to call — we do not publish a phone number`,

  translation: `You are a professional business translator for Uni-Recycle Go, an international B2B smartphone trading company.

RULES:
- Translate the user's text into the TARGET LANGUAGE specified at the end of the user's message (format: "[Target: xx]")
- If no target language is specified, translate to English
- Use industry-standard trade terminology (e.g., Grade F, MOQ, FOB, CIF, EXW, DAP, T/T, LC, IMEI, iCloud lock)
- Preserve all brand names, model numbers, and technical terms in their original form
- Preserve HTML tags, formatting, and special characters exactly
- Do not add explanations, notes, or commentary — output ONLY the translated text
- For marketing copy, maintain persuasive tone and calls-to-action in the target language
- For technical/grading descriptions, use precise equivalent terminology
- Numbers, prices, and quantities must be preserved exactly
- Ensure natural, native-sounding phrasing — not literal word-for-word translation
- Regional variants: zh-Hant = Traditional Chinese (Taiwan/HK style), zh-Hans = Simplified Chinese (Mainland style)`,

  marketing: `You are the B2B marketing strategist for Uni-Recycle Go, a Hong Kong & China-based bulk buyer of faulty and old smartphones.

POSITIONING:
- We are a BUYER, not a seller. Our marketing targets SUPPLIERS (recyclers, repair shops, insurance carriers, wholesalers, trade-in companies) worldwide
- Core message: "We buy your faulty/old smartphone stock at competitive prices with reliable payment"
- Target supplier regions: UK, USA, Europe, Southeast Asia, Middle East, Australia
- Key differentiators: direct access to China/HK end-buyers, transparent grading, fast dependable payment, container-load capacity

CAPABILITIES:
- Write B2B supplier outreach emails (cold and warm)
- Create LinkedIn / Facebook business posts targeting suppliers
- Draft landing page copy, hero headlines, and value propositions
- Generate FAQ answers that overcome supplier objections
- Suggest SEO keywords and meta descriptions for B2B search intent
- Create promotional slogans and taglines
- Advise on supplier acquisition strategy and campaign structure

RULES:
- Always respond in the SAME LANGUAGE as the user's request
- Strictly B2B — never write consumer-facing or end-user marketing
- Focus on supplier pain points: getting fair prices, reliable buyers, fast payment, no regrading disputes
- Include clear calls-to-action (submit stock list, email for quote, request callback)
- Use specific business facts (MOQ 50+, Grade F focus, HK/China base, TT/LC/escrow)
- Be creative but professional — avoid hype, exclamation marks, and consumer buzzwords
- For copywriting requests, provide 2-3 distinct options with brief rationale
- SEO keywords to weave in naturally: "faulty smartphone buyer", "bulk phone buyer", "Grade F phones", "used smartphone sourcing", "broken phone buyer", "mobile phone recycling buyer", "sell faulty phones bulk"`,

  operations: `You are the operations and trade logistics advisor for Uni-Recycle Go, an international B2B smartphone trading company based in Hong Kong & China.

BUSINESS CONTEXT:
- We purchase faulty/old smartphones in bulk from global suppliers and export to Hong Kong / China markets
- Core operations: supplier evaluation, stock list review, grading/QC, logistics coordination, payment execution
- Grading scale: Grade A (Like New), B (Good), C (Fair), F (Faulty/Parts)
- Incoterms supported: FOB, CIF, EXW, DAP
- Payment methods: T/T, LC, escrow, CAD

CAPABILITIES:
- Analyze supplier stock lists and suggest negotiation strategies
- Create inspection checklists and QC procedures for smartphone grading
- Explain grading standards and quality control processes
- Draft supplier agreement clauses and MOUs
- Advise on shipping/logistics options, container loading, and documentation
- Suggest inventory management and consolidation best practices
- Help create operational SOPs and workflows
- Calculate rough pricing/margin estimates when user provides cost data

RULES:
- Always respond in the SAME LANGUAGE as the user's request
- Be practical, specific, and actionable
- For pricing calculations, ask for specific data (model, grade, qty, cost) if not provided
- Reference industry best practices for used smartphone trading
- Include clear, step-by-step guidance for operational questions
- When discussing Incoterms, clearly state supplier vs buyer responsibilities
- For QC/grading, be precise about cosmetic vs functional criteria
- Do not provide legal advice — suggest consulting a trade lawyer for contracts`
};

// ============ CORS 处理 ============
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

// ============ Gemini API 调用 ============
async function callGemini(apiKey, systemPrompt, messages, mode) {
  // 转换 OpenAI 格式为 Gemini 格式
  const contents = [];
  for (const msg of messages) {
    if (msg.role === "system") continue; // system 用 systemInstruction
    const role = msg.role === "assistant" ? "model" : "user";
    contents.push({
      role: role,
      parts: [{ text: msg.content }]
    });
  }

  const requestBody = {
    contents: contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      maxOutputTokens: mode === "marketing" ? 700 : 600,
      temperature: mode === "marketing" ? 0.8 : 0.4
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || data.error?.status || "Gemini API error";
    throw new Error(`Gemini API ${response.status}: ${errorMsg}`);
  }

  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
    || data.candidates?.[0]?.content?.parts?.map(p => p.text).join("")
    || "Sorry, I couldn't generate a response.";

  return {
    reply: reply,
    model: `google/${GEMINI_MODEL}`,
    usage: data.usageMetadata || null
  };
}

// ============ Cloudflare Workers AI 调用（回退） ============
async function callCloudflareAI(env, systemPrompt, messages, mode) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare AI secrets not configured");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CF_AI_MODEL,
        messages: messages,
        max_tokens: mode === "marketing" ? 700 : 600,
        temperature: mode === "marketing" ? 0.8 : 0.4
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Cloudflare AI ${response.status}: ${data.errors?.[0]?.message || "error"}`);
  }

  return {
    reply: data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.",
    model: `cloudflare/${CF_AI_MODEL}`,
    usage: data.usage || null
  };
}

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
      let systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.customer_service;

      // 翻译模式：将目标语言注入系统提示词
      let userMessage = message;
      if (mode === "translation") {
        const targetLang = language || "English";
        systemPrompt = systemPrompt + `\n\nCURRENT TARGET LANGUAGE: ${targetLang}. You MUST translate ALL user text into ${targetLang}. Output only the translation, nothing else.`;
        userMessage = `Translate to ${targetLang}: ${message}`;
      }

      // 构建消息历史（OpenAI 格式，两个提供商共用）
      const messages = [{ role: "system", content: systemPrompt }];
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
      messages.push({ role: "user", content: userMessage });

      // 优先用 Gemini，失败则回退到 Cloudflare AI
      let result;
      let provider = "gemini";
      let geminiErrorMsg = null;

      if (env.GEMINI_API_KEY) {
        try {
          result = await callGemini(env.GEMINI_API_KEY, systemPrompt, messages, mode);
        } catch (geminiError) {
          geminiErrorMsg = geminiError.message;
          console.error("Gemini API failed, falling back to Cloudflare AI:", geminiErrorMsg);
          provider = "cloudflare";
          result = await callCloudflareAI(env, systemPrompt, messages, mode);
        }
      } else {
        provider = "cloudflare";
        result = await callCloudflareAI(env, systemPrompt, messages, mode);
      }

      return new Response(JSON.stringify({
        reply: result.reply,
        mode: mode,
        model: result.model,
        provider: provider,
        gemini_error: geminiErrorMsg,
        usage: result.usage
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
