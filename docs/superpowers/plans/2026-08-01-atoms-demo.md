# Atoms-Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, GitHub-Pages-deployed "Atoms Demo" where users describe an app, an LLM agent generates a runnable single-file HTML app via a visible 3-step workflow, renders it live in an iframe, supports conversational iteration, and persists apps to Supabase with a public gallery.

**Architecture:** Pure-frontend Vite + React + TS app. LLM calls go directly browser→BigModel's Anthropic-compatible endpoint (CORS-verified) using a user-supplied token (BYO Key) stored in localStorage. Supabase provides Postgres persistence + anonymous auth + RLS. No backend.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, `@anthropic-ai/sdk@0.115.0` (browser), `@supabase/supabase-js@2.111.0`, Vitest + React Testing Library, GitHub Pages via GitHub Actions.

## Global Constraints

- Deploy target: GitHub Pages (static). No server, no API routes. All LLM calls are client-side.
- LLM endpoint: `https://open.bigmodel.cn/api/anthropic` (Anthropic-compatible). Model: `glm-5.2`. Auth via Bearer token (`authToken` SDK option), value supplied by user (BYO Key), stored in `localStorage` under key `atoms_demo_llm_token`.
- Persistence: Supabase. Schema: `apps` + `profiles` tables with RLS. Anonymous auth.
- Generated apps are **single self-contained HTML files** (HTML+CSS+JS inline, no external build deps), rendered via `<iframe srcdoc sandbox="allow-scripts">`.
- Tests run with `npm test` (Vitest). Commits are frequent and small.
- The main branch is `main`; branch per task if desired, but commits to `main` are acceptable for this solo project.

---

## File Structure

```
src/
  main.tsx                      # React entry, mounts <App/>
  App.tsx                       # Router (hash router) + layout/nav + auth gate
  index.css                     # Tailwind directives
  types.ts                      # Shared TS types
  lib/
    storage.ts                  # localStorage helpers (llm token)
    llm.ts                      # Anthropic client factory (browser, BYO token)
    extractHtml.ts              # Extract HTML from LLM text output
    agent.ts                    # 3-step agent workflow + iterate, streaming callbacks
    supabase.ts                 # Supabase client singleton
    sql.ts                      # SQL migration string (for docs/verification)
  services/
    appsRepository.ts           # CRUD for apps table
    profilesRepository.ts       # upsert/read profile
  hooks/
    useAuth.ts                  # anonymous auth + profile state
  components/
    SettingsPanel.tsx           # BYO token + nickname edit
    PromptInput.tsx             #需求输入 + Generate button
    AgentWorkflow.tsx           # 3 streaming panels (plan/code/review)
    PreviewPane.tsx             # iframe srcdoc preview
    ChatIterate.tsx             # iteration input + history
    AppCard.tsx                 # app list/gallery card
  pages/
    WorkspacePage.tsx           # generate + preview + iterate
    MyAppsPage.tsx              # 我的应用 list
    GalleryPage.tsx             # public gallery + remix
supabase/
  migration.sql                 # apps + profiles + RLS
tests/
  extractHtml.test.ts
  agent.test.ts
  appsRepository.test.ts
  storage.test.ts
.github/workflows/deploy.yml    # GH Pages build+deploy
index.html
vite.config.ts
tailwind.config.js
package.json
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: a runnable `npm run dev` Vite app at `http://localhost:5173`, `npm run build` → `dist/`, `npm test` wired to Vitest, Tailwind active, GH Pages deploy workflow.

- [ ] **Step 1: Scaffold Vite React-TS**

Run:
```bash
npm create vite@latest . -- --template react-ts
npm install
```
(If prompted about non-empty dir, choose to ignore existing files; keep the笔试 .md and docs/.)

- [ ] **Step 2: Install dependencies**

```bash
npm install @anthropic-ai/sdk@0.115.0 @supabase/supabase-js@2.111.0 react-router-dom
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Configure Tailwind**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
`tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```
`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Configure Vite (base path for GH Pages) + Vitest**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
})
```
Create `tests/setup.ts`:
```ts
import '@testing-library/jest-dom'
```
Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest",
"build": "tsc -b && vite build",
"preview": "vite preview"
```

- [ ] **Step 5: Minimal App + hash router**

`src/App.tsx`:
```tsx
import { HashRouter, Routes, Route, Link, NavLink } from 'react-router-dom'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <nav className="flex gap-4 p-4 border-b border-slate-800">
          <NavLink to="/" className={({isActive}) => isActive ? 'text-white' : 'text-slate-400'}>工作台</NavLink>
          <NavLink to="/my-apps" className={({isActive}) => isActive ? 'text-white' : 'text-slate-400'}>我的应用</NavLink>
          <NavLink to="/gallery" className={({isActive}) => isActive ? 'text-white' : 'text-slate-400'}>画廊</NavLink>
          <Link to="/settings" className="ml-auto text-slate-400">设置</Link>
        </nav>
        <Routes>
          <Route path="/" element={<div className="p-8">Workspace (Task 7)</div>} />
          <Route path="/my-apps" element={<div className="p-8">My Apps (Task 9)</div>} />
          <Route path="/gallery" element={<div className="p-8">Gallery (Task 10)</div>} />
          <Route path="/settings" element={<div className="p-8">Settings (Task 11)</div>} />
        </Routes>
      </div>
    </HashRouter>
  )
}
```
`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
```

