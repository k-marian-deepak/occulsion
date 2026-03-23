import { FolderOpen, Plus, Filter, Search } from 'lucide-react'
import { useCaseStore, type Case, type Severity } from '@/stores/caseStore'
import { useState } from 'react'

const SEV_CONFIG: Record<Severity, { label: string; cls: string; dot: string }> = {
  critical: { label: 'Critical', cls: 'badge-red',   dot: 'dot-red'   },
  high:     { label: 'High',     cls: 'badge-red',   dot: 'dot-red'   },
  medium:   { label: 'Medium',   cls: 'badge-amber', dot: 'dot-amber' },
  low:      { label: 'Low',      cls: 'badge-accent',dot: 'dot-grey'  },
}

export function CasesPage() {
  const { selectedCase, selectCase, filterSeverity } = useCaseStore()
  const cases: Case[] = []

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 20, height: '100%' }}>
      {/* Case list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Cases</h1>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>0 open incidents</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost"><Filter size={13} /> Filter</button>
            <button className="btn btn-primary" id="btn-new-case"><Plus size={14} /> New Case</button>
          </div>
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

          {/* Empty state */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 24px', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gbg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpen size={20} color="var(--green)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No open cases</div>
              <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6 }}>Cases are created manually or auto-generated from workflow executions.</div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 12 }}><Plus size={12} /> Create a case</button>
          </div>
        </div>
      </div>

      {selectedCase && (
        <div className="card animate-slide-in" style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span className={`badge ${SEV_CONFIG[selectedCase.severity].cls}`}>{SEV_CONFIG[selectedCase.severity].label}</span>
            <button onClick={() => selectCase(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>✕</button>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{selectedCase.title}</div>
        </div>
      )}
    </div>
  )
}
