import { useState } from 'react'
import { runAgent, iterate } from '../lib/agent'
import type { AgentStep, AgentResult } from '../types'
import { PromptInput } from '../components/PromptInput'
import { AgentWorkflow } from '../components/AgentWorkflow'
import { PreviewPane } from '../components/PreviewPane'
import { ChatIterate } from '../components/ChatIterate'
import { getLlmToken } from '../lib/storage'
import { insertApp, updateApp } from '../services/appsRepository'
import { useAuthCtx } from '../App'

type Status = 'idle' | 'running' | 'done' | 'error'

export function WorkspacePage() {
  const { user } = useAuthCtx()
  const [status, setStatus] = useState<Status>('idle')
  const [active, setActive] = useState<AgentStep | null>(null)
  const [texts, setTexts] = useState<Record<AgentStep, string>>({ plan: '', code: '', review: '' })
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')
  const [lastPrompt, setLastPrompt] = useState('')
  const [savedAppId, setSavedAppId] = useState<string | null>(null)

  async function handleSave() {
    if (!user) return
    try {
      const rec = await insertApp({
        owner_id: user.id,
        title: lastPrompt.slice(0, 30) || '未命名',
        prompt: lastPrompt,
        html,
        is_public: false,
        forked_from: null,
      })
      setSavedAppId(rec.id)
    } catch (e: any) {
      setError(e.message ?? String(e))
    }
  }

  async function handleGenerate(prompt: string) {
    if (!getLlmToken()) { setError('请先在设置中填入 LLM Token'); setStatus('error'); return }
    setStatus('running'); setError(''); setLastPrompt(prompt); setSavedAppId(null)
    setTexts({ plan: '', code: '', review: '' }); setHtml('')
    try {
      const res: AgentResult = await runAgent(prompt, {
        onEvent: e => {
          setActive(e.step)
          setTexts(prev => ({ ...prev, [e.step]: prev[e.step] + e.delta }))
        },
      })
      if (!res.html) {
        setError('未能从模型输出提取到可运行的 HTML，请重试或调整需求')
        setStatus('error')
        setActive(null)
        return
      }
      setHtml(res.html)
      setActive(null)
      setStatus('done')
    } catch (e: any) {
      setError(e.message ?? String(e)); setStatus('error'); setActive(null)
    }
  }

  async function handleIterate(instruction: string) {
    if (!html) return
    setStatus('running'); setActive('review')
    setTexts(prev => ({ ...prev, review: '' }))
    try {
      const newHtml = await iterate(html, instruction, {
        onEvent: e => setTexts(prev => ({ ...prev, [e.step]: prev[e.step] + e.delta })),
      })
      if (!newHtml) {
        setError('未能从模型输出提取到可运行的 HTML，请重试或调整需求')
        setStatus('error'); setActive(null)
        return
      }
      setHtml(newHtml); setActive(null); setStatus('done')
      if (savedAppId) {
        try {
          await updateApp(savedAppId, { html: newHtml })
        } catch (e: any) {
          setError(e.message ?? String(e))
        }
      }
    } catch (e: any) { setError(e.message ?? String(e)); setStatus('error'); setActive(null) }
  }

  return (
    <div className="p-4 flex flex-col gap-4 h-[calc(100vh-64px)]">
      <PromptInput onGenerate={handleGenerate} disabled={status === 'running'} />
      {error && <div className="text-red-400 text-sm">{error} <button className="underline" onClick={() => handleGenerate(lastPrompt)}>重试</button></div>}
      {status === 'done' && user && (
        savedAppId ? (
          <div className="text-emerald-400 text-sm">已保存</div>
        ) : (
          <button onClick={handleSave} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-white font-medium self-start">保存</button>
        )
      )}
      <div className="flex gap-4 flex-1 min-h-0">
        <AgentWorkflow texts={texts} active={active} />
        <PreviewPane html={html} />
      </div>
      {html && <ChatIterate onIterate={handleIterate} disabled={status === 'running' || !html} />}
    </div>
  )
}
