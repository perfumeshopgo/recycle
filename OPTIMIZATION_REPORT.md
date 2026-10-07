# Uni-Recycle Go 网站优化报告

**优化日期**: 2026-10-07
**优化范围**: AI 助手系统提示词、全站文案、SEO、多语言翻译、性能清理
**提交版本**: dc9a91b (已推送至 origin/main，线上已生效)
**线上地址**: https://perfumeshopgo.github.io/recycle/

---

## 一、AI 助手系统提示词优化（最高优先级）

### 1.1 四种模式全面重写

| 模式 | 优化要点 |
|------|----------|
| **customer_service** | 明确 B2B 客服身份；新增定价/MOQ/付款/运输等常见问题处理规范；强制转化行为（每次回答后引导提交库存清单）；禁止报具体价格；完整业务事实清单 |
| **translation** | 修复目标语言参数 bug（原代码解构了 `language` 但从未使用，导致翻译始终默认英文）；运行时将目标语言注入系统提示词（高权重）+ 用户消息前缀；保留 HTML 标签/品牌名/贸易术语；区域变体区分（zh-Hant 港式繁体 vs zh-Hans 大陆简体） |
| **marketing** | 严格 B2B 供应商获客导向（禁止消费者营销）；明确供应商痛点（公平价格、可靠买家、快速付款、无重新分级纠纷）；SEO 关键词清单（faulty smartphone buyer, bulk phone buyer, Grade F 等）；文案请求返回 2-3 个选项附理由 |
| **operations** | 新增 Incoterms 买卖双方责任说明；分级标准精确化（外观 vs 功能）；谈判策略/QC 流程/物流方案能力扩展；禁止法律建议 |

### 1.2 其他 Worker 改进
- `max_tokens`: 从 500 提升至 marketing 700 / 其他 600，回答更完整
- `temperature`: customer_service 从 0.5 降至 0.4，回答更准确稳定
- 翻译模式语言修复：`language` 参数现在被正确传递给 AI

### 1.3 实测验证
- **customer_service**: 提问 "What do you buy?" → 准确回答收购故障机/Grade F/零件/全品牌
- **customer_service**: 提问 "How much for iPhone 12 faulty?" → 拒绝报价，引导提交库存清单（符合规范）
- **translation**: 英文→日语/韩语/法语/泰语/繁体中文 全部正确翻译（修复前返回英文）
- **marketing**: 生成 B2B 供应商开发邮件和 hero 标题选项

---

## 二、英文核心文案优化

### 2.1 SEO 元标签

| 字段 | 优化前 | 优化后 |
|------|--------|--------|
| **meta_title** (54字符) | Uni-Recycle Go — Faulty & Old Smartphone Buyer \| HK & China | **Uni-Recycle Go \| Bulk Faulty Smartphone Buyer, Grade F** |
| **meta_desc** (151字符) | 约230字符，冗长，关键词分散 | Hong Kong & China-based faulty smartphone buyer. We purchase bulk Grade F, broken & old phones of all brands plus used parts. T/T, LC & escrow payment. |

**关键词覆盖**: faulty smartphone buyer, bulk, Grade F, broken phones, all brands, used parts, T/T, LC, escrow — 均为 B2B 采购商高搜索意图词。

### 2.2 Hero 区
- **标题**: `We buy faulty & old smartphones — any condition accepted.` → `We buy faulty & old smartphones in bulk — any condition, any brand.`（增加 bulk 和 any brand，更精准）
- **描述**: 5句长描述 → 3句精炼价值主张（HK/China 买家 · 批量 · Grade F 核心 · 零件/屏幕/主板/电池 · 书面分级/公平价格/快速付款 · 欢迎整柜）
- **CTA 按钮**: `Submit Supplier Enquiry` → `Request a Quote`（更简洁通用）

### 2.3 About 区
- 标题更精准：`Hong Kong & China's bulk buyer for faulty & used smartphones.`
- 明确供应商类型：recyclers, insurers, repair chains, wholesale suppliers
- 去除冗余重复，两段各有侧重（合作模式 / 收购范围）

### 2.4 Products / Grading 区
- 标题增加 "broken" 和 "in bulk" 关键词
- 描述精简，突出 Grade F 核心和全品牌

### 2.5 Why Choose Us 区
- 6 个卖点全部改为第二人称、更紧凑的表述
- 强调：直连中国终端买家无中间商 / 书面分级无到货惊喜 / T/T·LC·escrow 准时付款 / 香港对接中国最大市场 / 专属客户经理 / IMEI+出口管制合规

