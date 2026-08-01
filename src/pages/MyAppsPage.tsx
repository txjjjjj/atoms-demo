import { useEffect, useState } from 'react'
import { listMine, updateApp } from '../services/appsRepository'
import { AppCard } from '../components/AppCard'
import type { AppRecord } from '../types'
import { useAuthCtx } from '../App'

export function MyAppsPage() {
  const { user } = useAuthCtx()
  const [apps, setApps] = useState<AppRecord[]>([])
  const [open, setOpen] = useState<AppRecord | null>(null)

  async function reload() { if (user) setApps(await listMine(user.id)) }
  useEffect(() => { reload() }, [user])

  async function togglePublic(app: AppRecord) {
    await updateApp(app.id, { is_public: !app.is_public })
    reload()
  }

  if (open) {
    return (
      <div className="p-4 flex flex-col h-[calc(100vh-64px)] gap-2">
        <button onClick={() => setOpen(null)} className="text-slate-400 self-start">← 返回</button>
        <iframe title="preview" sandbox="allow-scripts" srcDoc={open.html} className="flex-1 w-full bg-white rounded-lg" />
      </div>
    )
  }
  return (
    <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map(a => <AppCard key={a.id} app={a} onOpen={() => setOpen(a)} onTogglePublic={() => togglePublic(a)} />)}
    </div>
  )
}
