# Atoms-Demo 设计文档

> ROOT AI Native 全栈工程师笔试 —— 一个可运行的 "Atoms Demo"
> 纯静态、GitHub Pages 部署版

## 1. 背景与目标

Atoms（atoms.dev）是下一代 AI Agent 平台：用户用自然语言描述需求，智能体驱动生成可运行的网页应用。

本 Demo 复刻这一核心体验的简化版：**输入需求 → 智能体多步生成 → 实时预览可交互应用 → 对话迭代 → 持久化与分享**。

设计取舍的核心约束：**部署在 GitHub Pages（纯静态、无后端服务器）**，因此 LLM 调用在浏览器内直接发起，API Key 由用户自带（BYO Key）。

## 2. 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | Vite + React + TypeScript | 纯静态构建，GH Pages 部署最干净（避免 Next.js 静态导出的 basePath/刷新 404 坑） |
| 样式 | Tailwind CSS | |
| LLM | `@anthropic-ai/sdk`（`dangerouslyAllowBrowser: true`） | 指向智谱 BigModel 兼容端点 `https://open.bigmodel.cn/api/anthropic`，模型 `glm-5.2`；与本地 `~/.claude/settings.json` 保持一致 |
| 数据库 | Supabase（JS 客户端） | Postgres + 匿名登录 + RLS，纯前端可用 |
| 部署 | GitHub Pages | 通过 GitHub Actions 自动构建发布 |

**CORS 已验证**：BigModel 端点对浏览器跨域请求返回 `access-control-allow-origin`（反射 Origin）、允许 `POST` 与所需 headers（`content-type, authorization, x-api-key, anthropic-version`），浏览器直连可行。

## 3. API Key 处理（静态部署的核心取舍）

- 无后端 → 采用 **BYO Key**：用户在"设置"中粘贴自己的 BigModel token，存 `localStorage`，前端 SDK 直连。
- 取舍：面试官/访客需自带 Key 才能生成新应用。
- 缓解：内置 **演示模式**，预置 2-3 个已生成好的示例应用，无需 Key 即可浏览画廊与预览效果；UI 明确引导如何填入 Key 解锁生成。

## 4. 核心用户流程

1. 首次进入 → 匿名登录（Supabase），可编辑昵称
2. 在输入框描述需求（如"做一个番茄钟计时器"）
3. 点击生成 → 右侧**智能体工作流面板**实时显示三步：**规划 → 写代码 → 自检修订**
4. 完成后下方**预览区**用 iframe 渲染生成的应用，立即可交互
5. 可**继续对话迭代**（"加个深色模式"）→ AI 基于当前代码修改 → 预览刷新
6. 满意后**保存** → 进入"我的应用"列表；可勾选**公开到画廊**

## 5. 智能体工作流（L2，前端执行）

封装在 `src/services/agent.ts`，三次顺序 LLM 调用，结果流式推送到 UI 对应面板：

- **Step 1 规划（Plan）**：系统提示要求模型先输出简短结构化计划（要做哪些模块/功能）。流式显示在"规划"面板。
- **Step 2 写代码（Code）**：基于规划生成**完整自包含 HTML 文件**（HTML + CSS + JS 写在同一文件内，无外部依赖）。流式显示在"代码"面板。
- **Step 3 自检（Review）**：将代码回喂模型，要求挑 bug 并输出修订版完整 HTML。流式显示在"自检"面板；最终渲染用修订版。

**迭代修改**（`iterate`）：传入当前 HTML + 新指令，模型返回修订后的完整 HTML，重新渲染。

流式实现：Anthropic SDK 的 `messages.stream()`，通过回调按 step 分发增量到 UI。

## 6. 实时预览机制

- `<iframe srcdoc={html} sandbox="allow-scripts">` 渲染生成代码
- `sandbox` 不给 `allow-same-origin`，隔离生成代码，防止访问父页面/同源资源
- 自包含单文件，无需打包，100% 可运行
- 渲染失败降级：显示源码 + 错误提示

## 7. 数据模型（Supabase）

**`apps` 表**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid | 匿名用户 id（FK auth.users） |
| title | text | 应用标题 |
| prompt | text | 原始需求 |
| html | text | 生成的完整 HTML |
| is_public | bool | 是否公开到画廊 |
| forked_from | uuid nullable | Remix 来源应用 |
| created_at | timestamptz | |

**`profiles` 表**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | = auth.users.id |
| display_name | text | 可编辑昵称 |

**RLS 策略**
- `apps`：`select` 对 `is_public = true` 或 `owner_id = auth.uid()` 开放；`insert/update/delete` 仅 `owner_id = auth.uid()`
- `profiles`：`select` 全部开放；`insert/update` 仅 `id = auth.uid()`

**认证**：Supabase 匿名登录，访客自动获得 user id；首次可设置昵称。

## 8. 延展能力

- 🎨 **公开画廊**：浏览所有 `is_public` 应用，点击在 iframe 中直接运行
- **Remix**：将画廊中任一应用 fork 到自己账号，继续对话修改

## 9. 完成范围

**MVP（必做）**
- BYO Key 设置（localStorage）
- 输入需求 → 流式三步智能体工作流（规划/写代码/自检）
- iframe 实时预览
- 对话迭代修改
- Supabase 匿名登录 + 持久化 + "我的应用"列表
- 演示模式（预置示例应用，免 Key 可浏览）

**扩展（时间富余）**
- 公开画廊 + Remix
- 深色模式
- 模型切换（glm-5.2 / glm-4.7）

## 10. 错误处理

- 未填 Key → 引导至设置页
- LLM 调用失败/超时 → 友好提示 + 重试按钮
- 生成代码 iframe 渲染失败 → 降级显示源码
- Supabase 离线/失败 → 本地操作不阻塞，提示重连

## 11. 测试

- `agent.ts`：规划解析、HTML 提取、迭代 diff 的单元测试（mock SDK）
- Supabase 仓库层：mock 客户端测 CRUD 与 RLS 前置校验
- 关键组件：预览 iframe 安全属性、流式面板状态机
