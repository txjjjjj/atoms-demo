import { useEffect, useState } from 'react'
import { listPublic, forkApp } from '../services/appsRepository'
import { AppCard } from '../components/AppCard'
import { useAuthCtx } from '../App'
import type { AppRecord } from '../types'

export function GalleryPage() {
  const { user } = useAuthCtx()
  const [apps, setApps] = useState<AppRecord[]>([])
  const [open, setOpen] = useState<AppRecord | null>(null)

  useEffect(() => {
    let cancelled = false
    listPublic()
      .then((list) => {
        if (!cancelled) setApps(list)
      })
      .catch((err) => {
        console.error('Failed to load public apps:', err)
        if (!cancelled) setApps([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function remix(app: AppRecord) {
    if (!user) return
    await forkApp(app, user.id)
    alert('已 Remix 到我的应用')
  }

  if (open) {
    return (
      <div className="p-4 flex flex-col h-[calc(100vh-64px)] gap-2">
        <div className="flex justify-between">
          <button onClick={() => setOpen(null)} className="text-slate-400">← 返回</button>
          <button onClick={() => remix(open)} className="rounded-lg bg-emerald-600 px-3 py-1 text-sm">Remix</button>
        </div>
        <iframe title="preview" sandbox="allow-scripts" srcDoc={open.html} className="flex-1 w-full bg-white rounded-lg" />
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="p-8 text-slate-400">
        画廊还没有公开应用，去工作台生成一个并公开吧！
      </div>
    )
  }

  return (
    <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((a) => (
        <AppCard key={a.id} app={a} onOpen={() => setOpen(a)} />
      ))}
    </div>
  )
}
