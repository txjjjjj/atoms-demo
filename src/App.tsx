import { HashRouter, Routes, Route, Link, NavLink } from 'react-router-dom'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <nav className="flex gap-4 p-4 border-b border-slate-800">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'text-white' : 'text-slate-400')}>工作台</NavLink>
          <NavLink to="/my-apps" className={({ isActive }) => (isActive ? 'text-white' : 'text-slate-400')}>我的应用</NavLink>
          <NavLink to="/gallery" className={({ isActive }) => (isActive ? 'text-white' : 'text-slate-400')}>画廊</NavLink>
          <Link to="/settings" className="ml-auto text-slate-400">设置</Link>
        </nav>
        <Routes>
          <Route path="/" element={<div className="p-8">Workspace (Task 7)</div>} />
          <Route path="/my-apps" element={<div className="p-8">My Apps (Task 9)</div>} />
          <Route path="/gallery" element={<div className="p-8">Gallery (Task 10)</div>} />
          <Route path="/settings" element={<div className="p-8">Settings (Task 11)</div>} />
        </Routes>
      </div>
    </HashRouter>
  )
}