### 2.6 FAQ 优化
- 全部 6 组问答精简，更专业
- **关键修复**: FAQ3 问题从 `Do you buy iPhones?` 改为 `Do you buy locked or iCloud-locked phones?`，与答案匹配（原问答严重不匹配）
- FAQ3 答案重写：明确区分运营商锁（接受）vs iCloud/激活锁（Grade F/零件价）vs 赃物/黑名单（拒绝）

### 2.7 CTA / Contact / Footer
- CTA 标题: `Have stock to sell?` → `Have faulty phone stock to sell?`（更精准）
- **关键修复**: footer_brand_desc 从 `Samsung Galaxy specialists`（不准确，公司收购全品牌）改为全品牌批量买家描述
- 联系区描述精简

---

## 三、SEO 结构化数据优化

### 3.1 JSON-LD URL 修复
- 原 JSON-LD 中 12 处 `https://unirecyclego.com/` 全部替换为实际地址 `https://perfumeshopgo.github.io/recycle/`
- 包括 Organization @id/url/logo、Service @id、WebSite @id/url、og:image、canonical 等

### 3.2 新增 FAQPage 结构化数据
- 添加 6 条 Question/Answer，与页面 FAQ 完全对应
- 可获得 Google 搜索结果富媒体展示（FAQ 折叠片段）

### 3.3 新增 ContactPoint
- Organization 下添加 contactPoint：邮箱 unirecyclego@outlook.com、sales 类型、7 种语言支持、香港工作时间

### 3.4 静态 Meta 标签同步
- `<title>`、`<meta description>`、og:title/description、twitter:title/description 的静态 content 值已与 I18N.en 保持一致
- 确保不执行 JS 的搜索引擎爬虫也能读取正确的 SEO 文案

---

## 四、多语言翻译同步

### 4.1 翻译范围
- 36 个优化后的英文字段 × 6 种语言（zh-Hant / zh-Hans / ko / ja / th / fr）= 216 条译文
- 覆盖 SEO、Hero、About、Products、Grading、Why Us、FAQ、CTA、Contact、Footer

### 4.2 翻译流程
1. 调用 Cloudflare Workers AI translation 模式批量翻译（144 次 API 调用）
2. 发现 AI 翻译质量问题：韩语混入越南语/中文碎片、泰语乱码重复、日语品牌名错译、简体中文前导空格和错字
3. 对全部 216 条译文进行人工重写润色，确保专业 B2B 语境

### 4.3 关键修复
- **非英文 meta_title 修复**: 原 zh-Hans/ko/ja/th/fr 的 meta_title 都错误聚焦 Samsung（如"二手 Samsung 及手机收购"），现已全部翻译为新的通用标题（批量故障智能手机收购商，Grade F）
- **品牌名/术语保留**: Uni-Recycle Go、iPhone、Samsung、Pixel、Grade F、T/T、LC、escrow、FOB/CIF/EXW/DAP、IMEI、iCloud 等均不翻译
- **HTML 标签保留**: hero_title 的 `<span class="accent">` 结构完整保留
- **FAQ3 锁机问题**: 6 种语言均准确区分运营商锁 / iCloud 锁 / 赃物拒绝

### 4.4 各语言 meta_title 示例
| 语言 | meta_title |
|------|------------|
| en | Uni-Recycle Go \| Bulk Faulty Smartphone Buyer, Grade F |
| zh-Hant | Uni-Recycle Go \| 大批量故障智能手機收購商，Grade F |
| zh-Hans | Uni-Recycle Go \| 大批量故障智能手机收购商，Grade F |
| ko | Uni-Recycle Go \| 대량 불량 스마트폰 매입, Grade F |
| ja | Uni-Recycle Go \| 不良スマートフォン大口買取、Grade F |
| th | Uni-Recycle Go \| ผู้รับซื้อสมาร์ทโฟนเสียจำนวนมาก Grade F |
| fr | Uni-Recycle Go \| Acheteur en gros de smartphones défectueux, Grade F |

---

## 五、性能与代码清理

