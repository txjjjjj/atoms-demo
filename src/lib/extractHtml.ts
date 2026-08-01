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