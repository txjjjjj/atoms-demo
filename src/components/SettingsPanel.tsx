import { useState } from 'react'
import {
  getLlmToken,
  setLlmToken,
  clearLlmToken,
  getLlmBaseUrl,
  setLlmBaseUrl,
} from '../lib/storage'
import { useAuthCtx } from '../App'

export function SettingsPanel() {
  const { profile, setDisplayName } = useAuthCtx()
  const [token, setToken] = useState(getLlmToken() ?? '')
  const [baseUrl, setBaseUrl] = useState(getLlmBaseUrl() ?? '')
  const [name, setName] = useState(profile?.display_name ?? '')
  const [saved, setSaved] = useState(false)

  const flashSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

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
              flashSaved()
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
        <h2 className="font-semibold mb-2">API 代理地址（可选）</h2>
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://atoms-proxy.xxx.workers.dev（留空则直连 BigModel）"
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              setLlmBaseUrl(baseUrl.trim())
              flashSaved()
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2"
          >
            保存
          </button>
          <button
            onClick={() => {
              setBaseUrl('')
              setLlmBaseUrl('')
            }}
            className="rounded-lg bg-slate-700 px-4 py-2"
          >
            清除
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          若浏览器直连 BigModel 遇到 CORS 报错，部署一个 Cloudflare Worker 代理（见
          <code className="mx-1">worker/README.md</code>）并把其 URL 填在这里。
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
