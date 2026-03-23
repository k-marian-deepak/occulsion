import { useNavigate } from 'react-router-dom'
import { Search, Plus, GitBranch, Download, X } from 'lucide-react'
import { useState } from 'react'

export function WorkflowsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [cat, setCat] = useState('all')

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Workflows</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Build, version-control, and automate your SOC playbooks</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost"><Download size={13} /> Import</button>
          <button className="btn btn-primary" id="btn-new-workflow" onClick={() => navigate('/canvas')}>
            <Plus size={13} /> Create Workflow
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[
          { v: 'all', l: 'All', count: 0 },
          { v: 'published', l: 'Published', count: 0 },
          { v: 'testing', l: 'Testing', count: 0 },
          { v: 'drafts', l: 'Drafts', count: 0 },
        ].map(t => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12.5, border: 'none', cursor: 'pointer',
              background: tab === t.v ? 'var(--bg4)' : 'transparent',
              color: tab === t.v ? 'var(--text)' : 'var(--text2)',
              fontWeight: tab === t.v ? 500 : 400,
              transition: 'all .12s',
            }}
          >
            {t.l}
            <span style={{ fontSize: 10, fontFamily: 'monospace', marginLeft: 5, opacity: 0.5 }}>0</span>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 11px', flex: '0 0 240px' }}>
          <Search size={12} color="var(--text3)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 12.5, width: '100%' }}
            placeholder="Search workflows…"
            id="wf-search"
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><X size={11} /></button>}
        </div>
        {['All types', 'Phishing', 'Identity', 'Malware', 'Cloud', 'AI-Powered'].map(c => (
          <button
            key={c}
            onClick={() => setCat(c === 'All types' ? 'all' : c)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer',
              border: `1px solid ${(c === 'All types' ? 'all' : c) === cat ? 'var(--accent)' : 'var(--border)'}`,
              background: (c === 'All types' ? 'all' : c) === cat ? 'var(--aglow)' : 'var(--bg3)',
              color: (c === 'All types' ? 'all' : c) === cat ? 'var(--accent2)' : 'var(--text2)',
              transition: 'all .12s',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 340, gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--aglow)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GitBranch size={22} color="var(--accent2)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No workflows yet</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 320 }}>
            Create your first workflow to start automating SOC playbooks, alert triage, and response actions.
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/canvas')}><Plus size={13} /> Create your first workflow</button>
      </div>
    </div>
  )
}
