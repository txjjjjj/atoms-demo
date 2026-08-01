import { useState } from 'react'

export function ChatIterate({ onIterate, disabled }: { onIterate: (instruction: string) => void; disabled: boolean }) {
  const [v, setV] = useState('')
  return (
    <div className="flex gap-2">
      <input value={v} onChange={e => setV(e.target.value)} placeholder="继续修改，如：加个深色模式"
        className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 outline-none focus:border-emerald-500"
        onKeyDown={e => { if (e.key === 'Enter' && v.trim() && !disabled) { onIterate(v.trim()); setV('') } }} />
      <button onClick={() => { if (v.trim() && !disabled) { onIterate(v.trim()); setV('') } }} disabled={disabled}
        className="rounded-lg bg-slate-700 px-4 py-2 disabled:opacity-40">迭代</button>
    </div>
  )
}
