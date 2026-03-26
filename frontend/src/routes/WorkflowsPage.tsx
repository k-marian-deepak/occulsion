import { useNavigate } from 'react-router-dom'
import { Search, Plus, GitBranch, Download, X, Sparkles, Trash2, ChevronDown } from 'lucide-react'
import { useRef, useState } from 'react'
import { useWorkflowStore } from '@/stores/workflowStore'
import { ReactFlow, Background } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nodeTypes } from '@/components/canvas/WorkflowCanvas'
import type { WorkflowConflictMode } from '@/lib/workflowYaml'

function getWorkflowStatusLabel(status: string) {
  if (status === 'published_enabled') return 'Published, trigger enabled'
  if (status === 'published_disabled') return 'Published, trigger disabled'
  if (status === 'has_unpublished_changes') return 'Has unpublished changes'
  if (status === 'under_review') return 'Under review'
  return 'Not published'
}

function getWorkflowStatusColors(status: string) {
  if (status === 'published_enabled') {
    return { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.28)' }
  }
  if (status === 'published_disabled') {
    return { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' }
  }
  if (status === 'has_unpublished_changes') {
    return { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.28)' }
  }
  if (status === 'under_review') {
    return { bg: 'rgba(234,179,8,0.12)', color: '#facc15', border: 'rgba(234,179,8,0.28)' }
  }
  return { bg: 'rgba(148,163,184,0.12)', color: '#cbd5e1', border: 'rgba(148,163,184,0.25)' }
}

export function WorkflowsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [showAIModal, setShowAIModal] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [rowMenuWorkflowId, setRowMenuWorkflowId] = useState<string | null>(null)
  const [pendingImportYaml, setPendingImportYaml] = useState('')
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importMode, setImportMode] = useState<WorkflowConflictMode>('keep_original')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    workflows,
    openWorkflowInCanvas,
    unpublishWorkflow,
    setWorkflowTriggerEnabled,
    publishCurrentWorkflow,
    exportWorkflowYaml,
    importWorkflowYaml,
    stopWorkflowExecutions,
    currentUserRole,
  } = useWorkflowStore()

  const downloadYaml = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/x-yaml;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = (workflowId: string, publishedOnly: boolean) => {
    const content = exportWorkflowYaml(workflowId, { publishedOnly })
    if (!content) return
    const workflow = workflows.find((item) => item.id === workflowId)
    const safeName = (workflow?.name || 'workflow').replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase()
    const suffix = publishedOnly ? '-published' : ''
    downloadYaml(`${safeName}${suffix}.yaml`, content)
  }

  const handleImportFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setPendingImportYaml(text)
    setImportModalOpen(true)
    event.target.value = ''
  }

  const confirmImport = () => {
    if (!pendingImportYaml) return
    try {
      importWorkflowYaml(pendingImportYaml, importMode)
      setPendingImportYaml('')
      setImportModalOpen(false)
      setCreateMenuOpen(false)
    } catch {
      setImportModalOpen(false)
      setPendingImportYaml('')
    }
  }

  const filtered = workflows
    .filter((workflow) => {
      if (tab === 'published') {
        return ['published_enabled', 'published_disabled', 'has_unpublished_changes', 'under_review'].includes(workflow.status)
      }
      if (tab === 'testing') {
        return ['published_disabled', 'has_unpublished_changes', 'under_review'].includes(workflow.status)
      }
      if (tab === 'drafts') {
        return workflow.status === 'not_published'
      }
      return true
    })
    .filter((workflow) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const tags = workflow.tags.join(' ').toLowerCase()
      return workflow.name.toLowerCase().includes(q) || tags.includes(q)
    })

  const tabCounts = {
    all: workflows.length,
    published: workflows.filter((workflow) => ['published_enabled', 'published_disabled', 'has_unpublished_changes', 'under_review'].includes(workflow.status)).length,
    testing: workflows.filter((workflow) => ['published_disabled', 'has_unpublished_changes', 'under_review'].includes(workflow.status)).length,
    drafts: workflows.filter((workflow) => workflow.status === 'not_published').length,
  }

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Workflows</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Build, version-control, and automate your SOC playbooks</p>
        </div>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <button className="btn btn-primary" onClick={() => setCreateMenuOpen((prev) => !prev)} style={{ background: '#e5e7eb', color: '#000', border: 'none' }}>
            Create <ChevronDown size={13} />
          </button>
          {createMenuOpen && (
            <div style={{ position: 'absolute', top: 42, right: 0, background: '#1c1e23', border: '1px solid #333842', borderRadius: 8, width: 220, zIndex: 30, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
              <button onClick={() => { setCreateMenuOpen(false); navigate('/canvas') }} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '11px 14px', cursor: 'pointer', fontSize: 14 }}>
                <Plus size={13} style={{ marginRight: 8 }} /> Start from scratch
              </button>
              <button onClick={() => { setCreateMenuOpen(false); setShowAIModal(true) }} style={{ width: '100%', background: 'transparent', border: 'none', color: '#a78bfa', textAlign: 'left', padding: '11px 14px', cursor: 'pointer', fontSize: 14 }}>
                <Sparkles size={13} style={{ marginRight: 8 }} /> Generate with AI
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '11px 14px', cursor: 'pointer', fontSize: 14 }}>
                <Download size={13} style={{ marginRight: 8 }} /> Import workflow
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[
          { v: 'all', l: 'All', count: tabCounts.all },
          { v: 'published', l: 'Published', count: tabCounts.published },
          { v: 'testing', l: 'Testing', count: tabCounts.testing },
          { v: 'drafts', l: 'Drafts', count: tabCounts.drafts },
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
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><X size={11} /></button>}
        </div>
      </div>

      {filtered.length === 0 ? (
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
          <button className="btn btn-primary" onClick={() => setShowAIModal(true)} style={{ background: '#7b40f0', border: 'none' }}>
            <Sparkles size={13} /> Generate with AI
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((workflow) => {
            const statusTheme = getWorkflowStatusColors(workflow.status)
            return (
              <div key={workflow.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{workflow.name}</div>
                    <span style={{ background: statusTheme.bg, color: statusTheme.color, border: `1px solid ${statusTheme.border}`, borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                      {getWorkflowStatusLabel(workflow.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    Updated {new Date(workflow.updatedAt).toLocaleString()} • {workflow.nodes.length} nodes • Active: {workflow.activeExecutions} • Last 7d: {workflow.executionsLast7d}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      openWorkflowInCanvas(workflow.id)
                      navigate('/canvas')
                    }}
                  >
                    Open
                  </button>

                  {(workflow.status === 'not_published' || workflow.status === 'has_unpublished_changes') && currentUserRole !== 'creator' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        openWorkflowInCanvas(workflow.id)
                        publishCurrentWorkflow()
                      }}
                    >
                      Publish
                    </button>
                  )}

                  {workflow.status === 'under_review' && currentUserRole !== 'creator' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        openWorkflowInCanvas(workflow.id)
                        publishCurrentWorkflow()
                      }}
                    >
                      Approve & Publish
                    </button>
                  )}

                  {workflow.status === 'published_enabled' && (
                    <button className="btn btn-ghost" onClick={() => setWorkflowTriggerEnabled(workflow.id, false)}>
                      Disable trigger
                    </button>
                  )}

                  {workflow.status === 'published_disabled' && (
                    <button className="btn btn-ghost" onClick={() => setWorkflowTriggerEnabled(workflow.id, true)}>
                      Enable trigger
                    </button>
                  )}

                  {workflow.status !== 'not_published' && (
                    <button className="btn btn-ghost" onClick={() => unpublishWorkflow(workflow.id)}>
                      Unpublish
                    </button>
                  )}

                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-ghost" onClick={() => setRowMenuWorkflowId((prev) => (prev === workflow.id ? null : workflow.id))}>
                      <i className="fa-solid fa-ellipsis" />
                    </button>
                    {rowMenuWorkflowId === workflow.id && (
                      <div style={{ position: 'absolute', top: 36, right: 0, background: '#1c1e23', border: '1px solid #333842', borderRadius: 8, width: 210, zIndex: 40, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                        <button
                          onClick={() => {
                            handleExport(workflow.id, false)
                            setRowMenuWorkflowId(null)
                          }}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-arrow-up-from-bracket" style={{ marginRight: 8 }} /> Export workflow
                        </button>
                        <button
                          onClick={() => {
                            handleExport(workflow.id, true)
                            setRowMenuWorkflowId(null)
                          }}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-arrow-up-from-bracket" style={{ marginRight: 8 }} /> Export published
                        </button>
                        <button
                          onClick={() => {
                            stopWorkflowExecutions(workflow.id)
                            setRowMenuWorkflowId(null)
                          }}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: workflow.activeExecutions > 0 ? 'pointer' : 'not-allowed', opacity: workflow.activeExecutions > 0 ? 1 : 0.5 }}
                          disabled={workflow.activeExecutions === 0}
                        >
                          <i className="fa-solid fa-hand" style={{ marginRight: 8 }} /> Stop executions
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAIModal && <AIModal onClose={() => setShowAIModal(false)} />}

      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml"
        style={{ display: 'none' }}
        onChange={handleImportFileSelected}
      />

      {importModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 520, background: '#1f2229', border: '1px solid #333842', borderRadius: 10, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #333842', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Import workflow</div>
              <button onClick={() => setImportModalOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 10 }}>Conflict handling mode</div>
              {[
                { id: 'keep_original', label: 'Keep original' },
                { id: 'override_original', label: 'Override original' },
                { id: 'duplicate', label: 'Duplicate' },
              ].map((option) => (
                <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0', fontSize: 13, marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={importMode === option.id}
                    onChange={() => setImportMode(option.id as WorkflowConflictMode)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #333842', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setImportModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmImport}>Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MOCK_WORKFLOWS = [
  {
    nodes: [
      { id: '1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'On-demand', subtext: 'Trigger' } },
      { id: '2', type: 'step', position: { x: 300, y: 190 }, data: { subtext: 'Parameters Utils', label: 'Workflow Parameters', iconUrl: 'https://companieslogo.com/img/orig/BAM.ST-7c603fd1.png?t=1' } },
      { id: '3', type: 'step', position: { x: 300, y: 330 }, data: { subtext: 'VirusTotal', label: 'Check IP with VirusTotal', iconUrl: 'https://companieslogo.com/img/orig/VirusTotal-icon.png?t=1' } },
      { id: '4', type: 'operator', position: { x: 300, y: 470 }, data: { label: 'If Malicious Score > 3' } },
      { id: '5', type: 'step', position: { x: 480, y: 610 }, data: { subtext: 'Jira', label: 'Create JIRA Ticket', iconUrl: 'https://companieslogo.com/img/orig/TEAM-b4b39a3f.png?t=1720244494' } },
      { id: '6', type: 'step', position: { x: 120, y: 610 }, data: { subtext: 'Slack', label: 'Send Slack Notification', iconUrl: 'https://companieslogo.com/img/orig/WORK-2ac3a5e8.png?t=1720244494' } }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'default' },
      { id: 'e2-3', source: '2', target: '3', type: 'default' },
      { id: 'e3-4', source: '3', target: '4', type: 'default' },
      { id: 'e4-5', source: '4', sourceHandle: 'true', target: '5', label: 'TRUE', style: { stroke: '#4b5563' }, labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 700 } },
      { id: 'e4-6', source: '4', sourceHandle: 'false', target: '6', label: 'FALSE', style: { stroke: '#4b5563' }, labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 700 } }
    ]
  },
  {
    nodes: [
      { id: '1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'On-demand', subtext: 'Trigger' } },
      { id: '3', type: 'step', position: { x: 300, y: 190 }, data: { subtext: 'VirusTotal', label: 'Check IP with VirusTotal', iconUrl: 'https://companieslogo.com/img/orig/VirusTotal-icon.png?t=1' } },
      { id: '4', type: 'operator', position: { x: 300, y: 330 }, data: { label: 'If Vulnerability Found' } },
      { id: '5', type: 'step', position: { x: 480, y: 470 }, data: { subtext: 'ServiceNow', label: 'Create Incident', iconUrl: 'https://companieslogo.com/img/orig/NOW-6e1be877.png?t=1' } },
      { id: '6', type: 'step', position: { x: 120, y: 470 }, data: { subtext: 'Microsoft Sentinel', label: 'Update Alert', iconUrl: 'https://companieslogo.com/img/orig/MSFT-a203b22d.png?t=1' } }
    ],
    edges: [
      { id: 'e1-3', source: '1', target: '3', type: 'default' },
      { id: 'e3-4', source: '3', target: '4', type: 'default' },
      { id: 'e4-5', source: '4', sourceHandle: 'true', target: '5', label: 'TRUE', style: { stroke: '#4b5563' }, labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 700 } },
      { id: 'e4-6', source: '4', sourceHandle: 'false', target: '6', label: 'FALSE', style: { stroke: '#4b5563' }, labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 700 } }
    ]
  },
  {
    nodes: [
      { id: '1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'Webhook', subtext: 'Trigger' } },
      { id: '3', type: 'step', position: { x: 300, y: 190 }, data: { subtext: 'Splunk', label: 'Run Query', iconUrl: 'https://companieslogo.com/img/orig/SPLK-ae71c6dc.png?t=1' } },
      { id: '5', type: 'step', position: { x: 300, y: 330 }, data: { subtext: 'Email', label: 'Send Email', iconUrl: 'https://companieslogo.com/img/orig/GOOG-0ed88f6c.png?t=1' } }
    ],
    edges: [
      { id: 'e1-3', source: '1', target: '3', type: 'default' },
      { id: 'e3-5', source: '3', target: '5', type: 'default' }
    ]
  }
]

function AIModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'prompt' | 'generating' | 'preview'>('prompt')
  const [prompt, setPrompt] = useState('Check IP Address 8.8.8.8 with VirusTotal and if the malicious score is higher than 3 do the following:\n1. Open a Jira ticket\n2. Send a Slack notification to #alerts channel')
  const navigate = useNavigate()
  const { setNodes, setEdges } = useWorkflowStore()
  
  const [history, setHistory] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [showHistory, setShowHistory] = useState(false)

  const handleGenerate = () => {
    setStep('generating')
    setTimeout(() => {
      setStep('preview')
      const nextMock = (currentIndex + 1) % 3
      const newHistory = [...history.slice(0, currentIndex + 1), nextMock]
      setHistory(newHistory)
      setCurrentIndex(newHistory.length - 1)
    }, 1500)
  }

  const handleCreate = () => {
    if (currentIndex < 0) return
    const currentMock = MOCK_WORKFLOWS[history[currentIndex]]
    // Map edges to apply the default auto-animated flowing CSS
    const formattedEdges = currentMock.edges.map((e: any) => ({
      ...e,
      animated: true,
      style: e.style || { stroke: '#4b5563', strokeWidth: 1.5 }
    }))
    setNodes(currentMock.nodes as any)
    setEdges(formattedEdges as any)
    navigate('/canvas')
  }

  const activeMock = currentIndex >= 0 ? MOCK_WORKFLOWS[history[currentIndex]] : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#1f2229', border: '1px solid #333842', borderRadius: 12,
        width: 1060, height: 600, display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333842' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: '#fff' }}>
            <Sparkles size={16} color="#c084fc" /> Generate with AI
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, padding: 24, gap: 24, background: '#17191e' }}>
          {/* Left Prompt Area */}
          <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Prompt</span>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                style={{ background: 'none', border: 'none', fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <i className="fa-solid fa-clock-rotate-left"></i> History
              </button>
              
              {showHistory && (
                <div className="animate-fade-in" style={{
                  position: 'absolute', top: 24, right: 0, width: 200, background: '#252830',
                  border: '1px solid #333842', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  padding: 8, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  {history.length === 0 ? (
                    <div style={{ padding: 8, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>No history yet</div>
                  ) : (
                    history.map((mockIdx, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setCurrentIndex(i)
                          setStep('preview')
                          setShowHistory(false)
                        }}
                        style={{
                          background: currentIndex === i ? '#333842' : 'transparent',
                          border: 'none', color: currentIndex === i ? '#fff' : '#e2e8f0',
                          padding: '6px 10px', borderRadius: 4, textAlign: 'left', fontSize: 12, cursor: 'pointer'
                        }}>
                        Generation {i + 1}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <div style={{ flex: 1, background: '#1c1e23', border: '1px solid #333842', borderRadius: 8, display: 'flex', flexDirection: 'column', padding: 16 }}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#e2e8f0', fontSize: 13, lineHeight: '1.6', resize: 'none', fontFamily: 'inherit'
                }}
                disabled={step === 'generating'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                  {currentIndex >= 0 && (
                    <button 
                      onClick={() => {
                        if (currentIndex === 0) {
                          setCurrentIndex(-1)
                          setStep('prompt')
                        } else {
                          setCurrentIndex(currentIndex - 1)
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <i className="fa-solid fa-rotate-left" /> Undo
                    </button>
                  )}
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={step === 'generating'}
                  style={{
                    background: '#7b40f0', color: '#fff', border: 'none', borderRadius: 20,
                    padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: step === 'generating' ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, opacity: step === 'generating' ? 0.5 : 1
                  }}
                >
                  <Sparkles size={14} /> {currentIndex >= 0 ? 'Regenerate' : 'Generate'}
                </button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 12, fontStyle: 'italic' }}>Workflows generated by AI should be checked and validated.</div>
          </div>

          {/* Right Preview Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Preview</span>
              <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={14} /></button>
            </div>

            <div style={{ flex: 1, background: '#1c1e23', border: '1px solid #333842', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              {step === 'prompt' && currentIndex === -1 && (
                <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.3 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 120, height: 40, border: '2px dashed #9ca3af', borderRadius: 6 }} />
                    <div style={{ width: 2, height: 20, background: '#9ca3af', borderStyle: 'dashed' }} />
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div style={{ width: 120, height: 40, border: '2px dashed #9ca3af', borderRadius: 6 }} />
                      <div style={{ width: 120, height: 40, border: '2px dashed #9ca3af', borderRadius: 6 }} />
                    </div>
                  </div>
                </div>
              )}
              
              {step === 'generating' && (
                <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: 0.5, animation: 'pulse 2s infinite' }}>
                     <div style={{ width: 140, height: 44, border: '2px solid #9ca3af', borderRadius: 6 }} />
                     <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                       <div style={{ width: 140, height: 44, border: '2px solid #9ca3af', borderRadius: 6 }} />
                       <div style={{ width: 140, height: 44, border: '2px solid #9ca3af', borderRadius: 6 }} />
                     </div>
                  </div>
                  <div style={{ marginTop: 40, fontSize: 13, color: '#fff', fontStyle: 'italic' }}>Processing your request...</div>
                </div>
              )}

              {step === 'preview' && activeMock && (
                <div className="animate-fade-in" style={{ position: 'absolute', inset: 0 }}>
                  <ReactFlow
                    nodes={activeMock.nodes as any}
                    edges={activeMock.edges.map((e: any) => ({ ...e, style: e.style || { stroke: '#4b5563', strokeWidth: 1.5 }, animated: true })) as any}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnDrag={false}
                    panOnScroll={false}
                    zoomOnScroll={false}
                    zoomOnDoubleClick={false}
                  >
                    <Background variant={'dots' as any} gap={22} size={1} color="rgba(255,255,255,0.05)" style={{ background: 'transparent' }} />
                  </ReactFlow>
                </div>
              )}
              
              {step === 'preview' && (
                <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 10 }}>
                  <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 20, background: 'transparent', border: '1px solid #4b5563', color: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleCreate} style={{ padding: '8px 16px', borderRadius: 20, background: '#e5e7eb', border: 'none', color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Create Workflow</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
