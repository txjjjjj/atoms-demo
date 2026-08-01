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