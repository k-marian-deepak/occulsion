import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '@/providers/ThemeProvider'
import {
  GitBranch, Puzzle, Variable, LayoutTemplate,
  Activity, BarChart2, LayoutDashboard,
  FolderOpen, Network,
  Settings, Sparkles, HelpCircle,
  ChevronDown, ChevronRight,
  Moon, Sun, MoreHorizontal,
  Shield,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
}

interface Section {
  id: string
  label: string
  items: NavItem[]
}

const SECTIONS: Section[] = [
  {
    id: 'build',
    label: 'Build',
    items: [
      { label: 'Workflows',          icon: <GitBranch size={14} />,       path: '/workflows' },
      { label: 'Integrations',       icon: <Puzzle size={14} />,          path: '/integrations' },
      { label: 'Variables',          icon: <Variable size={14} />,        path: '/variables' },
      { label: 'Templates',          icon: <LayoutTemplate size={14} />,  path: '/templates' },
    ],
  },
  {
    id: 'monitor',
    label: 'Monitor',
    items: [
      { label: 'Activity Log',  icon: <Activity size={14} />,       path: '/activity' },
      { label: 'Insights',      icon: <BarChart2 size={14} />,      path: '/insights' },
      { label: 'Dashboards',    icon: <LayoutDashboard size={14} />,path: '/dashboards' },
    ],
  },
  {
    id: 'investigate',
    label: 'Investigate',
    items: [
      { label: 'Cases',  icon: <FolderOpen size={14} />, path: '/cases' },
      { label: 'Canvas', icon: <Network size={14} />,    path: '/canvas' },
    ],
  },
]

const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Settings',     icon: <Settings size={14} />,  path: '/settings' },
  { label: "What's new",   icon: <Sparkles size={14} />,  path: '/changelog' },
  { label: 'Help Center',  icon: <HelpCircle size={14} />,path: '/help' },
]

export function Sidebar() {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) =>
    setCollapsed(p => ({ ...p, [id]: !p[id] }))

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <aside className="sidebar">
      {/* ── Logo ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 14px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, var(--accent) 0%, #7b95ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Occlusion
          </span>
        </div>
        <button
          onClick={toggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text3)', padding: 4, borderRadius: 6,
          }}
          title="Toggle theme"
          id="btn-theme-toggle"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* ── Workspace selector ────────────────────────────── */}
      <div style={{ padding: '10px 10px 0' }}>
        <button style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 8px', borderRadius: 7, border: '1px solid var(--border)',
          background: 'var(--bg3)', cursor: 'pointer', color: 'var(--text)',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: 'linear-gradient(135deg, #BE3455, #E9A841)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>D</div>
          <span style={{ fontSize: 12, fontWeight: 500, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Deepak's Workspace
          </span>
          <ChevronDown size={12} color="var(--text3)" />
        </button>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '12px 14px 8px' }} />

      {/* ── Nav sections ──────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 6px' }}>
        {SECTIONS.map(section => (
          <div key={section.id} style={{ marginBottom: 4 }}>
            <button
              onClick={() => toggleSection(section.id)}
              id={`sb-toggle-${section.id}`}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text3)', fontSize: 11,
                fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              {collapsed[section.id]
                ? <ChevronRight size={10} />
                : <ChevronDown size={10} />
              }
              {section.label}
            </button>

            {!collapsed[section.id] && (
              <div style={{ marginTop: 2 }}>
                {section.items.map(item => (
                  <button
                    key={item.path}
                    id={`sb-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => navigate(item.path)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 8px 6px 20px', border: 'none', cursor: 'pointer',
                      borderRadius: 6, fontSize: 13, fontWeight: 400,
                      background: isActive(item.path) ? 'var(--aglow)' : 'transparent',
                      color: isActive(item.path) ? 'var(--accent2)' : 'var(--text2)',
                      borderLeft: isActive(item.path) ? '2px solid var(--accent)' : '2px solid transparent',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <span style={{ opacity: isActive(item.path) ? 1 : 0.7 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* ── Evaluation bar ────────────────────────────────── */}
      <div style={{ margin: '0 10px', padding: '8px 10px', borderRadius: 7,
        background: 'var(--bg3)', border: '1px solid var(--border)', marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600, marginBottom: 4 }}>
          Evaluation — 449 days left
        </div>
        <div style={{ height: 3, background: 'var(--border2)', borderRadius: 99 }}>
          <div style={{ height: '100%', width: '82%', background: 'var(--amber)', borderRadius: 99 }} />
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '4px 14px' }} />

      {/* ── Bottom items ──────────────────────────────────── */}
      <div style={{ padding: '0 6px 8px' }}>
        {BOTTOM_ITEMS.map(item => (
          <button
            key={item.path}
            id={`sb-bottom-${item.label.toLowerCase().replace(/[\s']+/g, '-')}`}
            onClick={() => navigate(item.path)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', border: 'none', cursor: 'pointer', borderRadius: 6,
              fontSize: 13, background: 'transparent', color: 'var(--text2)',
              transition: 'all 0.1s ease',
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 14px 8px' }} />

      {/* ── User ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px 12px',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent) 0%, #7b95ff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>D</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Deepak Singh
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Owner</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
          <MoreHorizontal size={14} />
        </button>
      </div>
    </aside>
  )
}
