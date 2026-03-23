import { Activity, CheckCircle, XCircle, Loader2, Download, Clock, ChevronDown } from 'lucide-react'

export function ActivityPage() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Activity Log</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>All workflow executions and system events</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost">
            <Clock size={13} /> Last 24h <ChevronDown size={11} />
          </button>
          <button className="btn btn-ghost">
            <Download size={13} /> Export logs
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total',   val: '—', color: 'var(--text2)' },
          { label: 'Success', val: '—', color: 'var(--green)' },
          { label: 'Running', val: '—', color: 'var(--accent2)' },
          { label: 'Failed',  val: '—', color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 80px 80px', padding: '9px 16px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          <span>Workflow / Execution</span>
          <span>Trigger</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Duration</span>
          <span style={{ textAlign: 'right' }}>Time</span>
        </div>

        {/* Empty state */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="var(--text3)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No activity yet</div>
            <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 300 }}>
              Workflow executions will appear here once you publish and trigger your first workflow.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
