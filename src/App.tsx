import { createContext, useContext } from 'react'
import { HashRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { WorkspacePage } from './pages/WorkspacePage'
import { MyAppsPage } from './pages/MyAppsPage'
import { GalleryPage } from './pages/GalleryPage'
import { SettingsPanel } from './components/SettingsPanel'

const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null)

export function useAuthCtx() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuthCtx must be used within AuthProvider')
  return c
}

export default function App() {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-slate-600 border-t-slate-100" />
      </div>
    )
  }

  if (!auth.user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <button
          onClick={() => {
            auth.signInAnon().catch((err) => console.error('Anonymous sign-in failed:', err))
          }}
          className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          以匿名身份开始
        </button>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={auth}>
      <HashRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <nav className="flex gap-4 p-4 border-b border-slate-800">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'text-white' : 'text-slate-400')}>工作台</NavLink>
            <NavLink to="/my-apps" className={({ isActive }) => (isActive ? 'text-white' : 'text-slate-400')}>我的应用</NavLink>
            <NavLink to="/gallery" className={({ isActive }) => (isActive ? 'text-white' : 'text-slate-400')}>画廊</NavLink>
            <Link to="/settings" className="ml-auto text-slate-400">设置</Link>
          </nav>
          <Routes>
            <Route path="/" element={<WorkspacePage />} />
            <Route path="/my-apps" element={<MyAppsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/settings" element={<SettingsPanel />} />
          </Routes>
        </div>
      </HashRouter>
    </AuthContext.Provider>
  )
}
