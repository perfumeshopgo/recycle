# Cloudflare Workers AI 部署指南

## 概述

网站已集成 Cloudflare Workers AI 多模式助手，支持 4 种模式：
- **客服 (Customer Service)** — 回答业务问题、报价咨询
- **翻译 (Translation)** — 多语言即时翻译
- **行销 (Marketing)** — 生成营销邮件、社交媒体文案
- **营运 (Operations)** — 运营建议、质检流程、谈判策略

**免费额度**：每天 10,000 Neurons（约可进行 200-500 次对话）

---

## 部署步骤

### 第一步：注册 Cloudflare 账号（免费）

1. 访问 https://dash.cloudflare.com/sign-up
2. 用邮箱注册（无需信用卡）
3. 验证邮箱

### 第二步：获取 Account ID

1. 登录 Cloudflare Dashboard
2. 左侧菜单选择 **Workers & Pages**
3. 页面右侧可以看到 **Account ID**（复制保存）

### 第三步：创建 API Token

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 **Create Token**
3. 找到 **Workers AI (beta)** 模板，点击 **Use template**
4. 权限确认：Account → Workers AI → Edit
5. 点击 **Continue to summary** → **Create Token**
6. **复制 Token 并保存**（只显示一次！）

### 第四步：安装 Wrangler CLI

在终端运行：
```bash
npm install -g wrangler
```

如果没有安装 Node.js，先安装：https://nodejs.org/

### 第五步：登录 Wrangler

```bash
wrangler login
```
会打开浏览器授权，点击 Allow。

### 第六步：创建 Worker 项目

```bash
# 在网站目录下创建 worker 项目
cd /Users/cyrus/Doubao/chats/2026-09-29/new-chat/phone-recycling-website
wrangler init uni-recycle-ai
```

按提示选择：
- Would you like to use git? → No
- Would you like to use TypeScript? → No
- Would you like to create a Worker at src/index.js? → Yes

### 第七步：复制 Worker 代码

将 `worker-ai-api.js` 的内容复制到 `uni-recycle-ai/src/index.js`：

```bash
cp worker-ai-api.js uni-recycle-ai/src/index.js
```

### 第八步：设置 Secrets（密钥）

```bash
cd uni-recycle-ai

# 设置 Account ID
wrangler secret put CLOUDFLARE_ACCOUNT_ID
# 粘贴你的 Account ID，按回车

# 设置 API Token
wrangler secret put CLOUDFLARE_API_TOKEN
# 粘贴你的 API Token，按回车
```

### 第九步：部署 Worker

```bash
wrangler deploy
```

部署成功后，会显示 Worker URL，例如：
```
https://uni-recycle-ai.your-username.workers.dev
```

**复制这个 URL！**

### 第十步：配置网站

1. 打开 `reclaim-global-trading.html`
2. 找到第 990 行左右的配置：
   ```javascript
   const AI_WORKER_URL = "";
   ```
3. 将 Worker URL 填入引号中：
   ```javascript
   const AI_WORKER_URL = "https://uni-recycle-ai.your-username.workers.dev";
   ```
4. 保存文件，复制为 index.html：
   ```bash
   cp reclaim-global-trading.html index.html
   ```
5. 推送到 GitHub：
   ```bash
   git add .
   git commit -m "Configure Cloudflare Workers AI"
   git push
   ```

---

## 验证 AI 功能

1. 打开网站：https://perfumeshopgo.github.io/recycle/
2. 点击右下角聊天按钮
3. 标题旁应显示 **AI** 紫色徽章
4. 聊天窗口顶部有 4 个模式按钮：Service / Translate / Marketing / Ops
5. 选择模式，输入问题，AI 会回复

---

## 常见问题

### Q: AI 没有回复？
A: 检查：
1. Worker URL 是否正确填入 `AI_WORKER_URL`
2. Worker 是否部署成功（访问 Worker URL 应显示 "Method not allowed"）
3. Secrets 是否正确设置
4. 浏览器控制台（F12）是否有错误信息

### Q: 免费额度用完了怎么办？
A: 每天 00:00 UTC 重置。如果用量大，可以升级到 Workers Paid 计划（$5/月，含 50 万 Neurons）。

### Q: 如何更换 AI 模型？
A: 编辑 `worker-ai-api.js` 中的 `AI_MODEL` 变量。可选模型：
- `@cf/meta/llama-3.1-8b-instruct`（默认，速度快）
- `@cf/google/gemma-2-9b-it`（高质量）
- `@cf/deepseek-ai/deepseek-r1-distill-llama-8b`（推理强）
- `@cf/mistral/mistral-7b-instruct-v0.1`（轻量）

### Q: 如何限制访问？
A: 可以在 Worker 中添加域名白名单，只允许你的网站调用。在 `fetch` 函数开头添加：
```javascript
const allowedOrigins = ["https://perfumeshopgo.github.io", "https://unirecyclego.com"];
const origin = request.headers.get("Origin");
if (origin && !allowedOrigins.includes(origin)) {
  return new Response("Forbidden", { status: 403 });
}
```

---

## 文件清单

- `worker-ai-api.js` — Cloudflare Worker 代码（AI API 代理）
- `reclaim-global-trading.html` — 网站主文件（已集成 AI 前端）
- `index.html` — GitHub Pages 入口（主文件副本）
- `CLOUDFLARE_AI_DEPLOY_GUIDE.md` — 本部署指南

---

## 技术支持

如遇问题，检查：
1. Cloudflare Dashboard → Workers → 你的 Worker → Logs（查看实时日志）
2. 浏览器 F12 → Console（查看前端错误）
3. 浏览器 F12 → Network → 查看 AI 请求的响应