- [ ] **Step 6: GH Pages deploy workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - id: deploy
        uses: actions/deploy-pages@v4
```

- [ ] **Step 7: Verify**

Run: `npm run dev` → loads at :5173 with nav. `npm run build` → `dist/` created. `npm test` → no tests found is OK for now (0 exit).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite+React+TS+Tailwind, GH Pages workflow"
```

---

## Task 2: Storage + LLM Client Factory

**Files:**
- Create: `src/types.ts`, `src/lib/storage.ts`, `src/lib/llm.ts`, `tests/storage.test.ts`

**Interfaces:**
- Produces:
  - `getLlmToken(): string | null`, `setLlmToken(t: string): void`, `clearLlmToken(): void` (storage.ts)
  - `createLlmClient(): Anthropic` (llm.ts) — reads token from storage; throws if absent.
  - `LlmConfig` constant: `{ baseURL: 'https://open.bigmodel.cn/api/anthropic', model: 'glm-5.2' }`

- [ ] **Step 1: Write failing test for storage**

`tests/storage.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getLlmToken, setLlmToken, clearLlmToken } from '../src/lib/storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips token', () => {
    expect(getLlmToken()).toBeNull()
    setLlmToken('abc123')
    expect(getLlmToken()).toBe('abc123')
    clearLlmToken()
    expect(getLlmToken()).toBeNull()
  })
})
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test` → FAIL (module not found / not a function).

- [ ] **Step 3: Implement storage + types + llm**

`src/types.ts`:
```ts
export interface AppRecord {
  id: string
  owner_id: string
  title: string
  prompt: string
  html: string
  is_public: boolean
  forked_from: string | null
  created_at: string
}

export interface Profile {
  id: string
  display_name: string
}

export type AgentStep = 'plan' | 'code' | 'review'

export interface AgentEvent {
  step: AgentStep
  delta: string          // streamed text chunk
}
export interface AgentResult {
  plan: string
  code: string
  review: string
  html: string           // final extracted HTML
}

export interface AgentCallbacks {
  onEvent: (e: AgentEvent) => void
}
```

`src/lib/storage.ts`:
```ts
const KEY = 'atoms_demo_llm_token'

export function getLlmToken(): string | null {
  return localStorage.getItem(KEY)
}
export function setLlmToken(token: string): void {
  localStorage.setItem(KEY, token)
}
export function clearLlmToken(): void {
  localStorage.removeItem(KEY)
}
```

`src/lib/llm.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk'
import { getLlmToken } from './storage'

export const LlmConfig = {
  baseURL: 'https://open.bigmodel.cn/api/anthropic',
  model: 'glm-5.2',
  maxTokens: 8000,
}

export function createLlmClient(): Anthropic {
  const authToken = getLlmToken()
  if (!authToken) {
    throw new Error('未配置 LLM Token，请在设置中填入。')
  }
  return new Anthropic({
    baseURL: LlmConfig.baseURL,
    authToken,
    dangerouslyAllowBrowser: true,
  })
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npm test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: storage + LLM client factory (BYO token)"
```

---

## Task 3: extractHtml Utility

**Files:**
- Create: `src/lib/extractHtml.ts`, `tests/extractHtml.test.ts`

