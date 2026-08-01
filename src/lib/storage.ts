const KEY = 'atoms_demo_llm_token'
const BASE_URL_KEY = 'atoms_demo_llm_base_url'

export function getLlmToken(): string | null {
  return localStorage.getItem(KEY)
}
export function setLlmToken(token: string): void {
  localStorage.setItem(KEY, token)
}
export function clearLlmToken(): void {
  localStorage.removeItem(KEY)
}

// Optional CORS proxy / custom endpoint base URL (e.g. a Cloudflare Worker).
// When empty, the SDK calls BigModel directly.
export function getLlmBaseUrl(): string | null {
  return localStorage.getItem(BASE_URL_KEY)
}
export function setLlmBaseUrl(url: string): void {
  localStorage.setItem(BASE_URL_KEY, url)
}
export function clearLlmBaseUrl(): void {
  localStorage.removeItem(BASE_URL_KEY)
}