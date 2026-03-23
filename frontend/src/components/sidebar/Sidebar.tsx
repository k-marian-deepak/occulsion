import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, Layers, Shield, Activity,
  MessageSquare, Settings, BookOpen, PanelLeftClose, PanelLeftOpen, Plus, Check
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [activeWorkspace, setActiveWorkspace] = useState('socrates-1')

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
    <aside style={{
      width: isCollapsed ? 68 : 250, background: '#0e1015', borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh',
      color: '#fff', userSelect: 'none', fontFamily: 'inherit',
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative'
    }}>
      {/* ── Top Workspace Dropdown ───────────────────────── */}
      <div ref={menuRef} style={{ position: 'relative', borderBottom: isCollapsed ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingBottom: isCollapsed ? 16 : 0, marginBottom: isCollapsed ? 16 : 0 }}>
        <div 
          onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
          style={{ 
            padding: isCollapsed ? '16px 0 0' : '16px 16px 24px', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', 
            justifyContent: isCollapsed ? 'center' : 'space-between',
            transition: 'background .15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#4dc4d6', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0
            }}>
              {activeWorkspace.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Workspace</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{activeWorkspace}</span>
              </div>
            )}
          </div>
          {!isCollapsed && <ChevronDown size={14} color="#9ca3af" />}
        </div>

        {/* Workspace Switcher Menu */}
        {workspaceMenuOpen && (
          <div className="animate-fade-in" style={{ 
            position: 'absolute', top: isCollapsed ? 60 : 66, left: isCollapsed ? 68 : 16, 
            width: isCollapsed ? 220 : 'calc(100% - 32px)', background: '#1c1e23', border: '1px solid #333842', 
            borderRadius: 8, padding: 8, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 2, 
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)' 
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', padding: '8px 12px' }}>Switch Workspace</div>
            {['socrates-1', 'socrates-2', 'default-env'].map(ws => (
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
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '0 8px', gap: 2 }}>
        
        {/* Build Section */}
        <div>
          <button
            onClick={() => !isCollapsed && setBuildOpen(!buildOpen)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between',
              padding: isCollapsed ? '12px 0' : '10px 12px', borderRadius: 6, color: '#fff', transition: 'background .1s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title={isCollapsed ? "Build" : ""}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
              <i className="fa-solid fa-layer-group" style={{ fontSize: 13, color: '#e2e8f0' }} />
              {!isCollapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>Build</span>}
            </div>
            {!isCollapsed && (buildOpen ? <ChevronUp size={14} color="#e2e8f0" /> : <ChevronDown size={14} color="#e2e8f0" />)}
          </button>
          
          {buildOpen && !isCollapsed && (
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
          onClick={() => navigate('/cases')}
          style={{
            width: '100%', border: 'none', cursor: 'pointer',
            background: isActive('/cases') ? 'rgba(255,255,255,0.1)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '12px 0' : '10px 12px', borderRadius: 6, 
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <Shield size={14} />
            {!isCollapsed && <span style={{ fontSize: 13, fontWeight: isActive('/cases') ? 600 : 500 }}>Investigate</span>}
          </div>
          {!isCollapsed && <ChevronDown size={14} color="#9ca3af" />}
        </button>

        {/* Monitor Section */}
        <button
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '12px 0' : '10px 12px', borderRadius: 6, color: '#e2e8f0', transition: 'background .1s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title={isCollapsed ? "Monitor" : ""}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <Activity size={14} />
            {!isCollapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>Monitor</span>}
          </div>
          {!isCollapsed && <ChevronDown size={14} color="#9ca3af" />}
        </button>

      </div>

      {/* ── Bottom Nav ────────────────────────────────── */}
      <div style={{ padding: '16px 8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        <button
          onClick={() => navigate('/help')}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '12px 0' : '10px 12px', borderRadius: 6,
            color: '#e2e8f0', transition: 'background .1s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title={isCollapsed ? "Knowledge Hub" : ""}
        >
          <MessageSquare size={14} />
          {!isCollapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Knowledge Hub</span>}
        </button>

        <button
          onClick={() => navigate('/settings')}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '12px 0' : '10px 12px', borderRadius: 6,
            color: '#e2e8f0', transition: 'background .1s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title={isCollapsed ? "Settings" : ""}
        >
          <Settings size={14} />
          {!isCollapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Settings</span>}
        </button>
        
        {/* Toggle Collapse */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '12px 0' : '10px 12px', borderRadius: 6,
            color: '#9ca3af', transition: 'background .1s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          {!isCollapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Collapse</span>}
        </button>
      </div>

      {/* ── User Avatar ───────────────────────────────── */}
      <div style={{ 
        padding: isCollapsed ? '16px 0 24px' : '16px 20px 24px', 
        display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 12, 
        cursor: 'pointer' 
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#fff',
          overflow: 'hidden', flexShrink: 0
        }}>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {!isCollapsed && <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>Bob Boyle</span>}
      </div>

    </aside>
  )
}