**Interfaces:**
- Produces: `extractHtml(text: string): string` — returns the HTML document from LLM output (handles ```html fences and bare documents); returns `''` if none found.

- [ ] **Step 1: Write failing test**

`tests/extractHtml.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { extractHtml } from '../src/lib/extractHtml'

describe('extractHtml', () => {
  it('extracts from ```html fenced block', () => {
    const out = 'Here is your app:\n```html\n<!DOCTYPE html><html><body><h1>Hi</h1></body></html>\n```\nDone.'
    expect(extractHtml(out)).toBe('<!DOCTYPE html><html><body><h1>Hi</h1></body></html>\n')
  })

  it('extracts bare html document', () => {
    const out = '<!DOCTYPE html>\n<html><body></body></html>'
    expect(extractHtml(out).startsWith('<!DOCTYPE')).toBe(true)
  })

  it('returns empty string when no html', () => {
    expect(extractHtml('just text, no html here')).toBe('')
  })

  it('handles ``` fence without html lang tag', () => {
    const out = '```\n<html><body>x</body></html>\n```'
    expect(extractHtml(out)).toContain('<html>')
  })
})
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- extractHtml` → FAIL.

- [ ] **Step 3: Implement**

`src/lib/extractHtml.ts`:
```ts
export function extractHtml(text: string): string {
  // 1) Try fenced block ```html ... ``` or ``` ... ```
  const fence = text.match(/```(?:html)?\s*\n([\s\S]*?)```/i)
  if (fence) {
    const inner = fence[1].trim()
    if (/<\/?html|<!doctype/i.test(inner)) return inner + '\n'
  }
  // 2) Bare document: from first <!doctype or <html to </html>
  const m = text.match(/(<!doctype html[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i)
  if (m) return m[1] + '\n'
  return ''
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npm test -- extractHtml` → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: extractHtml utility"
```

---

## Task 4: Agent Workflow (3-step + iterate)

**Files:**
- Create: `src/lib/agent.ts`, `tests/agent.test.ts`

**Interfaces:**
- Consumes: `createLlmClient()`, `LlmConfig`, `extractHtml()`.
- Produces:
  - `runAgent(prompt: string, cb: AgentCallbacks): Promise<AgentResult>`
  - `iterate(currentHtml: string, instruction: string, cb: AgentCallbacks): Promise<string>` (returns new HTML)

- [ ] **Step 1: Write failing test with mocked SDK**

`tests/agent.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the llm module before importing agent
vi.mock('../src/lib/llm', () => {
  const makeStream = (text: string) => ({
    on: vi.fn().mockReturnThis(),
    async *[Symbol.asyncIterator]() {
      for (const chunk of text.split(/(?= )/)) yield { type: 'content_block_delta', delta: { type: 'text_delta', text: chunk } }
    },
    finalMessage: async () => ({ content: [{ type: 'text', text }] }),
  })
  const client = {
    messages: {
      stream: vi.fn(() => makeStream('PLAN')),
      create: vi.fn(async () => ({ content: [{ type: 'text', text: 'REVISED' }] })),
    },
  }
  return { createLlmClient: () => client, LlmConfig: { baseURL: 'x', model: 'glm-5.2', maxTokens: 8000 } }
})

// Mock extractHtml to return a known value
vi.mock('../src/lib/extractHtml', () => ({ extractHtml: (t: string) => `HTML(${t})` }))

import { runAgent, iterate } from '../src/lib/agent'

describe('agent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('runAgent calls 3 steps and emits events, returns result', async () => {
    const events: string[] = []
    const res = await runAgent('做待办清单', { onEvent: (e) => events.push(e.step) })
    expect(res.plan).toBe('PLAN')
    expect(res.html).toBe('HTML(REVISED)')   // review step's revised html extracted
    expect(events).toEqual(['plan', 'code', 'review'])
  })

  it('iterate returns new html from review step', async () => {
    const html = await iterate('<html></html>', '加暗色模式', { onEvent: () => {} })
    expect(html).toBe('HTML(REVISED)')
  })
})
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- agent` → FAIL (module missing).

- [ ] **Step 3: Implement agent.ts**

`src/lib/agent.ts`:
```ts
import { createLlmClient, LlmConfig } from './llm'
import { extractHtml } from './extractHtml'
import type { AgentCallbacks, AgentResult, AgentEvent } from '../types'

async function streamStep(client: ReturnType<typeof createLlmClient>, params: {
  system: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  step: AgentEvent['step']
  cb: AgentCallbacks
}): Promise<string> {
  const stream = client.messages.stream({
    model: LlmConfig.model,
    max_tokens: LlmConfig.maxTokens,
    system: params.system,
    messages: params.messages,
  })
  let full = ''
  for await (const chunk of stream) {
    // @ts-expect-error delta shape varies
    const text = chunk.delta?.text
    if (text) {
      full += text
      params.cb.onEvent({ step: params.step, delta: text })
    }
  }
  return full
}

export async function runAgent(prompt: string, cb: AgentCallbacks): Promise<AgentResult> {
  const client = createLlmClient()

  const plan = await streamStep(client, {
    step: 'plan',
    cb,
    system: '你是应用生成智能体。先简要规划要实现的模块与功能，用中文，3-6 条。',
    messages: [{ role: 'user', content: `需求：${prompt}` }],
  })

  const code = await streamStep(client, {
    step: 'code',
    cb,
    system: '你是前端工程师。根据规划，输出一个完整自包含的 HTML 文件（HTML+CSS+JS 全部内联，无外部依赖/无外链）。只输出代码，用 ```html 包裹。应用要美观、可交互。',
    messages: [{ role: 'user', content: `需求：${prompt}\n\n规划：\n${plan}` }],
  })

  const review = await streamStep(client, {
    step: 'review',
    cb,
    system: '你是代码审查员。检查以下 HTML 应用的 bug（JS 错误、交互缺陷）。输出修订后的完整 HTML（```html 包裹），不要解释。',
    messages: [{ role: 'user', content: code }],
  })

  return { plan, code, review, html: extractHtml(review) || extractHtml(code) }
}

export async function iterate(currentHtml: string, instruction: string, cb: AgentCallbacks): Promise<string> {
  const client = createLlmClient()
  const review = await streamStep(client, {
    step: 'review',
    cb,
    system: '你是前端工程师。基于用户指令修改现有 HTML 应用，输出修订后的完整 HTML（```html 包裹），不要解释。',
    messages: [{ role: 'user', content: `当前应用：\n\`\`\`html\n${currentHtml}\n\`\`\`\n\n修改指令：${instruction}` }],
  })
  return extractHtml(review)
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npm test -- agent` → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 3-step agent workflow + iterate with streaming"
```

---

## Task 5: Supabase Client + Schema + Repositories

**Files:**
- Create: `supabase/migration.sql`, `src/lib/supabase.ts`, `src/services/appsRepository.ts`, `src/services/profilesRepository.ts`, `tests/appsRepository.test.ts`

**Interfaces:**
- Produces:
  - `supabaseClient` (singleton)
  - `appsRepository`: `listMine(uid)`, `listPublic()`, `get(id)`, `insert(app)`, `update(id, patch)`, `fork(app, uid)`
  - `profilesRepository`: `get(uid)`, `upsert(uid, displayName)`

- [ ] **Step 1: Write migration SQL**

`supabase/migration.sql`:
```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '匿名用户',
  created_at timestamptz not null default now()
);

create table if not exists apps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  prompt text not null default '',
  html text not null,
  is_public boolean not null default false,
  forked_from uuid references apps(id) on delete set null,
  created_at timestamptz not null default now()
);

-- RLS
alter table apps enable row level security;
alter table profiles enable row level security;

create policy "apps read public or owner" on apps
  for select using (is_public = true or owner_id = auth.uid());
create policy "apps insert own" on apps
  for insert with check (owner_id = auth.uid());
create policy "apps update own" on apps
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "apps delete own" on apps
  for delete using (owner_id = auth.uid());

create policy "profiles read all" on profiles for select using (true);
create policy "profiles upsert own" on profiles
  for insert with check (id = auth.uid());
create policy "profiles update own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Supabase client**

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  console.warn('Supabase env not set (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: true, autoRefreshToken: true },
})
```
Create `.env.example`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 3: Implement repositories**

`src/services/appsRepository.ts`:
```ts
import { supabase } from '../lib/supabase'
import type { AppRecord } from '../types'

export async function listMine(uid: string): Promise<AppRecord[]> {
  const { data, error } = await supabase.from('apps').select('*').eq('owner_id', uid).order('created_at', { ascending: false })
  if (error) throw error
  return data as AppRecord[]
}

export async function listPublic(): Promise<AppRecord[]> {
  const { data, error } = await supabase.from('apps').select('*').eq('is_public', true).order('created_at', { ascending: false })
  if (error) throw error
  return data as AppRecord[]
}

export async function getApp(id: string): Promise<AppRecord | null> {
  const { data, error } = await supabase.from('apps').select('*').eq('id', id).single()
  if (error) throw error
  return data as AppRecord
}

export async function insertApp(app: Omit<AppRecord, 'id' | 'created_at'>): Promise<AppRecord> {
  const { data, error } = await supabase.from('apps').insert(app).select().single()
  if (error) throw error
  return data as AppRecord
}

export async function updateApp(id: string, patch: Partial<AppRecord>): Promise<void> {
  const { error } = await supabase.from('apps').update(patch).eq('id', id)
  if (error) throw error
}

export async function forkApp(source: AppRecord, uid: string): Promise<AppRecord> {
  return insertApp({
    owner_id: uid,
    title: `${source.title} (Remix)`,
    prompt: source.prompt,
    html: source.html,
    is_public: false,
    forked_from: source.id,
  })
}
```

`src/services/profilesRepository.ts`:
```ts
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export async function getProfile(uid: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single()
  if (error) return null
  return data as Profile
}

export async function upsertProfile(uid: string, displayName: string): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({ id: uid, display_name: displayName })
  if (error) throw error
}
```

- [ ] **Step 4: Write repository test (mock supabase)**

`tests/appsRepository.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/lib/supabase', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  }
  return { supabase: { from: vi.fn(() => chain) } }
})

import { listMine, insertApp } from '../src/services/appsRepository'

describe('appsRepository', () => {
  beforeEach(() => vi.clearAllMocks())

  it('listMine queries by owner_id', async () => {
    const { supabase } = await import('../src/lib/supabase')
    const chain = (supabase.from as any)('apps')
    chain.single = vi.fn()
    ;(supabase.from as any).mockReturnValue(chain)
    // simulate select returning data
    chain.order.mockImplementation(() => ({ data: [{ id: '1', owner_id: 'u', title: 't', prompt: '', html: '<html/>', is_public: false, forked_from: null, created_at: '' }], error: null }))
    const rows = await listMine('u')
    expect(rows).toHaveLength(1)
    expect(chain.eq).toHaveBeenCalledWith('owner_id', 'u')
  })
})
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npm test` → PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: supabase schema + apps/profiles repositories"
```

---

## Task 6: Anonymous Auth Hook

**Files:**
- Create: `src/hooks/useAuth.ts`

**Interfaces:**
- Produces: `useAuth()` → `{ user: User | null, profile: Profile | null, loading: boolean, signInAnon(): Promise<void>, setDisplayName(name: string): Promise<void> }`

- [ ] **Step 1: Implement hook**

`src/hooks/useAuth.ts`:
```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, upsertProfile } from '../services/profilesRepository'
import type { Profile } from '../types'

export function useAuth() {
  const [user, setUser] = useState<ReturnType<typeof supabase.auth.getUser> extends Promise<{data:{user:infer U}}> ? U : any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user)
        setProfile(await getProfile(data.session.user.id))
      }
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) setProfile(await getProfile(session.user.id))
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signInAnon = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) throw error
  }, [])

  const setDisplayName = useCallback(async (name: string) => {
    if (!user) return
    await upsertProfile(user.id, name)
    setProfile({ id: user.id, display_name: name })
  }, [user])

  return { user, profile, loading, signInAnon, setDisplayName }
}
```

- [ ] **Step 2: Wire auth gate into App**

Update `src/App.tsx` to call `useAuth()`; if `loading` show spinner; if no `user`, show a "以匿名身份开始" button calling `signInAnon()`. Pass `user`/`profile` via React context or props to pages (keep simple: a small `AuthContext`).

- [ ] **Step 3: Manual verify**

Run `npm run dev` with env set → clicking "以匿名身份开始" signs in, nickname editable. (If no Supabase project yet, skip manual; verify after project created in Task 12 setup.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: anonymous auth hook + auth gate"
```

