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