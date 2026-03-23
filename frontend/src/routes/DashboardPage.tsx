import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Activity, GitBranch, FolderOpen, Clock, TrendingUp } from 'lucide-react'

const STAT_CARDS = [
  { label: 'Open Cases',        icon: <FolderOpen size={16} />,  color: 'var(--amber)' },
  { label: 'Active Workflows',  icon: <GitBranch size={16} />,   color: 'var(--accent)' },
  { label: 'Resolved Today',    icon: <Activity size={16} />,    color: 'var(--green)' },
  { label: 'MTTR',              icon: <Clock size={16} />,       color: 'var(--text2)' },
]

export function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>SOC overview · Last 7 days</p>
      </div>

      {/* KPI row — placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="skeleton" style={{ height: 28, width: 56, borderRadius: 5 }} />
            <div className="skeleton" style={{ height: 11, width: 90, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* Charts — placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Alerts vs Resolved</div>
          <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
        </div>

        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Top Alert Types</div>
          <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  )
}
