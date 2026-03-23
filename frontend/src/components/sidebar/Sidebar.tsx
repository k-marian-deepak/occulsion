import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, Shield,
  MessageSquare, Settings, Plus, Check, X
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

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
  const [isHovered, setIsHovered] = useState(false)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [activeWorkspace, setActiveWorkspace] = useState('my workspace')

  const isCollapsed = !isHovered

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setWorkspaceMenuOpen(false) }}
      style={{
      width: isCollapsed ? 68 : 250, background: '#0e1015', borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh',
      color: '#fff', userSelect: 'none', fontFamily: 'inherit',
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative',
      overflow: 'visible', zIndex: 100 // ensure it overlaps nicely if needed by layout
    }}>
      {/* ── Top Workspace Dropdown ───────────────────────── */}
      <div ref={menuRef} style={{ position: 'relative', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <div 
          onClick={() => !isCollapsed && setWorkspaceMenuOpen(!workspaceMenuOpen)}
          style={{ 
            padding: '16px', 
            cursor: isCollapsed ? 'default' : 'pointer', display: 'flex', alignItems: 'center', 
            justifyContent: 'space-between',
            transition: 'background .15s'
          }}
          onMouseEnter={e => { if (!isCollapsed) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#785b51', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 600, flexShrink: 0
            }}>
              {activeWorkspace.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <span style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Workspace</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{activeWorkspace}</span>
            </div>
          </div>
          <div style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center' }}>
            <ChevronDown size={14} color="#e2e8f0" />
          </div>
        </div>

        {/* Workspace Switcher Menu */}
        {workspaceMenuOpen && !isCollapsed && (
          <div className="animate-fade-in" style={{ 
            position: 'absolute', top: 66, left: 16, 
            width: 'calc(100% - 32px)', background: '#1c1e23', border: '1px solid #333842', 
            borderRadius: 8, padding: 8, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 2, 
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)' 
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', padding: '8px 12px' }}>Switch Workspace</div>
            {['my workspace', 'socrates-2', 'default-env'].map(ws => (
              <button
                key={ws}
                onClick={() => { setActiveWorkspace(ws); setWorkspaceMenuOpen(false) }}
                style={{
                  width: '100%', background: activeWorkspace === ws ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 6, color: '#e2e8f0', fontSize: 13, cursor: 'pointer', transition: 'background .1s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = activeWorkspace === ws ? 'rgba(255,255,255,0.06)' : 'transparent'}
              >
                <span>{ws}</span>
                {activeWorkspace === ws && <Check size={14} color="#10b981" />}
              </button>
            ))}
            <div style={{ height: 1, background: '#333842', margin: '4px 0' }} />
            <button
              style={{
                width: '100%', background: 'transparent', border: 'none',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 6, color: '#4dc4d6', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background .1s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(77,196,214,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={14} /> New Workspace
            </button>
          </div>
        )}
      </div>

      {/* ── Main Nav Accordions ────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', padding: '16px 8px 0', gap: 2, whiteSpace: 'nowrap' }}>
        
        {/* Build Section */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => !isCollapsed && setBuildOpen(!buildOpen)}
            style={{
              width: '100%', background: isActive('/workflows') || isActive('/integrations') ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 18px', borderRadius: 6, color: '#e2e8f0', transition: 'background .1s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => {
              const active = isActive('/workflows') || isActive('/integrations') || isActive('/variables') || isActive('/templates');
              e.currentTarget.style.background = active && !isCollapsed ? 'rgba(255,255,255,0.04)' : 'transparent'
            }}
            title={isCollapsed ? "Build" : ""}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <i className="fa-solid fa-code-branch" style={{ fontSize: 15, color: '#e2e8f0', width: 16, textAlign: 'center', transform: 'rotate(90deg)' }} />
              <span style={{ fontSize: 14, fontWeight: 500, opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', textAlign: 'left' }}>Build</span>
            </div>
            <div style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center' }}>
              {buildOpen ? <ChevronUp size={14} color="#e2e8f0" /> : <ChevronDown size={14} color="#e2e8f0" />}
            </div>
          </button>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateRows: buildOpen && !isCollapsed ? '1fr' : '0fr', 
            opacity: buildOpen && !isCollapsed ? 1 : 0, 
            transition: 'grid-template-rows 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', paddingBottom: 8, marginTop: 4 }}>
                <div style={{ position: 'absolute', top: 0, bottom: 20, left: 25, width: 2, background: 'rgba(255,255,255,0.1)' }} />
                {BUILD_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  style={{
                    position: 'relative',
                    width: '100%', outline: 'none', border: 'none', cursor: 'pointer',
                    background: isActive(item.path) ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: isActive(item.path) ? '#fff' : '#e2e8f0',
                    padding: '8px 12px 8px 50px', textAlign: 'left',
                    fontSize: 13, fontWeight: isActive(item.path) ? 500 : 400,
                    borderRadius: 6, transition: 'background .1s, color .1s',
                    marginBottom: 2
                  }}
                  onMouseEnter={e => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.color = '#fff'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#e2e8f0'
                    }
                  }}
                >
                  <span style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', display: 'block' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

        {/* Investigate Section */}
        <button
          onClick={() => navigate('/cases')}
          style={{
            width: '100%', border: 'none', cursor: 'pointer',
            background: isActive('/cases') ? 'rgba(255,255,255,0.04)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 18px', borderRadius: 6, 
            color: isActive('/cases') ? '#fff' : '#e2e8f0', transition: 'background .1s'
          }}
          onMouseEnter={e => {
            if (!isActive('/cases')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          }}
          onMouseLeave={e => {
            if (!isActive('/cases')) e.currentTarget.style.background = 'transparent'
          }}
          title={isCollapsed ? "Investigate" : ""}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16 }}>
              <Shield size={16} />
            </div>
            <span style={{ fontSize: 14, fontWeight: isActive('/cases') ? 500 : 500, opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', textAlign: 'left' }}>Investigate</span>
          </div>
        </button>

        {/* Monitor Section */}
        <button
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 18px', borderRadius: 6, color: '#e2e8f0', transition: 'background .1s', marginTop: 12
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title={isCollapsed ? "Monitor" : ""}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <i className="fa-solid fa-chart-line" style={{ fontSize: 15, color: '#e2e8f0', width: 16, textAlign: 'center' }} />
            <span style={{ fontSize: 14, fontWeight: 500, opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', textAlign: 'left' }}>Monitor</span>
          </div>
          <div style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center' }}>
            <ChevronDown size={14} color="#e2e8f0" />
          </div>
        </button>

      </div>

      {/* ── Bottom Nav ────────────────────────────────── */}
      <div style={{ padding: '16px 8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 2, whiteSpace: 'nowrap' }}>
        
        <button
          onClick={() => navigate('/help')}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'flex-start',
            padding: '10px 18px', borderRadius: 6,
            color: '#e2e8f0', transition: 'background .1s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title={isCollapsed ? "Knowledge Hub" : ""}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16 }}>
            <MessageSquare size={16} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', textAlign: 'left' }}>Knowledge Hub</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'flex-start',
            padding: '10px 18px', borderRadius: 6,
            color: '#e2e8f0', transition: 'background .1s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title={isCollapsed ? "Settings" : ""}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16 }}>
            <Settings size={16} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', textAlign: 'left' }}>Settings</span>
        </button>
      </div>

      {/* ── User Avatar ───────────────────────────────── */}
      <div style={{ 
        padding: '16px 16px 24px', 
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, 
        cursor: 'pointer', whiteSpace: 'nowrap'
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: '#fff',
          overflow: 'hidden', flexShrink: 0
        }}>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s' }}>Bob Boyle</span>
      </div>

    </aside>
  )
}
