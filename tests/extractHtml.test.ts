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