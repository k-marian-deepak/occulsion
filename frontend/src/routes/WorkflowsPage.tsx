import { useQuery } from '@tanstack/react-query'
import { Plus, GitBranch, ChevronRight, Play, Clock } from 'lucide-react'
import { api } from '@/lib/api'

interface Workflow {
  id: string
  name: string
  state: 'draft' | 'testing' | 'published'
  updated_at: string
}

const STATE_CONFIG = {
  published: { label: 'Published', cls: 'badge-green' },
  testing:   { label: 'Testing',   cls: 'badge-amber' },
  draft:     { label: 'Draft',     cls: 'badge-accent' },
}

export function WorkflowsPage() {
  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: () => api.get('/workflows'),
    // Return mock data if API not available
    placeholderData: [
      { id: '1', name: 'Phishing Alert Triage',      state: 'published', updated_at: new Date().toISOString() },
      { id: '2', name: 'Ransomware IOC Enrichment',  state: 'published', updated_at: new Date().toISOString() },
      { id: '3', name: 'Brute Force Detection',      state: 'testing',   updated_at: new Date().toISOString() },
      { id: '4', name: 'Shift Handover Automation',  state: 'draft',     updated_at: new Date().toISOString() },
    ],
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Workflows</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
            Build, version-control, and automate your SOC playbooks
          </p>
        </div>
        <button className="btn btn-primary" id="btn-new-workflow">
          <Plus size={14} />
          New Workflow
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 100 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {workflows.map((wf, i) => (
            <WorkflowCard key={wf.id} wf={wf} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkflowCard({ wf, index }: { wf: Workflow; index: number }) {
  const cfg = STATE_CONFIG[wf.state]
  const ago = timeSince(wf.updated_at)

  return (
    <div
      className="card"
      style={{ cursor: 'pointer', animationDelay: `${index * 40}ms` }}
      id={`wf-card-${wf.id}`}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--aglow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <GitBranch size={15} />
          </div>
          <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
        </div>
        <ChevronRight size={14} color="var(--text3)" />
      </div>

      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>
        {wf.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
          <Clock size={10} /> Updated {ago}
        </span>
        <button
          className="btn btn-ghost"
          style={{ padding: '3px 8px', fontSize: 11, marginLeft: 'auto' }}
          id={`btn-run-${wf.id}`}
          onClick={(e) => { e.stopPropagation() }}
        >
          <Play size={10} /> Run
        </button>
      </div>
    </div>
  )
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