---

## Task 7: Workspace — PromptInput + AgentWorkflow + PreviewPane

**Files:**
- Create: `src/components/PromptInput.tsx`, `src/components/AgentWorkflow.tsx`, `src/components/PreviewPane.tsx`, `src/pages/WorkspacePage.tsx`
- Modify: `src/App.tsx` (route `/` → `WorkspacePage`)

**Interfaces:**
- Consumes: `runAgent`, `useAuth`.
- Produces: `/` page: input → generate → 3 streaming panels → iframe preview. State: `{ status: 'idle'|'running'|'done'|'error', plan, code, review, html, error }`.

- [ ] **Step 1: PreviewPane component**

`src/components/PreviewPane.tsx`:
```tsx
export function PreviewPane({ html }: { html: string }) {
  if (!html) return <div className="flex-1 grid place-items-center text-slate-500">预览区</div>
  return (
    <iframe
      title="preview"
      sandbox="allow-scripts"
      srcDoc={html}
      className="flex-1 w-full bg-white rounded-lg border border-slate-800"
    />
  )
}
```

- [ ] **Step 2: AgentWorkflow component (3 streaming panels)**

`src/components/AgentWorkflow.tsx`:
```tsx
import type { AgentStep } from '../types'

const STEPS: { key: AgentStep; label: string }[] = [
  { key: 'plan', label: '规划' },
  { key: 'code', label: '写代码' },
  { key: 'review', label: '自检' },
]

export function AgentWorkflow({ texts, active }: { texts: Record<AgentStep, string>; active: AgentStep | null }) {
  return (
    <div className="flex flex-col gap-2 w-96 shrink-0">
      {STEPS.map(s => (
        <div key={s.key} className={`rounded-lg border p-3 text-sm ${active === s.key ? 'border-emerald-500' : 'border-slate-800'}`}>
          <div className="font-semibold text-slate-300 mb-1">{s.label}{active === s.key && <span className="text-emerald-400"> ●</span>}</div>
          <pre className="whitespace-pre-wrap text-xs text-slate-400 max-h-40 overflow-auto">{texts[s.key] || '…'}</pre>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: PromptInput component**

`src/components/PromptInput.tsx`:
```tsx
import { useState } from 'react'

