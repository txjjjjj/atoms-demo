import type { AppRecord } from '../types'

export function AppCard({ app, onOpen, onTogglePublic }: {
  app: AppRecord
  onOpen: () => void
  onTogglePublic?: () => void
}) {
  return (
    <div className="rounded-lg border border-slate-800 p-3 hover:border-slate-600">
      <div className="flex items-center justify-between">
        <button onClick={onOpen} className="font-medium text-left">{app.title}</button>
        {onTogglePublic && (
          <button onClick={onTogglePublic} className={`text-xs px-2 py-1 rounded ${app.is_public ? 'bg-emerald-700' : 'bg-slate-700'}`}>
            {app.is_public ? '已公开' : '公开'}
          </button>
        )}
      </div>
      <div className="text-xs text-slate-500 mt-1">
        {app.created_at ? new Date(app.created_at).toLocaleString() : '示例应用'}
      </div>
    </div>
  )
}
