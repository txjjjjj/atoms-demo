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
