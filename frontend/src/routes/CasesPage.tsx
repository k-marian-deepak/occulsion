import { useQuery } from '@tanstack/react-query'
import { Plus, AlertTriangle, Clock, User, ChevronRight } from 'lucide-react'
import { useCaseStore, type Case, type Severity } from '@/stores/caseStore'
import { api } from '@/lib/api'

const SEV_CONFIG: Record<Severity, { label: string; cls: string; dot: string }> = {
  critical: { label: 'Critical', cls: 'badge-red',   dot: 'dot-red' },
  high:     { label: 'High',     cls: 'badge-red',   dot: 'dot-red' },
  medium:   { label: 'Medium',   cls: 'badge-amber', dot: 'dot-amber' },
  low:      { label: 'Low',      cls: 'badge-accent',dot: 'dot-grey' },
}

const MOCK_CASES: Case[] = [
  { id: '1', title: 'Phishing campaign targeting finance dept',  severity: 'critical', status: 'open',        assignee_id: null, workspace_id: 'ws1', created_at: new Date(Date.now()-3600000).toISOString(), resolved_at: null },
  { id: '2', title: 'Suspicious PowerShell execution on DC01',  severity: 'high',     status: 'in_progress', assignee_id: null, workspace_id: 'ws1', created_at: new Date(Date.now()-7200000).toISOString(), resolved_at: null },
  { id: '3', title: 'Brute force from 192.168.1.105',          severity: 'medium',   status: 'open',        assignee_id: null, workspace_id: 'ws1', created_at: new Date(Date.now()-14400000).toISOString(), resolved_at: null },
  { id: '4', title: 'Unusual data exfiltration to S3 bucket',  severity: 'high',     status: 'in_progress', assignee_id: null, workspace_id: 'ws1', created_at: new Date(Date.now()-86400000).toISOString(), resolved_at: null },
  { id: '5', title: 'Expired certificate on api-gateway.prod', severity: 'low',      status: 'open',        assignee_id: null, workspace_id: 'ws1', created_at: new Date(Date.now()-172800000).toISOString(), resolved_at: null },
]

export function CasesPage() {
  const { selectedCase, selectCase, filterSeverity } = useCaseStore()

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: () => api.get('/cases'),
    placeholderData: MOCK_CASES,
  })

  const filtered = filterSeverity ? cases.filter(c => c.severity === filterSeverity) : cases

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 20, height: '100%' }}>
      {/* Case list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Cases</h1>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>{filtered.length} open incidents</p>
          </div>
          <button className="btn btn-primary" id="btn-new-case"><Plus size={14} /> New Case</button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto auto auto',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span>Title</span>
            <span style={{ width: 90, textAlign: 'center' }}>Severity</span>
            <span style={{ width: 100, textAlign: 'center' }}>Status</span>
            <span style={{ width: 80, textAlign: 'right' }}>Age</span>
          </div>

          {isLoading
            ? [1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ height: 52, margin: 8, borderRadius: 6 }} />
              ))
            : filtered.map((c, i) => (
                <CaseRow
                  key={c.id} case={c} index={i}
                  selected={selectedCase?.id === c.id}
                  onClick={() => selectCase(c)}
                />
              ))
          }
        </div>
      </div>

      {/* Detail panel */}
      {selectedCase && (
        <CaseDetail case={selectedCase} onClose={() => selectCase(null)} />
      )}
    </div>
  )
}

function CaseRow({ case: c, index, selected, onClick }: {
  case: Case; index: number; selected: boolean; onClick: () => void
}) {
  const sev = SEV_CONFIG[c.severity]
  const age = timeSince(c.created_at)
  const statusLabel = c.status.replace('_', ' ')

  return (
    <div
      onClick={onClick}
      id={`case-row-${c.id}`}
      style={{
        display: 'grid', gridTemplateColumns: '1fr auto auto auto',
        padding: '12px 16px', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        background: selected ? 'var(--aglow)' : 'transparent',
        borderLeft: selected ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'all 0.1s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={`status-dot ${sev.dot}`} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c.title}</span>
      </div>
      <span style={{ width: 90, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span className={`badge ${sev.cls}`}>{sev.label}</span>
      </span>
      <span style={{ width: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'capitalize' }}>{statusLabel}</span>
      </span>
      <span style={{ width: 80, textAlign: 'right', fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
        <Clock size={10} /> {age}
      </span>
    </div>
  )
}

function CaseDetail({ case: c, onClose }: { case: Case; onClose: () => void }) {
  const sev = SEV_CONFIG[c.severity]

  return (
    <div className="card animate-slide-in" style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span className={`badge ${sev.cls}`}>{sev.label}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>✕</button>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
        {c.title}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['Status',   c.status.replace('_', ' ')],
          ['Created',  new Date(c.created_at).toLocaleString()],
          ['Assignee', 'Unassigned'],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text3)' }}>{label}</span>
            <span style={{ color: 'var(--text2)', textTransform: 'capitalize' }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button className="btn btn-primary" id={`btn-ai-triage-${c.id}`} style={{ width: '100%', justifyContent: 'center' }}>
          <AlertTriangle size={12} /> AI Triage
        </button>
        <button className="btn btn-ghost" id={`btn-assign-${c.id}`} style={{ width: '100%', justifyContent: 'center' }}>
          <User size={12} /> Assign
        </button>
      </div>
    </div>
  )
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