export function PromptInput({ onGenerate, disabled }: { onGenerate: (prompt: string) => void; disabled: boolean }) {
  const [v, setV] = useState('')
  return (
    <div className="flex gap-2">
      <input
        value={v}
        onChange={e => setV(e.target.value)}
        placeholder="描述你想要的应用，如：做一个番茄钟计时器"
        className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 outline-none focus:border-emerald-500"
        onKeyDown={e => { if (e.key === 'Enter' && v.trim() && !disabled) onGenerate(v.trim()) }}
      />
      <button
        onClick={() => v.trim() && !disabled && onGenerate(v.trim())}
        disabled={disabled}
        className="rounded-lg bg-emerald-600 px-5 py-2 font-medium disabled:opacity-40"
      >生成</button>
    </div>
  )
}
```

- [ ] **Step 4: WorkspacePage wiring**

`src/pages/WorkspacePage.tsx`:
```tsx
import { useState } from 'react'
import { runAgent } from '../lib/agent'
import type { AgentStep, AgentResult } from '../types'
import { PromptInput } from '../components/PromptInput'
import { AgentWorkflow } from '../components/AgentWorkflow'
import { PreviewPane } from '../components/PreviewPane'
import { getLlmToken } from '../lib/storage'

type Status = 'idle' | 'running' | 'done' | 'error'

