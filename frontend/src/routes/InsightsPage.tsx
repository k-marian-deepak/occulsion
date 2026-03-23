import { BarChart2, TrendingUp, Clock, Zap, GitBranch, Shield, ChevronDown, Download } from 'lucide-react'

const KPIS = [
  { label: 'Time Saved',        icon: <Clock size={15} />,    color: 'var(--green)' },
  { label: 'Total Executions',  icon: <Zap size={15} />,      color: 'var(--accent2)' },
  { label: 'Avg MTTR',          icon: <TrendingUp size={15}/>, color: '#18c4c4' },
  { label: 'Automation Rate',   icon: <GitBranch size={15} />, color: 'var(--accent2)' },
]

export function InsightsPage() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Insights</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>SOC performance metrics and trends</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost">
            <Clock size={13} /> Last 30d <ChevronDown size={11} />
          </button>
          <button className="btn btn-ghost"><Download size={13} /> Export</button>
          <button className="btn btn-primary">+ Dashboard</button>
        </div>
      </div>

      {/* KPI row — placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 11, marginBottom: 16 }}>
        {KPIS.map(k => (
          <div key={k.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>{k.label}</span>
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            {/* Skeleton value */}
            <div className="skeleton" style={{ height: 28, width: 72, borderRadius: 5 }} />
            <div className="skeleton" style={{ height: 11, width: 100, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* Chart placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 11, marginBottom: 11 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Workflow Executions</div>
          <div style={{ fontSize: 11.5, color: 'var(--text3)', marginBottom: 14 }}>Daily runs — last 30 days</div>
          <div className="skeleton" style={{ height: 180, borderRadius: 8 }} />
        </div>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Cases by Severity</div>
          <div style={{ fontSize: 11.5, color: 'var(--text3)', marginBottom: 14 }}>This month</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 140 }}>
            <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {['Critical', 'High', 'Medium', 'Low'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="skeleton" style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: 'var(--text3)', flex: 1 }}>{s}</span>
                <div className="skeleton" style={{ width: 22, height: 12, borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 11, marginBottom: 11 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Top Workflows by Runs</div>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 10, color: 'var(--text3)', width: 14, textAlign: 'right' }}>{i}</span>
              <div className="skeleton" style={{ flex: 1, height: 13, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 40, height: 13, borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Alert Types</div>
          <div className="skeleton" style={{ height: 190, borderRadius: 8 }} />
        </div>
      </div>

      {/* Heatmap placeholder */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Executions Heatmap</div>
        <div style={{ fontSize: 11.5, color: 'var(--text3)', marginBottom: 14 }}>Hourly volume by day of week</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, opacity: 0.4 }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 9.5, color: 'var(--text3)', width: 24, textAlign: 'right', marginRight: 4, flexShrink: 0 }}>{d}</span>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} style={{ flex: 1, height: 14, borderRadius: 2, background: 'var(--bg5)' }} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>No data yet — run workflows to populate this view</span>
        </div>
      </div>
    </div>
  )
}