### 5.1 已执行的修复
| 修复项 | 说明 |
|--------|------|
| 删除无效 CSS 规则 | `@media (prefers-reduced-motion)` 末尾多余逗号、无声明块 |
| 删除未使用 CSS 类 | `.phone-card.main`, `.phone-screen`, `.img-zoom` 等（HTML 中无对应元素，遗留自旧版设计） |
| 删除未使用 @keyframes | `float`, `floatSlow`, `floatSlow2`, `shimmer`, `gradientFlow`（无任何 animation 引用） |
| 删除重复 @keyframes | 早期 `floatBadge` 被后期定义覆盖 |
| 删除重复 CSS 定义 | `.scroll-progress` 两处定义，删除早期冗余版 |
| 清理空属性 | 7 个 `<h2 class="">` 空 class 属性 |
| 删除 write-only 变量 | `chatOpened` 变量被赋值但从未读取 |

### 5.2 发现但未执行的问题（建议后续处理）
| 严重度 | 问题 | 建议 |
|--------|------|------|
| 🔴 高 | 重复的滚动进度条（HTML 静态 + JS 动态创建各一个） | 删除 HTML 中的静态版本，保留 IIFE 中带 rAF 节流的版本 |
| 🟡 中 | 重复的 IntersectionObserver（两个 observer 观察重叠的 class） | 合并为一个 observer |
| 🟡 中 | `aiEnabled` 变量 write-only（赋值6次从未读取） | 删除该变量及其赋值 |
| 🟢 低 | 装饰性图片 alt 文本应改为空 | about-warehouse.jpg / shipping-port.jpg 作为低透明度背景，建议 `alt=""` |
| 🟢 低 | 孤立图片资源 product-iphone.jpg/webp（1.1MB+65KB）未被引用 | 可安全删除 |
| 🟢 低 | 13 个 JPG 共 9.3MB，可压缩至 200-300KB/张 | webp 已优先加载，JPG 仅作旧浏览器 fallback |

---

## 六、验证结果

### 6.1 代码验证
- ✅ `index.html` 与 `reclaim-global-trading.html` 字节级完全一致（272,577 字节）
- ✅ I18N 对象可正常解析，7 种语言各 245 个 key
- ✅ JSON-LD 合法 JSON，包含 Organization / Service / WebSite / FAQPage 四种类型
- ✅ 旧域名 unirecyclego.com 0 残留
- ✅ Git 提交 dc9a91b 已推送至 origin/main

### 6.2 浏览器自动化验证（线上版本）
- ✅ 页面正常加载，标题显示新 SEO 标题
- ✅ **控制台 0 错误，0 警告**
- ✅ AI 聊天 customer_service 模式正常，回答专业（聚焦 Grade F、全品牌、零件收购）
- ✅ AI 聊天 translation 模式正常，正确翻译为当前页面语言（日语测试通过）
- ✅ 语言切换正常（英语→日语验证，所有文案正确切换）
- ✅ FAQ3 显示为 "Do you buy locked or iCloud-locked phones?"（已修复）
- ✅ Hero 区显示新标题和 "Request a Quote" 按钮
- ✅ AI Worker URL 正确配置为 https://uni-recycle-ai.prefumeshop.workers.dev

### 6.3 AI API 实测
- ✅ customer_service: 准确回答业务问题，拒绝报价并引导提交清单
- ✅ translation: 英→日/韩/法/泰/繁中 全部正确（修复前始终返回英文）
- ✅ marketing: 生成 B2B 导向文案选项
- ✅ Worker 已重新部署（Version ID: 256c42cd）

---

## 七、修改文件清单

| 文件 | 改动 |
|------|------|
| `index.html` | 文案优化 + 翻译同步 + JSON-LD 增强 + 性能清理 + URL 修复 |
| `reclaim-global-trading.html` | 与 index.html 完全同步 |
| `worker-ai-api.js` | 4 种模式系统提示词重写 + 翻译语言参数修复 + max_tokens/temperature 调整 |
| `uni-recycle-ai/src/index.js` | 与 worker-ai-api.js 完全同步，已部署至 Cloudflare |

**总计**: 4 个文件，+800 行 / -660 行

---

## 八、后续建议

1. **修复重复滚动进度条和 IntersectionObserver**（性能审计发现的中高优先级问题）
2. **压缩 JPG 图片**至 200-300KB/张，减少 fallback 体积
3. **删除孤立的 product-iphone 图片资源**
4. **考虑添加 sitemap.xml 和 robots.txt**（GitHub Pages 站点）
5. **AI 助手可考虑增加"快速选择目标语言"功能**，让翻译模式更灵活
6. **定期用 Google Search Console 检查** FAQPage 富媒体搜索结果展示情况
