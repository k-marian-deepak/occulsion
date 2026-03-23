import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, Layers, Shield, Activity,
  MessageSquare, Settings, BookOpen
} from 'lucide-react'
import { useState } from 'react'

const BUILD_ITEMS = [
  { label: 'Workflows', path: '/workflows' },
  { label: 'Integrations', path: '/integrations' },
  { label: 'Workspace Variables', path: '/variables' },
  { label: 'Templates', path: '/templates' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  
  const [buildOpen, setBuildOpen] = useState(true)

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <aside style={{
      width: 250, background: '#0e1015', borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh',
      color: '#fff', userSelect: 'none', fontFamily: 'inherit'
    }}>
      {/* ── Top Workspace Dropdown ───────────────────────── */}
      <div style={{ padding: '16px 16px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#4dc4d6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0
          }}>
            S
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Workspace</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>socrates-1</span>
          </div>
        </div>
        <ChevronDown size={14} color="#9ca3af" />
      </div>

      {/* ── Main Nav Accordions ────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '0 8px', gap: 2 }}>
        
        {/* Build Section */}
        <div>
          <button
            onClick={() => setBuildOpen(!buildOpen)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 6, color: '#fff', transition: 'background .1s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="fa-solid fa-layer-group" style={{ fontSize: 13, color: '#e2e8f0' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Build</span>
            </div>
            {buildOpen ? <ChevronUp size={14} color="#e2e8f0" /> : <ChevronDown size={14} color="#e2e8f0" />}
          </button>
          
          {buildOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 8 }}>
              {BUILD_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%', outline: 'none', border: 'none', cursor: 'pointer',
                    background: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: isActive(item.path) ? '#fff' : '#9ca3af',
                    padding: '8px 12px 8px 40px', textAlign: 'left',
                    fontSize: 13, fontWeight: isActive(item.path) ? 500 : 400,
                    borderRadius: 6, transition: 'background .1s, color .1s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.color = '#fff'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#9ca3af'
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Investigate Section */}
        <button
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: 6, color: '#e2e8f0', transition: 'background .1s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={14} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Investigate</span>
          </div>
          <ChevronDown size={14} color="#9ca3af" />
        </button>

        {/* Monitor Section */}
        <button
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: 6, color: '#e2e8f0', transition: 'background .1s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Activity size={14} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Monitor</span>
          </div>
          <ChevronDown size={14} color="#9ca3af" />
        </button>

      </div>

      {/* ── Bottom Nav ────────────────────────────────── */}
      <div style={{ padding: '16px 8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        <button
          onClick={() => navigate('/help')}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 6,
            color: '#e2e8f0', transition: 'background .1s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <MessageSquare size={14} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Knowledge Hub</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 6,
            color: '#e2e8f0', transition: 'background .1s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Settings size={14} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Settings</span>
        </button>
        
      </div>

      {/* ── User Avatar ───────────────────────────────── */}
      <div style={{ padding: '16px 20px 24px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#fff',
          overflow: 'hidden', flexShrink: 0
        }}>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>Bob Boyle</span>
      </div>

    </aside>
  )
}
