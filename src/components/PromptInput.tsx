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
