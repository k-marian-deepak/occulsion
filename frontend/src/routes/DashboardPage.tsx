import { Activity, GitBranch, FolderOpen, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const AREA_DATA = [
  { day: 'Mon', alerts: 42, resolved: 38 },
  { day: 'Tue', alerts: 61, resolved: 55 },
  { day: 'Wed', alerts: 35, resolved: 33 },
  { day: 'Thu', alerts: 78, resolved: 60 },
  { day: 'Fri', alerts: 52, resolved: 50 },
  { day: 'Sat', alerts: 28, resolved: 27 },
  { day: 'Sun', alerts: 44, resolved: 42 },
]

const BAR_DATA = [
  { name: 'Phishing',    count: 34 },
  { name: 'Malware',     count: 21 },
  { name: 'Brute Force', count: 18 },
  { name: 'Exfil',       count: 12 },
  { name: 'Other',       count: 9  },
]

const STAT_CARDS = [
  { label: 'Open Cases',        value: '12',  delta: '+3',  icon: <FolderOpen size={16} />,  color: 'var(--amber)' },
  { label: 'Active Workflows',  value: '8',   delta: '0',   icon: <GitBranch size={16} />,   color: 'var(--accent)' },
  { label: 'Resolved Today',    value: '27',  delta: '+12', icon: <CheckCircle size={16} />, color: 'var(--green)' },
  { label: 'MTTR',              value: '38m', delta: '-5m', icon: <Clock size={16} />,       color: 'var(--text2)' },
]

export function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>SOC overview · Last 7 days</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.delta.startsWith('+') ? 'var(--green)' : s.delta.startsWith('-') ? 'var(--amber)' : 'var(--text3)' }}>
              {s.delta !== '0' && <TrendingUp size={10} style={{ display: 'inline', marginRight: 2 }} />}
              {s.delta} vs yesterday
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Alerts vs Resolved</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={AREA_DATA}>
              <defs>
                <linearGradient id="gAlert" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--red)"   stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--red)"   stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Area type="monotone" dataKey="alerts"   stroke="var(--red)"   fill="url(#gAlert)"    strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" stroke="var(--green)" fill="url(#gResolved)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Top Alert Types</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={BAR_DATA} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} width={72} />
              <Tooltip
                contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