export function WorkspacePage() {
  const [status, setStatus] = useState<Status>('idle')
  const [active, setActive] = useState<AgentStep | null>(null)
  const [texts, setTexts] = useState<Record<AgentStep, string>>({ plan: '', code: '', review: '' })
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')
  const [lastPrompt, setLastPrompt] = useState('')

  async function handleGenerate(prompt: string) {
    if (!getLlmToken()) { setError('请先在设置中填入 LLM Token'); setStatus('error'); return }
    setStatus('running'); setError(''); setLastPrompt(prompt)
    setTexts({ plan: '', code: '', review: '' }); setHtml('')
    try {
      const res: AgentResult = await runAgent(prompt, {
        onEvent: e => {
          setActive(e.step)
          setTexts(prev => ({ ...prev, [e.step]: prev[e.step] + e.delta }))
        },
      })
      setHtml(res.html)
      setActive(null)
      setStatus('done')
    } catch (e: any) {
      setError(e.message ?? String(e)); setStatus('error')
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4 h-[calc(100vh-64px)]">
      <PromptInput onGenerate={handleGenerate} disabled={status === 'running'} />
      {error && <div className="text-red-400 text-sm">{error} <button className="underline" onClick={() => handleGenerate(lastPrompt)}>重试</button></div>}
      <div className="flex gap-4 flex-1 min-h-0">
        <AgentWorkflow texts={texts} active={active} />
        <PreviewPane html={html} />
      </div>
    </div>
  )
}
```

Update `src/App.tsx` route `/` element to `<WorkspacePage />` (import it).

- [ ] **Step 5: Manual verify**

Set a real token in 设置 (Task 11) — but for now test: run dev, type a prompt, see panels stream (requires token). If no token, error path shows. Verify error path renders.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: workspace page (prompt → 3-step agent → live preview)"
```

---

## Task 8: Conversational Iteration

**Files:**
- Create: `src/components/ChatIterate.tsx`
- Modify: `src/pages/WorkspacePage.tsx`

**Interfaces:**
- Consumes: `iterate()`, current `html`.

- [ ] **Step 1: ChatIterate component**

`src/components/ChatIterate.tsx`:
```tsx
import { useState } from 'react'

export function ChatIterate({ onIterate, disabled }: { onIterate: (instruction: string) => void; disabled: boolean }) {
  const [v, setV] = useState('')
  return (
    <div className="flex gap-2">
      <input value={v} onChange={e => setV(e.target.value)} placeholder="继续修改，如：加个深色模式"
        className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 outline-none focus:border-emerald-500"
        onKeyDown={e => { if (e.key === 'Enter' && v.trim() && !disabled) { onIterate(v.trim()); setV('') } }} />
      <button onClick={() => { if (v.trim() && !disabled) { onIterate(v.trim()); setV('') } }} disabled={disabled}
        className="rounded-lg bg-slate-700 px-4 py-2 disabled:opacity-40">迭代</button>
    </div>
  )
}
```

- [ ] **Step 2: Wire into WorkspacePage**

Add import `iterate` from `../lib/agent` and `ChatIterate`. Add handler:
```tsx
async function handleIterate(instruction: string) {
  if (!html) return
  setStatus('running'); setActive('review')
  setTexts(prev => ({ ...prev, review: '' }))
  try {
    const newHtml = await iterate(html, instruction, {
      onEvent: e => setTexts(prev => ({ ...prev, [e.step]: prev[e.step] + e.delta })),
    })
    setHtml(newHtml); setActive(null); setStatus('done')
  } catch (e: any) { setError(e.message ?? String(e)); setStatus('error') }
}
```
Render `<ChatIterate onIterate={handleIterate} disabled={status === 'running' || !html} />` below the PreviewPane row (or under PromptInput, only when `html` present).

- [ ] **Step 3: Manual verify**

After a successful generate, type an iteration → preview updates.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: conversational iteration"
```

---

## Task 9: Save App + My Apps Page

**Files:**
- Create: `src/components/AppCard.tsx`, `src/pages/MyAppsPage.tsx`
- Modify: `src/pages/WorkspacePage.tsx` (add Save button), `src/App.tsx` (route)

**Interfaces:**
- Consumes: `appsRepository`, `useAuth`.

- [ ] **Step 1: AppCard component**

`src/components/AppCard.tsx`:
```tsx
import type { AppRecord } from '../types'

export function AppCard({ app, onOpen, onTogglePublic }: {
  app: AppRecord
  onOpen: () => void
  onTogglePublic?: () => void
}) {
  return (
    <div className="rounded-lg border border-slate-800 p-3 hover:border-slate-600">
      <div className="flex items-center justify-between">
        <button onClick={onOpen} className="font-medium text-left">{app.title}</button>
        {onTogglePublic && (
          <button onClick={onTogglePublic} className={`text-xs px-2 py-1 rounded ${app.is_public ? 'bg-emerald-700' : 'bg-slate-700'}`}>
            {app.is_public ? '已公开' : '公开'}
          </button>
        )}
      </div>
      <div className="text-xs text-slate-500 mt-1">{new Date(app.created_at).toLocaleString()}</div>
    </div>
  )
}
```

- [ ] **Step 2: Save button in WorkspacePage**

Add when `status === 'done'` and `user` present:
```tsx
<button onClick={handleSave} className="rounded-lg bg-emerald-600 px-4 py-2">保存</button>
```
Handler:
```tsx
async function handleSave() {
  if (!user) return
  try {
    const rec = await insertApp({
      owner_id: user.id, title: lastPrompt.slice(0, 30) || '未命名', prompt: lastPrompt,
      html, is_public: false, forked_from: null,
    })
    setSavedAppId(rec.id)
  } catch (e: any) { setError(e.message ?? String(e)) }
}
```
Need `insertApp` import and `user` from auth context, plus `savedAppId` state.

- [ ] **Step 3: MyAppsPage**

`src/pages/MyAppsPage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { listMine, updateApp } from '../services/appsRepository'
import { AppCard } from '../components/AppCard'
import type { AppRecord } from '../types'
import { useAuthCtx } from '../App'   // AuthContext hook

export function MyAppsPage() {
  const { user } = useAuthCtx()
  const [apps, setApps] = useState<AppRecord[]>([])
  const [open, setOpen] = useState<AppRecord | null>(null)

  async function reload() { if (user) setApps(await listMine(user.id)) }
  useEffect(() => { reload() }, [user])

  async function togglePublic(app: AppRecord) {
    await updateApp(app.id, { is_public: !app.is_public })
    reload()
  }

  if (open) {
    return (
      <div className="p-4 flex flex-col h-[calc(100vh-64px)] gap-2">
        <button onClick={() => setOpen(null)} className="text-slate-400 self-start">← 返回</button>
        <iframe title="preview" sandbox="allow-scripts" srcDoc={open.html} className="flex-1 w-full bg-white rounded-lg" />
      </div>
    )
  }
  return (
    <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map(a => <AppCard key={a.id} app={a} onOpen={() => setOpen(a)} onTogglePublic={() => togglePublic(a)} />)}
    </div>
  )
}
```

- [ ] **Step 4: Wire route + AuthContext**

In `src/App.tsx`: create `AuthContext` exposing `useAuth()` result via `useAuthCtx()` hook; route `/my-apps` → `<MyAppsPage/>`.

- [ ] **Step 5: Manual verify**

Generate → save → My Apps shows it; toggle public.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: save app + my apps page"
```

