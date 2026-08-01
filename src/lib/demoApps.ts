import type { AppRecord } from '../types'

export const DEMO_APPS: AppRecord[] = [
  {
    id: 'demo-todo',
    owner_id: '',
    title: '待办清单（示例）',
    prompt: '做一个待办清单',
    html: '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><h1>待办清单</h1><input id="i" placeholder="输入后回车"><ul id="l"></ul><script>const i=document.getElementById("i"),l=document.getElementById("l");i.onkeydown=e=>{if(e.key==="Enter"&&i.value){const li=document.createElement("li");li.textContent=i.value;l.appendChild(li);i.value=""}}</script></body></html>',
    is_public: true,
    forked_from: null,
    created_at: '',
  },
  {
    id: 'demo-timer',
    owner_id: '',
    title: '番茄钟（示例）',
    prompt: '做一个番茄钟',
    html: '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;text-align:center"><h1>25:00</h1><button onclick="alert(\'开始专注！\')">开始</button></body></html>',
    is_public: true,
    forked_from: null,
    created_at: '',
  },
]
