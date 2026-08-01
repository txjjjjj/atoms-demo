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