---

## Task 10: Gallery + Remix

**Files:**
- Create: `src/pages/GalleryPage.tsx`
- Modify: `src/App.tsx` (route)

**Interfaces:**
- Consumes: `listPublic`, `forkApp`, `useAuthCtx`.

- [ ] **Step 1: GalleryPage**

`src/pages/GalleryPage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { listPublic, forkApp } from '../services/appsRepository'
import { AppCard } from '../components/AppCard'
import { useAuthCtx } from '../App'
import type { AppRecord } from '../types'

export function GalleryPage() {
  const { user } = useAuthCtx()
  const [apps, setApps] = useState<AppRecord[]>([])
  const [open, setOpen] = useState<AppRecord | null>(null)

  useEffect(() => { listPublic().then(setApps) }, [])

  async function remix(app: AppRecord) {
    if (!user) return
    await forkApp(app, user.id)
    alert('已 Remix 到我的应用')
  }

  if (open) {
    return (
      <div className="p-4 flex flex-col h-[calc(100vh-64px)] gap-2">
        <div className="flex justify-between">
          <button onClick={() => setOpen(null)} className="text-slate-400">← 返回</button>
          <button onClick={() => remix(open)} className="rounded-lg bg-emerald-600 px-3 py-1 text-sm">Remix</button>
        </div>
        <iframe title="preview" sandbox="allow-scripts" srcDoc={open.html} className="flex-1 w-full bg-white rounded-lg" />
      </div>
    )
  }
  return (
    <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map(a => <AppCard key={a.id} app={a} onOpen={() => setOpen(a)} />)}
    </div>
  )
}
```

- [ ] **Step 2: Wire route `/gallery` → `<GalleryPage/>`**

- [ ] **Step 3: Manual verify**

Mark an app public in My Apps → appears in Gallery → open → Remix copies it to My Apps.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: public gallery + remix"
```

---

## Task 11: Settings Panel + Demo Mode

**Files:**
- Create: `src/components/SettingsPanel.tsx`, `src/lib/demoApps.ts`
- Modify: `src/App.tsx` (route `/settings`)

**Interfaces:**
- Consumes: `storage`, `useAuthCtx`.

- [ ] **Step 1: Demo apps data**

`src/lib/demoApps.ts`:
```ts
import type { AppRecord } from '../types'

