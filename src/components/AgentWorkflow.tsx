import type { AgentStep } from '../types'

const STEPS: { key: AgentStep; label: string }[] = [
  { key: 'plan', label: '规划' },
  { key: 'code', label: '写代码' },
  { key: 'review', label: '自检' },
]

export function AgentWorkflow({ texts, active }: { texts: Record<AgentStep, string>; active: AgentStep | null }) {
  return (
    <div className="flex flex-col gap-2 w-96 shrink-0">
      {STEPS.map(s => (
        <div key={s.key} className={`rounded-lg border p-3 text-sm ${active === s.key ? 'border-emerald-500' : 'border-slate-800'}`}>
          <div className="font-semibold text-slate-300 mb-1">{s.label}{active === s.key && <span className="text-emerald-400"> ●</span>}</div>
          <pre className="whitespace-pre-wrap text-xs text-slate-400 max-h-40 overflow-auto">{texts[s.key] || '…'}</pre>
        </div>
      ))}
    </div>
  )
}
