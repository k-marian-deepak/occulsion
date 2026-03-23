import { useNavigate, useLocation } from 'react-router-dom'
import {
  Network, Shield, BarChart2,
  MessageSquare, Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/workflows',  icon: <Network size={20} /> },
  { path: '/cases',      icon: <Shield size={20} /> },
  { path: '/insights',   icon: <BarChart2 size={20} /> },
]

const BOTTOM_ITEMS = [
  { path: '/help',       icon: <MessageSquare size={20} /> },
  { path: '/settings',   icon: <Settings size={20} /> },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <aside style={{
      width: 64, background: 'var(--bg)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0',
      flexShrink: 0, height: '100%',
    }}>
      {/* ── Top Workspace Icon ─────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#4dc4d6', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}>
          S
        </div>
      </div>

      {/* ── Main Nav ──────────────────────────────────── */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'var(--bg3)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text3)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if(!active) e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { if(!active) e.currentTarget.style.color = 'var(--text3)' }}
            >
              {item.icon}
            </button>
          )
        })}
      </nav>

      {/* ── Bottom Nav ────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 'auto', marginBottom: 16 }}>
        {BOTTOM_ITEMS.map(item => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'var(--bg3)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text3)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if(!active) e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { if(!active) e.currentTarget.style.color = 'var(--text3)' }}
            >
              {item.icon}
            </button>
          )
        })}
      </div>

      {/* ── User Avatar ───────────────────────────────── */}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => navigate('/settings')}
          style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text2)', overflow: 'hidden',
          }}
        >
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" style={{ width: '100%', height: '100%' }} />
        </button>
      </div>
    </aside>
  )
}