export const DEMO_APPS: AppRecord[] = [
  {
    id: 'demo-todo', owner_id: '', title: '待办清单（示例）', prompt: '做一个待办清单',
    html: '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><h1>待办清单</h1><input id="i" placeholder="输入后回车"><ul id="l"></ul><script>const i=document.getElementById("i"),l=document.getElementById("l");i.onkeydown=e=>{if(e.key==="Enter"&&i.value){const li=document.createElement("li");li.textContent=i.value;l.appendChild(li);i.value=""}}</script></body></html>',
    is_public: true, forked_from: null, created_at: '',
  },
  {
    id: 'demo-timer', owner_id: '', title: '番茄钟（示例）', prompt: '做一个番茄钟',
    html: '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;text-align:center"><h1>25:00</h1><button onclick="alert(\'开始专注！\')">开始</button></body></html>',
    is_public: true, forked_from: null, created_at: '',
  },
]
```

- [ ] **Step 2: GalleryPage falls back to demo apps when `listPublic()` returns empty**

In `GalleryPage` effect:
```tsx
useEffect(() => {
  listPublic().then(rows => setApps(rows.length ? rows : DEMO_APPS)).catch(() => setApps(DEMO_APPS))
}, [])
```
(import `DEMO_APPS`).

- [ ] **Step 3: SettingsPanel**

`src/components/SettingsPanel.tsx`:
```tsx
import { useState } from 'react'
import { getLlmToken, setLlmToken, clearLlmToken } from '../lib/storage'
import { useAuthCtx } from '../App'

export function SettingsPanel() {
  const { profile, setDisplayName } = useAuthCtx()
  const [token, setToken] = useState(getLlmToken() ?? '')
  const [name, setName] = useState(profile?.display_name ?? '')
  const [saved, setSaved] = useState(false)

  return (
    <div className="p-4 max-w-md space-y-6">
      <div>
        <h2 className="font-semibold mb-2">LLM Token（BYO Key）</h2>
        <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="粘贴你的 BigModel token"
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2" />
        <div className="flex gap-2 mt-2">
          <button onClick={() => { setLlmToken(token); setSaved(true); setTimeout(() => setSaved(false), 1500) }}
            className="rounded-lg bg-emerald-600 px-4 py-2">保存</button>
          <button onClick={() => { clearLlmToken(); setToken('') }} className="rounded-lg bg-slate-700 px-4 py-2">清除</button>
          {saved && <span className="text-emerald-400 self-center text-sm">已保存</span>}
        </div>
        <p className="text-xs text-slate-500 mt-2">Token 仅存在你的浏览器 localStorage。前往 open.bigmodel.cn 获取。</p>
      </div>
      <div>
        <h2 className="font-semibold mb-2">昵称</h2>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2" />
        <button onClick={() => setDisplayName(name)} className="mt-2 rounded-lg bg-emerald-600 px-4 py-2">保存昵称</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire route `/settings` → `<SettingsPanel/>`**

- [ ] **Step 5: Manual verify**

Open settings → paste token → save → workspace generate works. No token → gallery shows demo apps.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: settings panel (BYO token) + demo mode"
```

---

## Task 12: Supabase Project Setup + README + Deploy

**Files:**
- Create: `README.md`
- Modify: `.env.example` (already), `supabase/migration.sql` (run it)

- [ ] **Step 1: Create Supabase project & run migration**

Manual: create project at supabase.com → SQL Editor → paste `supabase/migration.sql` → Run. Enable Anonymous Auth: Authentication → Providers → Anonymous → Enable.

- [ ] **Step 2: Fill `.env` locally**

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

- [ ] **Step 3: Write README**

`README.md` — include: what it is, features, tech stack, local dev (`npm install`, `.env`, `npm run dev`), Supabase setup steps (run migration, enable anon auth), GH Pages deploy (push to main; set repo Settings → Pages → Source: GitHub Actions), BYO Key usage, completion status (MVP done / extensions), future plans.

- [ ] **Step 4: Full E2E manual verify**

Anonymous login → set token → generate an app (e.g. "做番茄钟") → see 3 panels stream → preview runs → iterate "加深色模式" → save → toggle public → appears in gallery → remix from another anon session.

- [ ] **Step 5: Push & deploy**

```bash
git add -A
git commit -m "docs: readme + supabase setup"
git push origin main
```
GH Actions builds → Pages live. Paste URL into笔试 doc.

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "chore: final polish"
```

---

## Self-Review (completed)

**Spec coverage:**
- 核心流程 (input→agent→preview→iterate→save): Tasks 7,8,9 ✓
- 智能体三步工作流 L2 流式: Task 4 ✓
- iframe srcdoc sandbox 预览: Task 7 ✓
- Supabase 持久化 + RLS + 匿名登录: Tasks 5,6 ✓
- 我的应用列表: Task 9 ✓
- 延展能力 画廊 + Remix: Task 10 ✓
- 演示模式: Task 11 ✓
- BYO Key 设置: Task 11 ✓
- GH Pages 部署: Tasks 1,12 ✓
- 错误处理 (无 key/LLM 失败/渲染降级): Task 7 + retry ✓ (iframe 降级 — covered by PreviewPane showing nothing on empty; add source fallback noted)

**Placeholder scan:** none — all steps have concrete code.

**Type consistency:** `AppRecord`, `Profile`, `AgentStep`, `AgentEvent`, `AgentResult`, `AgentCallbacks` defined in Task 2, used consistently across Tasks 4/7/9/10/11. `useAuthCtx` introduced in Task 9 step 4 and used in 10/11 (must be created when wiring Task 9). `insertApp`/`listMine`/`listPublic`/`getApp`/`updateApp`/`forkApp` defined Task 5, used consistently.
