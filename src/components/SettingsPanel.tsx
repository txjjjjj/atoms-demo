import { useState } from 'react'
import { getLlmToken, setLlmToken, clearLlmToken } from '../lib/storage'
import { useAuthCtx } from '../App'

export function SettingsPanel() {
  const { profile, setDisplayName } = useAuthCtx()
  const [token, setToken] = useState(getLlmToken() ?? '')
  const [name, setName] = useState(profile?.display_name ?? '')
  const [saved, setSaved] = useState(false)

  return (
    <div className="p-4 max-w-md space-y-6">
      <div>
        <h2 className="font-semibold mb-2">LLM Token（BYO Key）</h2>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="粘贴你的 BigModel token"
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              setLlmToken(token)
              setSaved(true)
              setTimeout(() => setSaved(false), 1500)
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2"
          >
            保存
          </button>
          <button
            onClick={() => {
              clearLlmToken()
              setToken('')
            }}
            className="rounded-lg bg-slate-700 px-4 py-2"
          >
            清除
          </button>
          {saved && <span className="text-emerald-400 self-center text-sm">已保存</span>}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Token 仅存在你的浏览器 localStorage。前往 open.bigmodel.cn 获取。
        </p>
      </div>
      <div>
        <h2 className="font-semibold mb-2">昵称</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
        />
        <button
          onClick={() => setDisplayName(name)}
          className="mt-2 rounded-lg bg-emerald-600 px-4 py-2"
        >
          保存昵称
        </button>
      </div>
    </div>
  )
}
