# Atoms-Demo

> AI 智能体驱动、一句话生成可运行网页应用的 Demo（全栈岗位笔试项目）。

## 项目简介

Atoms-Demo 是一个面向「全栈岗位笔试」的演示项目。用户用一句话描述需求（如「做一个番茄钟」），系统通过一个**三步智能体工作流**（规划 → 写代码 → 自检修订）流式生成一份自包含的 HTML 应用，并在沙盒 iframe 中实时预览。用户可继续用自然语言对话迭代（如「加深色模式」），满意后保存到云端，或公开到画廊供他人 Remix。

LLM 直连 BigModel（智谱）的 Anthropic 兼容端点，模型 `glm-5.2`；用户自带 Token（BYO Key），无需后端中转。数据持久化由 Supabase 提供（匿名登录 + RLS 行级安全）。

## 功能特性

- **BYO Key**：在「设置」页粘贴 BigModel token，存于浏览器 localStorage，无需服务端密钥。
- **三步智能体工作流**：规划（plan）→ 写代码（code）→ 自检修订（review），每一步流式输出到独立面板，过程可见。
- **iframe 实时预览**：通过 `srcdoc` + sandbox 渲染生成结果，安全隔离。
- **对话式迭代**：基于当前 HTML，用自然语言下达修改指令（如「加深色模式」），智能体增量改写并再次自检。
- **Supabase 持久化**：应用保存到 `apps` 表，匿名登录用户拥有自己的应用列表。
- **我的应用**：列出当前用户已保存的应用，可切换公开/私有、删除。
- **公开画廊 + Remix**：浏览所有公开应用，一键 Fork 到自己账号下二次创作。
- **演示模式**：未配置 token 或未登录时，可查看内置示例应用，便于评审演示。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 构建 | Vite 5 |
| 框架 | React 18 + TypeScript 5 |
| 样式 | Tailwind CSS 3 |
| LLM | `@anthropic-ai/sdk` 浏览器直连 BigModel 兼容端点（`https://open.bigmodel.cn/api/anthropic`，模型 `glm-5.2`） |
| 后端 | Supabase（Postgres + Auth 匿名登录 + RLS） |
| 路由 | react-router-dom 6（HashRouter，适配 GitHub Pages 静态托管） |
| 测试 | Vitest 2 + @testing-library/react |

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 Supabase URL 与 anon key（见下文 Supabase 配置）

# 3. 启动开发服务器
npm run dev

# 4. 运行测试
npm test

# 5. 生产构建
npm run build
```

构建产物输出到 `dist/`，可在本地预览：`npm run preview`。

> 使用前还需在「设置」页填入你的 BigModel（智谱）API Token，与 `~/.claude` 设置中一致的端点。

## Supabase 配置（手动步骤）

1. **创建项目**：前往 [supabase.com](https://supabase.com) 新建一个项目，记录区域与 Project URL。
2. **运行数据库迁移**：进入项目控制台 → **SQL Editor** → 新建查询 → 粘贴仓库中的 [`supabase/migration.sql`](supabase/migration.sql) → **Run**。该脚本会创建 `profiles`、`apps` 两张表、启用 RLS、配置行级安全策略，并创建用户注册时自动建立 profile 的触发器。
3. **启用匿名登录**：进入 **Authentication → Providers → Anonymous** → 打开 Enable。
4. **获取凭证**：进入 **Project Settings → API**，复制 **Project URL** 与 **anon public key**。
5. **填入 `.env`**：

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

> RLS 策略：`apps` 表仅允许读取公开应用或本人应用，仅允许本人增删改；`profiles` 表所有人可读、仅本人可写本人。

## GitHub Pages 部署（手动步骤）

仓库已附带 GitHub Actions 工作流 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)，push 到 `main` 分支或手动触发即可自动构建并发布到 GitHub Pages。

1. **推送代码到 GitHub**：将本仓库 push 到 GitHub 远程仓库的 `main` 分支。
2. **配置 Pages 来源**：仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。
3. **配置构建密钥**：仓库 **Settings → Secrets and variables → Actions** 添加两个 Secret（供构建时注入）：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **触发部署**：push 到 `main`（或在工作流页面手动 **Run workflow**）。Actions 会执行 `npm ci` → `npm run build` → 上传 `dist/` 产物 → 发布到 Pages。
5. **获取地址**：部署成功后在 **Settings → Pages** 顶部查看站点 URL，填入笔试文档。

> 注意：本应用为纯静态前端，**LLM Token 由用户自带**（在「设置」页填入，存 localStorage），因此部署侧无需配置 LLM 密钥；仅需 Supabase 两个 public 凭证作为构建期 Secret。

## BYO Key 使用说明

1. 注册并登录 [BigModel（智谱开放平台）](https://open.bigmodel.cn)，在控制台创建 API Key。
2. 该端点与 `~/.claude` 设置中 BigModel 兼容端点一致（`https://open.bigmodel.cn/api/anthropic`，模型 `glm-5.2`）。
3. 打开应用 → 顶部导航 **设置** → 粘贴 token → 保存。token 仅存于本机 localStorage，不上传服务端。
4. 回到工作台即可开始生成应用。未填 token 时可进入「演示模式」查看内置示例。

## 完成程度

**MVP（已完成）**
- 三步智能体工作流（规划 / 写代码 / 自检）流式输出
- 一句话生成自包含 HTML 应用，iframe 沙盒实时预览
- 对话式迭代修改
- Supabase 持久化 + 匿名登录 + RLS
- 我的应用列表（保存 / 公开切换 / 删除）
- BYO Key 设置页
- GitHub Pages 部署工作流
- Vitest 单元测试（storage / extractHtml / agent / appsRepository）

**扩展（已完成）**
- 公开画廊
- Remix（一键 Fork 他人公开应用）
- 演示模式（无 token / 未登录可查看示例）

**未做（留作未来）**
- 模型切换（目前固定 `glm-5.2`）
- 深色模式开关（当前为固定深色主题）

## 未来计划

- 多模型切换（在设置页选择不同 BigModel 模型 / 其他兼容端点）
- 深色 / 浅色主题切换
- 迭代版本管理（保存历史版本，可回滚）
- 社区点赞 / 收藏 / 评论
- 应用导出为单个 HTML 文件下载
- 生成结果代码高亮与一键复制
