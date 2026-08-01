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
    html: '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#f1f5f9;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0}h1{font-size:72px;margin:0 0 8px;font-variant-numeric:tabular-nums}p{color:#94a3b8;margin:0 0 24px}.btns{display:flex;gap:12px}button{font-size:18px;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;background:#10b981;color:#fff}button.reset{background:#475569}</style></head><body><h1 id="t">25:00</h1><p id="s">准备开始</p><div class="btns"><button id="b">开始</button><button class="reset" id="r">重置</button></div><script>let total=25*60,left=total,timer=null,running=false;const t=document.getElementById("t"),s=document.getElementById("s"),b=document.getElementById("b"),r=document.getElementById("r");function fmt(n){return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")}function render(){t.textContent=fmt(left)}function tick(){left--;render();if(left<=0){clearInterval(timer);timer=null;running=false;b.textContent="开始";s.textContent="专注完成！"}}b.onclick=()=>{if(running){clearInterval(timer);timer=null;running=false;b.textContent="继续";s.textContent="已暂停"}else{timer=setInterval(tick,1000);running=true;b.textContent="暂停";s.textContent="专注中…"}};r.onclick=()=>{clearInterval(timer);timer=null;running=false;left=total;b.textContent="开始";s.textContent="准备开始";render()};render()</script></body></html>',
    is_public: true,
    forked_from: null,
    created_at: '',
  },
]
