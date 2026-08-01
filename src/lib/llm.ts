import Anthropic from '@anthropic-ai/sdk'
import { getLlmToken, getLlmBaseUrl } from './storage'

export const LlmConfig = {
  // Default to the Cloudflare Worker CORS proxy (BigModel's edge returns a
  // malformed double Access-Control-Allow-Origin header for browser calls).
  // Users can override with a direct BigModel URL in Settings if they prefer.
  baseURL: 'https://atoms-proxy.781647046.workers.dev',
  model: 'glm-5.2',
  maxTokens: 8000,
}

export function createLlmClient(): Anthropic {
  const authToken = getLlmToken()
  if (!authToken) {
    throw new Error('未配置 LLM Token，请在设置中填入。')
  }
  // Use the user-configured proxy/endpoint if set, else BigModel direct.
  const baseURL = getLlmBaseUrl() || LlmConfig.baseURL
  return new Anthropic({
    baseURL,
    authToken,
    dangerouslyAllowBrowser: true,
  })
}