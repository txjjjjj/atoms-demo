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
      // First stream call (plan) yields 'PLAN'; later calls (code/review/iterate) yield 'REVISED'.
      stream: vi.fn(() => makeStream('REVISED')).mockImplementationOnce(() => makeStream('PLAN')),
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
