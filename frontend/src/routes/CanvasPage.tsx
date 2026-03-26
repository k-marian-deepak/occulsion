import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'
import { type UserRole, type WorkflowVersion, useWorkflowStore } from '@/stores/workflowStore'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DB, getIntegrationLogo } from '@/data/integrations'
import { ReactFlowProvider, useReactFlow, Panel } from '@xyflow/react'
import { Search, ChevronDown, X, Copy, Trash2, MoreHorizontal, RotateCcw, ArrowRightLeft, Wand2, Settings, Plus, Check, ArrowLeft, Save, RefreshCcw } from 'lucide-react'
import { useCasesStore } from '@/stores/casesStore'

function nodeSignature(node: any) {
  const { __diffType, ...restData } = node.data || {}
  return JSON.stringify({
    type: node.type,
    position: node.position,
    data: restData,
  })
}

function compareVersions(selected: WorkflowVersion, previous?: WorkflowVersion | null) {
  const previousById = new Map((previous?.nodes || []).map((node) => [node.id, node]))
  const decoratedNodes = selected.nodes.map((node: any) => {
    const prev = previousById.get(node.id)
    if (!prev) {
      return { ...node, data: { ...node.data, __diffType: 'added' } }
    }

    previousById.delete(node.id)
    if (nodeSignature(prev) !== nodeSignature(node)) {
      return { ...node, data: { ...node.data, __diffType: 'modified' } }
    }

    const { __diffType, ...restData } = node.data || {}
    return { ...node, data: restData }
  })

  const deletedNodes = Array.from(previousById.values()).map((node: any) => node.data?.label || node.id)

  return {
    nodes: decoratedNodes,
    deletedNodes,
  }
}

export function CanvasPage() {
  const {
    setNodes,
    setEdges,
    nodes,
    edges,
    addNode,
    persistCurrentWorkflowGraph,
    selectedNode,
    currentWorkflowId,
    workflows,
    saveCurrentWorkflowDraft,
    publishCurrentWorkflow,
    submitWorkflowForReview,
    exportWorkflowYaml,
    unpublishWorkflow,
    runWorkflowExecution,
    renameWorkflowVersion,
    restoreWorkflowVersion,
    saveWorkflowVersionAsWorkflow,
    currentUserRole,
    setCurrentUserRole,
  } = useWorkflowStore()
  const location = useLocation()
  const navigate = useNavigate()
  const addCase = useCasesStore(s => s.addCase)
  
  const [search, setSearch] = useState('')
  const [editingStep, setEditingStep] = useState<any | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishMenuOpen, setPublishMenuOpen] = useState(false)
  const [submitForReviewOpen, setSubmitForReviewOpen] = useState(false)
  const [submitStep, setSubmitStep] = useState<1 | 2>(1)
  const [reviewersInput, setReviewersInput] = useState('')
  const [actionsOpen, setActionsOpen] = useState(false)
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [deletedNodes, setDeletedNodes] = useState<string[]>([])
  const [versionMenuId, setVersionMenuId] = useState<string | null>(null)
  const [versionDescription, setVersionDescription] = useState('')
  const [tags, setTags] = useState('')
  const [timeBackMinutes, setTimeBackMinutes] = useState(20)

  const previewBackupRef = useRef<{ nodes: any[]; edges: any[] } | null>(null)
  const fitViewForPrintRef = useRef<(() => void) | null>(null)

  const currentWorkflow = workflows.find((item) => item.id === currentWorkflowId)

  const statusLabel =
    currentWorkflow?.status === 'published_enabled'
      ? 'Published, trigger enabled'
      : currentWorkflow?.status === 'published_disabled'
      ? 'Published, trigger disabled'
      : currentWorkflow?.status === 'has_unpublished_changes'
      ? 'Has unpublished changes'
      : currentWorkflow?.status === 'under_review'
      ? 'Under review'
      : 'Not published'

  const saveDraft = () => {
    return saveCurrentWorkflowDraft(currentWorkflow?.name || 'Untitled workflow')
  }

  const openVersionHistory = () => {
    const workflowId = currentWorkflowId || saveCurrentWorkflowDraft('Untitled workflow')
    const workflow = useWorkflowStore.getState().workflows.find((item) => item.id === workflowId)
    if (!workflow || workflow.versions.length === 0) return

    if (!previewBackupRef.current) {
      previewBackupRef.current = { nodes, edges }
    }

    const latest = workflow.versions[0]
    const previous = workflow.versions[1]
    const compared = compareVersions(latest, previous)
    setNodes(compared.nodes as any)
    setEdges(latest.edges as any)
    setDeletedNodes(compared.deletedNodes)
    setSelectedVersionId(latest.id)
    setVersionHistoryOpen(true)
    setActionsOpen(false)
  }

  const closeVersionHistory = () => {
    const backup = previewBackupRef.current
    if (backup) {
      setNodes(backup.nodes as any)
      setEdges(backup.edges as any)
    } else if (currentWorkflow) {
      setNodes(currentWorkflow.nodes as any)
      setEdges(currentWorkflow.edges as any)
    }

    previewBackupRef.current = null
    setVersionHistoryOpen(false)
    setVersionMenuId(null)
    setDeletedNodes([])
  }

  const selectVersionPreview = (versionId: string) => {
    if (!currentWorkflow) return
    const index = currentWorkflow.versions.findIndex((item) => item.id === versionId)
    if (index < 0) return
    const selected = currentWorkflow.versions[index]
    const previous = currentWorkflow.versions[index + 1]
    const compared = compareVersions(selected, previous)
    setNodes(compared.nodes as any)
    setEdges(selected.edges as any)
    setDeletedNodes(compared.deletedNodes)
    setSelectedVersionId(versionId)
  }

  const handleRenameVersion = (versionId: string) => {
    if (!currentWorkflow) return
    const value = window.prompt('Rename version')
    if (!value) return
    renameWorkflowVersion(currentWorkflow.id, versionId, value)
    setVersionMenuId(null)
  }

  const handleSaveVersionAsWorkflow = (versionId: string) => {
    if (!currentWorkflow) return
    saveWorkflowVersionAsWorkflow(currentWorkflow.id, versionId)
    setVersionMenuId(null)
  }

  const handleRestoreVersion = (versionId: string) => {
    if (!currentWorkflow) return
    restoreWorkflowVersion(currentWorkflow.id, versionId)
    setVersionMenuId(null)
    closeVersionHistory()
  }

  const downloadYaml = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/x-yaml;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = (publishedOnly: boolean) => {
    const workflowId = currentWorkflowId || saveCurrentWorkflowDraft('Untitled workflow')
    if (!workflowId) return
    const yaml = exportWorkflowYaml(workflowId, { publishedOnly })
    if (!yaml) return
    const name = (currentWorkflow?.name || 'workflow').replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase()
    downloadYaml(`${name}${publishedOnly ? '-published' : ''}.yaml`, yaml)
    setActionsOpen(false)
  }

  const registerPrintFitView = useCallback((handler: (() => void) | null) => {
    fitViewForPrintRef.current = handler
  }, [])

  const handleExportPdf = () => {
    setActionsOpen(false)
    setViewMode('designer')
    document.body.classList.add('workflow-pdf-export')

    requestAnimationFrame(() => {
      fitViewForPrintRef.current?.()
      window.setTimeout(() => {
        window.print()
      }, 260)
    })
  }

  const confirmPublish = () => {
    if (currentUserRole === 'creator') return
    publishCurrentWorkflow({
      versionDescription,
      tags: tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      timeBackMinutes,
    })
    setPublishOpen(false)
    setVersionDescription('')
    setTags('')
  }

  const openSubmitForReview = () => {
    setPublishMenuOpen(false)
    setSubmitStep(1)
    setSubmitForReviewOpen(true)
  }

  const submitForReview = () => {
    const workflowId = saveDraft()
    if (!workflowId) return

    submitWorkflowForReview({
      workflowId,
      versionDescription,
      tags: tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      timeBackMinutes,
      reviewers: reviewersInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    })

    setSubmitForReviewOpen(false)
    setSubmitStep(1)
    setVersionDescription('')
    setTags('')
    setReviewersInput('')
  }
  
  const handleRunWorkflow = () => {
    const workflowId = saveDraft()
    if (workflowId) {
      runWorkflowExecution(workflowId)
    }
    addCase({
      id: `cw-${Date.now()}`,
      state: 'new',
      number: Math.floor(Math.random() * 800) + 700,
      category: 'Workflow Automation',
      title: 'Auto-detected Phishing Event via Trigger - ' + new Date().toLocaleTimeString(),
      timeText: 'Just now | Workflow',
      tags: ['Auto-Generated', 'System'],
      assigneeImg: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot',
      severity: 'high'
    })
    navigate('/cases')
  }

  const addAnnotationAtPosition = (position: { x: number; y: number }) => {
    const annotationNode = {
      id: `annotation-${Date.now()}`,
      type: 'annotation',
      position,
      data: {
        content: '',
        pinnedTo: null,
      },
    }

    const nextNodes = [...nodes, annotationNode as any]
    setNodes(nextNodes as any)
    persistCurrentWorkflowGraph(nextNodes as any, edges)
  }
  
  const urlMode = new URLSearchParams(location.search).get('mode')
  const [viewMode, setViewMode] = useState<'designer'|'runlog'>(urlMode === 'runlog' ? 'runlog' : 'designer')

  // On mount, demo node matching Torq screenshot ONLY if canvas is empty
  useEffect(() => {
    if (useWorkflowStore.getState().nodes.length === 0) {
      setNodes([{
        id: 'n-1',
        type: 'trigger',
        position: { x: 350, y: 120 },
        data: { label: 'On-demand' }
      }] as any)
      setEdges([])
    }
  }, [])

  useEffect(() => {
    const clearPrintMode = () => {
      document.body.classList.remove('workflow-pdf-export')
    }

    window.addEventListener('afterprint', clearPrintMode)

    const media = window.matchMedia('print')
    const onPrintChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        clearPrintMode()
      }
    }

    media.addEventListener?.('change', onPrintChange)

    return () => {
      clearPrintMode()
      window.removeEventListener('afterprint', clearPrintMode)
      media.removeEventListener?.('change', onPrintChange)
    }
  }, [])

  const onDragStart = (e: React.DragEvent, action: any) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(action))
    e.dataTransfer.effectAllowed = 'move'
  }

  const visible = DB.filter(a =>
    a.n.toLowerCase().includes(search.toLowerCase()) ||
    a.cat.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="workflow-canvas-page" style={{ display: 'flex', height: '100vh', width: '100%', background: '#0e1015', overflow: 'hidden' }}>
      
      {/* ── Left Sidebar ───────────────────────────────────────── */}
      <div className="workflow-editor-sidebar" style={{
        width: 320, background: '#1c1e23', borderRight: '1px solid #2a2e35',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        boxShadow: '4px 0 20px rgba(0,0,0,0.4)', zIndex: 10,
        overflow: 'hidden'
      }}>
        {viewMode === 'designer' ? (
          <div key="designer" className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Search */}
            <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, background: '#252830',
                border: '1px solid #333842', borderRadius: 6, padding: '7px 12px', flex: 1,
              }}>
                <Search size={14} color="#8891a8" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                  placeholder="Search for an integration"
                />
              </div>
              <button style={{ background: 'none', border: 'none', color: '#8891a8', cursor: 'pointer', padding: 4 }}>
                <i className="fa-solid fa-arrow-right-to-bracket" style={{ fontSize: 14 }} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid #2a2e35', marginBottom: 16, overflowX: 'auto' }}>
              {[
                { label: 'Public', count: 59, active: true },
                { label: 'Cases', count: 0 },
                { label: 'Utilities', count: 0 },
                { label: 'Custom', count: 0 },
              ].map(t => (
                <div key={t.label} style={{
                  flexShrink: 0,
                  padding: '10px 10px', fontSize: 13, fontWeight: t.active ? 600 : 500,
                  color: t.active ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', gap: 6,
                  borderBottom: t.active ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer',
                }}>
                  {t.label} <span style={{ background: t.active ? '#374151' : '#1f2937', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: t.active ? '#fff' : '#9ca3af' }}>{t.count}</span>
                </div>
              ))}
            </div>

            {/* Action List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visible.map((a, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => onDragStart(e, a)}
                  style={{
                    background: '#0e1015', border: '1px solid #2a2e35', borderRadius: 6,
                    padding: '12px', display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'grab', transition: 'border-color .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#4b5563'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2e35'}
                >
                  {/* White Squircle */}
                  <div style={{
                    width: 36, height: 36, background: '#fff', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    <img src={getIntegrationLogo(a.n)} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextSibling) nextSibling.style.display = 'inline-block';
                      }}
                    />
                    <i className={a.fa} style={{ color: a.ic !== '#fff' && a.ic !== 'var(--text)' ? a.ic : '#333', fontSize: 18, display: 'none' }} />
                  </div>

                  {/* Text */}
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{a.cat}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.2 }}>{a.n}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div key="runlog" className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', fontSize: 14, fontWeight: 600 }}>
              Today <RefreshCcw size={14} color="#9ca3af" style={{cursor: 'pointer'}} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, paddingBottom: 24 }}>
              {[
                { time: 'Today at 1:03 PM', dur: '5m 28s', id: 'AA-021493', status: '#22c55e', img: 'Bob' },
                { time: 'Today at 6:55 AM', dur: '1m 5s', id: 'AA-021413', status: '#22c55e', img: 'Alice' },
                { time: 'Today at 3:56 AM', dur: '1m 15s', id: 'AA-021282', status: '#22c55e', img: 'Charlie' },
                { time: 'Today at 12:03 AM', dur: '1m 4s', id: 'AA-020999', status: '#22c55e', initial: 'S' },
              ].map(r => (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto', padding: '12px 20px', alignItems: 'center', cursor: 'pointer', background: r.id === 'AA-021493' ? '#2a2e35' : 'transparent', borderBottom: '1px solid #2a2e35' }}>
                  <div style={{ width: 4, height: 24, background: r.status, borderRadius: 2 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 12 }}>
                    <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{r.time}</div>
                    <div style={{ color: '#9ca3af', fontSize: 12 }}>Duration: {r.dur}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {r.img ? <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.img}`} width={24} height={24} style={{ borderRadius: '50%', background: '#333842' }} alt="" /> : <div style={{width: 24, height: 24, background: '#3b82f6', borderRadius: '50%', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>{r.initial}</div>}
                    <div style={{ color: '#9ca3af', fontSize: 13 }}>{r.id}</div>
                  </div>
                </div>
              ))}
              
              <div style={{ padding: '20px 20px 12px', color: '#fff', fontSize: 14, fontWeight: 600, marginTop: 8 }}>Last 7 days</div>
               {[
                { time: 'Sep 16 2024, 9:27 AM', dur: '1m 3s', id: 'AA-020855', status: '#22c55e', img: 'Alice' },
                { time: 'Sep 16 2024, 3:29 AM', dur: '1m 10s', id: 'AA-020803', status: '#22c55e', img: 'Alice' },
                { time: 'Sep 11 2024, 6:11 AM', dur: '1m 11s', id: 'AA-020655', status: '#22c55e', initial: 'S' },
              ].map(r => (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto', padding: '12px 20px', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #2a2e35' }}>
                  <div style={{ width: 4, height: 24, background: r.status, borderRadius: 2 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 12 }}>
                    <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{r.time}</div>
                    <div style={{ color: '#9ca3af', fontSize: 12 }}>Duration: {r.dur}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {r.img ? <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.img}`} width={24} height={24} style={{ borderRadius: '50%', background: '#333842' }} alt="" /> : <div style={{width: 24, height: 24, background: '#3b82f6', borderRadius: '50%', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>{r.initial}</div>}
                    <div style={{ color: '#9ca3af', fontSize: 13 }}>{r.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Canvas Area ──────────────────────────────────────── */}
      <div className="workflow-pdf-target" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ReactFlowProvider>
          <WorkflowCanvasWrapper addNode={addNode as any} onPrintReady={registerPrintFitView} onAddAnnotation={addAnnotationAtPosition}>
            {/* Top Header Toggle & Breadcrumb */}
            <Panel position="top-left" className="workflow-editor-chrome" style={{ margin: 0, width: '100%', pointerEvents: 'none', zIndex: 10 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', left: 24, pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12, color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>
                  <div style={{ width: 28, height: 28, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-code-branch" style={{ color: '#000', fontSize: 14 }} />
                  </div>
                  socrates-playground <span style={{color: '#9ca3af'}}>/</span> Create a Phishing Demo Case
                </div>
                
                <div style={{ pointerEvents: 'auto', background: '#1c1e23', border: '1px solid #333842', borderRadius: 8, padding: 4, display: 'flex', gap: 4 }}>
                  <button 
                    onClick={() => setViewMode('designer')}
                    style={{ padding: '6px 20px', background: viewMode === 'designer' ? '#333842' : 'transparent', border: 'none', borderRadius: 6, color: viewMode === 'designer' ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    Designer
                  </button>
                  <button 
                    onClick={() => setViewMode('runlog')}
                    style={{ padding: '6px 20px', background: viewMode === 'runlog' ? '#333842' : 'transparent', border: 'none', borderRadius: 6, color: viewMode === 'runlog' ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    Run Log
                  </button>
                </div>

                <div style={{ position: 'absolute', right: 24, pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select
                    value={currentUserRole}
                    onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
                    style={{ background: '#1c1e23', border: '1px solid #333842', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 12 }}
                  >
                    <option value="creator">Creator</option>
                    <option value="contributor">Contributor</option>
                    <option value="owner">Owner</option>
                  </select>
                  <div style={{ fontSize: 12, color: '#9ca3af', padding: '6px 10px', border: '1px solid #333842', borderRadius: 6, background: '#1c1e23' }}>
                    {statusLabel}
                  </div>
                  <button onClick={saveDraft} style={{ background: 'transparent', color: '#fff', border: '1px solid #4b5563', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <i className="fa-regular fa-floppy-disk" style={{ fontSize: 12, marginRight: 6 }} /> Save
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', borderRadius: 6, overflow: 'hidden', border: '1px solid #4b5563' }}>
                    <button
                      onClick={() => {
                        if (currentUserRole === 'creator') {
                          openSubmitForReview()
                          return
                        }
                        setPublishOpen(true)
                      }}
                      style={{ background: '#e5e7eb', color: '#000', border: 'none', padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {currentUserRole === 'creator' ? 'Submit' : 'Publish'}
                    </button>
                    <button
                      onClick={() => setPublishMenuOpen((prev) => !prev)}
                      style={{ background: '#d1d5db', color: '#000', border: 'none', borderLeft: '1px solid #9ca3af', padding: '8px 10px', cursor: 'pointer' }}
                    >
                      <ChevronDown size={13} />
                    </button>
                    {publishMenuOpen && (
                      <div style={{ position: 'absolute', top: 42, right: 255, width: 220, background: '#252830', border: '1px solid #333842', borderRadius: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 30 }}>
                        <button onClick={openSubmitForReview} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer' }}>
                          <i className="fa-regular fa-paper-plane" style={{ marginRight: 8 }} /> Submit for review
                        </button>
                        <button
                          onClick={() => {
                            setPublishMenuOpen(false)
                            if (currentUserRole !== 'creator') setPublishOpen(true)
                          }}
                          disabled={currentUserRole === 'creator'}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: currentUserRole === 'creator' ? 'not-allowed' : 'pointer', opacity: currentUserRole === 'creator' ? 0.5 : 1 }}
                        >
                          <i className="fa-solid fa-check" style={{ marginRight: 8 }} /> Publish to production
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={handleRunWorkflow} style={{ background: '#7b40f0', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(123, 64, 240, 0.3)' }}>
                    <i className="fa-solid fa-play" style={{ fontSize: 12 }} /> Save & Run Workflow
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setActionsOpen((prev) => !prev)} style={{ background: 'transparent', color: '#e2e8f0', border: '1px solid #4b5563', borderRadius: 6, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}>
                      <MoreHorizontal size={16} />
                    </button>
                    {actionsOpen && (
                      <div style={{ position: 'absolute', top: 42, right: 0, width: 220, background: '#252830', border: '1px solid #333842', borderRadius: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 30 }}>
                        <button onClick={handleExportPdf} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer' }}>
                          <i className="fa-solid fa-file-pdf" style={{ marginRight: 8 }} /> Export as PDF
                        </button>
                        <button onClick={() => handleExport(false)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer' }}>
                          <i className="fa-solid fa-arrow-up-from-bracket" style={{ marginRight: 8 }} /> Export workflow
                        </button>
                        <button onClick={() => handleExport(true)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer' }}>
                          <i className="fa-solid fa-arrow-up-from-bracket" style={{ marginRight: 8 }} /> Export published
                        </button>
                        <button
                          onClick={openVersionHistory}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 8 }} /> Version History
                        </button>
                        {currentWorkflow && currentWorkflow.status !== 'not_published' && (
                          <button
                            onClick={() => {
                              unpublishWorkflow(currentWorkflow.id)
                              setActionsOpen(false)
                            }}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-eye-slash" style={{ marginRight: 8 }} /> Unpublish workflow
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Panel>

            <Panel position="bottom-center" className="workflow-editor-chrome" style={{ margin: 0, bottom: 24, zIndex: 10 }}>
              <FloatingToolbarInner />
            </Panel>
          </WorkflowCanvasWrapper>
        </ReactFlowProvider>

      </div>

      {/* ── Properties Panel ─────────────────────────────────── */}
      {selectedNode && (
        <PropertiesPanel node={selectedNode} onEditStep={() => setEditingStep(selectedNode)} />
      )}

      {editingStep && (
        <StepBuilder node={editingStep} onClose={() => setEditingStep(null)} />
      )}

      {versionHistoryOpen && currentWorkflow && (
        <div className="workflow-editor-modal" style={{ position: 'fixed', top: 84, left: 86, bottom: 18, width: 420, background: '#2a2e35', border: '1px solid #4b5563', borderRadius: 10, zIndex: 900, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '18px 16px 8px', borderBottom: '1px solid #4b5563', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>Version history</div>
            <button onClick={closeVersionHistory} style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <VersionHistorySection
              title="Unpublished versions"
              versions={currentWorkflow.versions.filter((version) => version.kind === 'draft')}
              selectedVersionId={selectedVersionId}
              onSelect={selectVersionPreview}
              versionMenuId={versionMenuId}
              setVersionMenuId={setVersionMenuId}
              onRename={handleRenameVersion}
              onSaveAsWorkflow={handleSaveVersionAsWorkflow}
              onRestore={handleRestoreVersion}
            />

            <VersionHistorySection
              title="Published versions"
              versions={currentWorkflow.versions.filter((version) => version.kind === 'published')}
              selectedVersionId={selectedVersionId}
              onSelect={selectVersionPreview}
              versionMenuId={versionMenuId}
              setVersionMenuId={setVersionMenuId}
              onRename={handleRenameVersion}
              onSaveAsWorkflow={handleSaveVersionAsWorkflow}
              onRestore={handleRestoreVersion}
            />

            {deletedNodes.length > 0 && (
              <div style={{ border: '1px dashed #ef4444', borderRadius: 8, padding: 10, background: 'rgba(239,68,68,0.08)' }}>
                <div style={{ color: '#fca5a5', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Deleted steps</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {deletedNodes.map((name) => (
                    <div key={name} style={{ color: '#fecaca', fontSize: 12 }}>• {name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {publishOpen && (
        <div className="workflow-editor-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 520, background: '#252830', border: '1px solid #333842', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #333842', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Publish workflow</div>
              <button onClick={() => setPublishOpen(false)} style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Version description</div>
                <input
                  value={versionDescription}
                  onChange={(e) => setVersionDescription(e.target.value)}
                  placeholder="What changed in this version..."
                  style={{ width: '100%', background: '#1c1e23', border: '1px solid #4b5563', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', outline: 'none', fontSize: 13 }}
                />
              </div>

              <div>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tags</div>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="phishing, email, triage"
                  style={{ width: '100%', background: '#1c1e23', border: '1px solid #4b5563', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', outline: 'none', fontSize: 13 }}
                />
              </div>

              <div>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>TimeBack benchmark ({timeBackMinutes} min)</div>
                <input
                  type="range"
                  min={5}
                  max={240}
                  step={5}
                  value={timeBackMinutes}
                  onChange={(e) => setTimeBackMinutes(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #333842', padding: '14px 22px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setPublishOpen(false)} style={{ background: 'transparent', color: '#e2e8f0', border: '1px solid #4b5563', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmPublish} style={{ background: '#e5e7eb', color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {submitForReviewOpen && (
        <div className="workflow-editor-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 520, background: '#252830', border: '1px solid #333842', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #333842', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Submit workflow for review</div>
              <button onClick={() => setSubmitForReviewOpen(false)} style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {submitStep === 1 ? (
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Version description</div>
                  <input
                    value={versionDescription}
                    onChange={(e) => setVersionDescription(e.target.value)}
                    placeholder="What changed in this version..."
                    style={{ width: '100%', background: '#1c1e23', border: '1px solid #4b5563', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', outline: 'none', fontSize: 13 }}
                  />
                </div>

                <div>
                  <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tags</div>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="phishing, email, triage"
                    style={{ width: '100%', background: '#1c1e23', border: '1px solid #4b5563', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', outline: 'none', fontSize: 13 }}
                  />
                </div>

                <div>
                  <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>TimeBack benchmark ({timeBackMinutes} min)</div>
                  <input
                    type="range"
                    min={5}
                    max={240}
                    step={5}
                    value={timeBackMinutes}
                    onChange={(e) => setTimeBackMinutes(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ borderTop: '1px solid #333842', paddingTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setSubmitForReviewOpen(false)} style={{ background: 'transparent', color: '#e2e8f0', border: '1px solid #4b5563', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={() => setSubmitStep(2)} style={{ background: '#e5e7eb', color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6 }}>
                  You can choose specific reviewers or none. This triggers any workflow using the Request for review system event.
                </div>
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Choose contributors (emails, comma separated)</div>
                  <input
                    value={reviewersInput}
                    onChange={(e) => setReviewersInput(e.target.value)}
                    placeholder="alice@company.com, bob@company.com"
                    style={{ width: '100%', background: '#1c1e23', border: '1px solid #4b5563', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', outline: 'none', fontSize: 13 }}
                  />
                </div>
                <div style={{ borderTop: '1px solid #333842', paddingTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setSubmitForReviewOpen(false)} style={{ background: 'transparent', color: '#e2e8f0', border: '1px solid #4b5563', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={submitForReview} style={{ background: '#e5e7eb', color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function VersionHistorySection({
  title,
  versions,
  selectedVersionId,
  onSelect,
  versionMenuId,
  setVersionMenuId,
  onRename,
  onSaveAsWorkflow,
  onRestore,
}: {
  title: string
  versions: WorkflowVersion[]
  selectedVersionId: string | null
  onSelect: (versionId: string) => void
  versionMenuId: string | null
  setVersionMenuId: (versionId: string | null) => void
  onRename: (versionId: string) => void
  onSaveAsWorkflow: (versionId: string) => void
  onRestore: (versionId: string) => void
}) {
  return (
    <div>
      <div style={{ color: '#cbd5e1', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {versions.length === 0 && (
          <div style={{ color: '#9ca3af', fontSize: 12 }}>No versions</div>
        )}

        {versions.map((version) => (
          <div
            key={version.id}
            onClick={() => onSelect(version.id)}
            style={{
              border: selectedVersionId === version.id ? '1px solid #60a5fa' : '1px solid #4b5563',
              background: selectedVersionId === version.id ? 'rgba(59,130,246,0.14)' : '#1c1e23',
              borderRadius: 8,
              padding: '10px 12px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{version.name}</div>
            <div style={{ color: '#d1d5db', fontSize: 12 }}>{new Date(version.createdAt).toLocaleString()}</div>
            <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>{version.author}</div>

            {version.reviewState === 'under_review' && (
              <i
                className="fa-regular fa-hourglass"
                style={{ position: 'absolute', right: 34, top: 10, color: '#facc15', fontSize: 13 }}
              />
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                setVersionMenuId(versionMenuId === version.id ? null : version.id)
              }}
              style={{ position: 'absolute', right: 8, top: 8, background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              <MoreHorizontal size={15} />
            </button>

            {versionMenuId === version.id && (
              <div style={{ position: 'absolute', right: 8, top: 30, width: 150, background: '#1c1e23', border: '1px solid #4b5563', borderRadius: 8, zIndex: 20, boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
                <button onClick={(e) => { e.stopPropagation(); onRename(version.id) }} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontSize: 12 }}>
                  Rename version
                </button>
                <button onClick={(e) => { e.stopPropagation(); onSaveAsWorkflow(version.id) }} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontSize: 12 }}>
                  Save as workflow
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRestore(version.id) }} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontSize: 12 }}>
                  Restore version
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkflowCanvasWrapper({
  addNode,
  children,
  onPrintReady,
  onAddAnnotation,
}: {
  addNode: (node: any) => void
  children?: React.ReactNode
  onPrintReady: (handler: (() => void) | null) => void
  onAddAnnotation: (position: { x: number; y: number }) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <DropZone addNode={addNode} onPrintReady={onPrintReady} onAddAnnotation={onAddAnnotation}>
        {children}
      </DropZone>
    </div>
  )
}

function FloatingToolbarInner() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  
  return (
    <div style={{ background: '#1c1e23', border: '1px solid #333842', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <i className="fa-solid fa-magnifying-glass-minus" onClick={() => zoomOut()} style={{ color: '#e2e8f0', fontSize: 16, cursor: 'pointer' }} />
      <i className="fa-solid fa-magnifying-glass-plus" onClick={() => zoomIn()} style={{ color: '#e2e8f0', fontSize: 16, cursor: 'pointer' }} />
      <div style={{ width: 1, height: 24, background: '#333842' }} />
      <i className="fa-solid fa-location-arrow" style={{ color: '#e2e8f0', fontSize: 16, cursor: 'pointer', transform: 'rotate(-45deg)', paddingRight: 4, marginTop: 4 }} />
      <div style={{ width: 1, height: 24, background: '#333842' }} />
      <i className="fa-solid fa-expand" onClick={() => fitView()} style={{ color: '#e2e8f0', fontSize: 16, cursor: 'pointer' }} />
      <i className="fa-solid fa-compress" onClick={() => fitView()} style={{ color: '#e2e8f0', fontSize: 16, cursor: 'pointer' }} />
      <div style={{ width: 1, height: 24, background: '#333842' }} />
      <i className="fa-regular fa-keyboard" style={{ color: '#e2e8f0', fontSize: 18, cursor: 'pointer' }} />
      <i className="fa-solid fa-magnifying-glass" style={{ color: '#e2e8f0', fontSize: 16, cursor: 'pointer' }} />
    </div>
  )
}

function PrintFitBridge({ onPrintReady }: { onPrintReady: (handler: (() => void) | null) => void }) {
  const { fitView } = useReactFlow()

  useEffect(() => {
    const handler = () => {
      fitView({ padding: 0.2, duration: 140 })
    }
    onPrintReady(handler)
    return () => onPrintReady(null)
  }, [fitView, onPrintReady])

  return null
}

function DropZone({
  addNode,
  children,
  onPrintReady,
  onAddAnnotation,
}: {
  addNode: (node: any) => void
  children?: React.ReactNode
  onPrintReady: (handler: (() => void) | null) => void
  onAddAnnotation: (position: { x: number; y: number }) => void
}) {
  const { screenToFlowPosition } = useReactFlow()
  const [contextMenu, setContextMenu] = useState<
    | {
        screenX: number
        screenY: number
        flowX: number
        flowY: number
      }
    | null
  >(null)

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const str = e.dataTransfer.getData('application/reactflow')
    if (!str) return

    const action = JSON.parse(str)
    
    // Convert screen coordinates to ReactFlow coordinates
    let position = { x: e.clientX - 100, y: e.clientY - 30 }
    if (screenToFlowPosition) {
      position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    }

    const newNode = {
      id: `node-${Date.now()}`,
      type: 'step',
      position,
      data: { 
        label: action.n, 
        subtext: action.cat,
        iconUrl: getIntegrationLogo(action.n),
      },
    }

    addNode(newNode)
  }, [addNode, screenToFlowPosition])

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      const flowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      setContextMenu({
        screenX: event.clientX,
        screenY: event.clientY,
        flowX: flowPosition.x,
        flowY: flowPosition.y,
      })
    },
    [screenToFlowPosition],
  )

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onContextMenu={onContextMenu}
      onClick={() => setContextMenu(null)}
    >
      <WorkflowCanvas>
        <PrintFitBridge onPrintReady={onPrintReady} />
        {children}
      </WorkflowCanvas>

      {contextMenu && (
        <div
          className="nodrag"
          style={{
            position: 'fixed',
            top: contextMenu.screenY,
            left: contextMenu.screenX,
            background: '#1c1e23',
            border: '1px solid #333842',
            borderRadius: 8,
            width: 170,
            padding: 6,
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
            zIndex: 1200,
          }}
        >
          <button
            onClick={() => {
              onAddAnnotation({ x: contextMenu.flowX, y: contextMenu.flowY })
              setContextMenu(null)
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: 6,
              color: '#e2e8f0',
              textAlign: 'left',
              padding: '8px 10px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            <i className="fa-regular fa-note-sticky" style={{ marginRight: 8 }} /> Add annotation
          </button>
        </div>
      )}
    </div>
  )
}

const WORKFLOW_CONTEXT_PATHS = [
  { path: '$.event', group: 'Event', description: 'Trigger event payload' },
  { path: '$.event.user.firstName', group: 'Event', description: 'Triggered user first name' },
  { path: '$.event.user.macAddress', group: 'Event', description: 'Triggered user MAC address' },
  { path: '$.integrations', group: 'Integrations', description: 'Configured integrations root' },
  { path: '$.integrations.wiz_demo', group: 'Integrations', description: 'Sample integration config' },
  { path: '$.secrets', group: 'Secrets', description: 'Secrets root' },
  { path: '$.secrets.<secret_key>', group: 'Secrets', description: 'Specific secret by key' },
  { path: '$.extract_urls_from_email.results', group: 'Step Outputs', description: 'Output from prior step' },
  { path: '$.raw_data.output', group: 'Step Outputs', description: 'Raw data step output' },
  { path: '$.escaped_string.output', group: 'Step Outputs', description: 'Escaped string step output' },
  { path: '$.metadata.account_id', group: 'Metadata', description: 'Workspace ID' },
  { path: '$.metadata.account_name', group: 'Metadata', description: 'Workspace name' },
  { path: '$.metadata.event_id', group: 'Metadata', description: 'Trigger event ID' },
  { path: '$.metadata.execution_id', group: 'Metadata', description: 'Execution ID' },
  { path: '$.metadata.execution_nested_level', group: 'Metadata', description: 'Execution nesting depth' },
  { path: '$.metadata.execution_url', group: 'Metadata', description: 'Execution run-log URL' },
  { path: '$.metadata.parent_execution_id', group: 'Metadata', description: 'Parent execution ID' },
  { path: '$.metadata.parent_workflow_id', group: 'Metadata', description: 'Parent workflow ID' },
  { path: '$.metadata.user_email', group: 'Metadata', description: 'Triggering user email' },
  { path: '$.metadata.workflow_id', group: 'Metadata', description: 'Workflow ID' },
  { path: '$.metadata.workflow_name', group: 'Metadata', description: 'Workflow name' },
  { path: '$.metadata.workflow_revision_id', group: 'Metadata', description: 'Workflow revision ID' },
  { path: '$.metadata.case.id', group: 'Metadata', description: 'Case ID (if applicable)' },
]

function findContextTokenContext(value: string, cursorPosition: number) {
  const uptoCursor = value.slice(0, cursorPosition)
  const tokenStart = uptoCursor.lastIndexOf('$')
  if (tokenStart < 0) return null

  const typedToken = uptoCursor.slice(tokenStart)
  if (!typedToken.startsWith('$.')) return null
  if (typedToken.includes('}') || typedToken.includes('{') || typedToken.includes(' ')) {
    return null
  }

  const leftPart = value.slice(0, tokenStart)
  const isInsideTemplate =
    leftPart.lastIndexOf('{{') > leftPart.lastIndexOf('}}')

  return {
    start: tokenStart,
    end: cursorPosition,
    query: typedToken,
    isInsideTemplate,
  }
}

function buildContextToken(path: string) {
  return `{{ ${path} }}`
}

const DEFAULT_RAW_DATA_INPUT = '"\nan\nexample\n"'
const DEFAULT_ADD_TO_JSON_INPUT = '{"data":"{{ jsonescape $.raw_data.output }}"}'
const DEFAULT_ESCAPE_JSON_INPUT = '{{ $.raw_data.output }}'
const DEFAULT_PYTHON_INPUT = '{{ jsonescape $.raw_data.output }}'
const DEFAULT_CURLY_ESCAPE_STATIC = '{{`{{THIS WILL BE PRINTED INSIDE}}`}}'
const DEFAULT_CURLY_ESCAPE_EXPRESSION = '{{`{{{{$.sample_output.api_object.updated}}}}`}}'
const DEFAULT_NESTED_CONTEXT_STEP = '{{ $.step_1.{{ $.step_2.key_2 }}.inner_key_2 }}'
const DEFAULT_NESTED_CONTEXT_INTEGRATION =
  '{{ $.integrations.{{ $.some_step.required_integration_name }}.some_value_from_the_integration }}'
const DEFAULT_DATETIME_BASE_FORMAT = '%Y-%m-%dT%H:%M:%S:%f'
const DEFAULT_ADVANCED_TEMPLATE = '{{ len $.hosts }}'
const DEFAULT_URLQUERY_SOURCE = 'https://www.torq.io/?q=security automation'
const DEFAULT_JQ_EXPRESSION = 'reduce .[] as $i ({}; .[$i.description] = $i)'

const SAMPLE_HOSTS_CONTEXT = {
  hosts: [
    {
      name: 'host1',
      interfaces: [
        { name: 'Interface 1 of Host 1', address: '10.10.10.1', weight: 10 },
        { name: 'Interface 2 of Host 1', address: '10.10.10.2', weight: 20 },
      ],
    },
    {
      name: 'host2',
      interfaces: [
        { name: 'Interface 1 of Host 2', address: '20.20.20.1', weight: 10 },
        { name: 'Interface 2 of Host 2', address: '20.20.20.2', weight: 20 },
        { name: 'Interface 3 of Host 2', address: '20.20.20.3', weight: 30 },
      ],
    },
  ],
}

const ADVANCED_TEMPLATE_EXAMPLES = [
  { label: 'len', template: '{{ len $.hosts }}' },
  { label: 'index', template: '{{ (index (index $.hosts 0).interfaces 0).name }}' },
  { label: 'bracket', template: '{{ $.hosts[0].interfaces[0].name }}' },
  { label: 'slice', template: '{{ $.hosts[1].interfaces[:2][1].name }}' },
  { label: 'filter', template: '{{ $.hosts[1].interfaces[?(@.weight > 10)][0].name }}' },
  { label: 'regex', template: '{{ $.hosts[1].interfaces[?(@.name=~ /(Interface [23])/)] }}' },
  { label: 'if/else', template: '{{ if (gt (len $.hosts) 1) -}} Multiple hosts found {{- else -}} Single host found {{- end}}' },
  { label: 'range', template: 'We currently have {{ len $.hosts }} hosts and their names are: {{ range $index, $host:= $.hosts }} {{ $host.name }} {{ end }}' },
  { label: 'urlquery', template: '{{ urlquery $.unescaped_url.result }}' },
]

const JQ_EXPRESSION_LIBRARY = [
  {
    label: 'Filter records older than 90 days',
    expression:
      'group_by(.userPrincipalName) | map(.[] + {"lastSignInDateEpoch":(.[].signInActivity.lastSignInDateTime //empty | fromdateiso8601 as $Epochdate | $Epochdate) }) | .[] | select (.lastSignInDateEpoch < {{ $.get_date.timestamp }} )',
    description: 'Filter array records by computed sign-in epoch timestamp.',
  },
  {
    label: 'Compare arrays by common key',
    expression: '[[.[0]+.[1] | group_by(.email)[] ] | .[] |select (length > 1) |add]',
    description: 'Merge two arrays and keep records that share the same email key.',
  },
  {
    label: 'Reduce array into object',
    expression: 'reduce .[] as $i ({}; .[$i.description] = $i)',
    description: 'Convert list into object keyed by description.',
  },
  {
    label: 'Merge data points into array',
    expression:
      '.[] | {"event":.,"time": (.timestamp | scan("(.+?)([.][0-9]+)?Z$") | [(.[0] + "Z" | fromdateiso8601), (.[1] // 0 | tonumber)] | add), "index": "{{ $.set_workflow_variables.vars.splunk_index }}", "source": "{{ $.set_workflow_variables.vars.splunk_source }}", "host": "{{ $.set_workflow_variables.vars.splunk_host }}", "sourcetype": "{{ $.set_workflow_variables.vars.splunk_sourcetype }}" }',
    description: 'Map each event to Splunk payload shape with computed timestamp.',
  },
  {
    label: 'Delete keys from JSON',
    expression: '[.[] | del (.field3)]',
    description: 'Delete a field from each object without listing all keys.',
  },
  {
    label: 'Concatenate and dedupe 5 lists',
    expression: '[.[0]+.[1]+.[2]+.[3]+.[4] ] | add | unique',
    description: 'Concatenate multiple lists and remove duplicates.',
  },
]

const SPRIG_FUNCTIONS_LIBRARY = [
  {
    category: 'Date and Time',
    functions: [
      { name: 'now', template: '{{ now }}', description: 'Current timestamp' },
      { name: 'date', template: '{{ now | date "2006-01-02" }}', description: 'Format timestamp with layout' },
      { name: 'unixEpoch', template: '{{ unixEpoch now }}', description: 'Unix timestamp (seconds)' },
      { name: 'ago', template: '{{ $.timestamp | ago }}', description: 'Time elapsed since timestamp' },
      { name: 'toDate', template: '{{ toDate "2006-01-02T15:04:05Z" "2025-10-04T15:30:00Z" }}', description: 'Parse date string' },
      { name: 'date_in_zone', template: '{{ date_in_zone "2006-01-02T15:04:05Z" (now) "America/Chicago" }}', description: 'Convert to timezone' },
      { name: 'date_modify', template: '{{ now | date_modify "-2h" | date "2006-01-02T15:04:05Z" }}', description: 'Add/subtract duration' },
      { name: 'duration', template: '{{ duration "7199" }}', description: 'Convert duration string' },
      { name: 'now.Unix', template: '{{ now.Unix }}', description: 'Current Unix timestamp' },
      { name: 'now.UnixMilli', template: '{{ now.UnixMilli }}', description: 'Current timestamp in milliseconds' },
      { name: 'now.Year', template: '{{ now.Year }}', description: 'Current year' },
      { name: 'now.Month', template: '{{ now.Month }}', description: 'Current month name' },
      { name: 'now.Day', template: '{{ now.Day }}', description: 'Current day of month' },
      { name: 'now.Weekday', template: '{{ now.Weekday }}', description: 'Current day of week' },
    ],
  },
  {
    category: 'Base64',
    functions: [
      { name: 'b64enc', template: '{{ b64enc "hello world" }}', description: 'Base64 encode' },
      { name: 'b64dec', template: '{{ b64dec "aGVsbG8gd29ybGQ=" }}', description: 'Base64 decode' },
    ],
  },
  {
    category: 'Defaults and Logic',
    functions: [
      { name: 'default', template: '{{ default "N/A" $.user.email }}', description: 'Provide default value if empty' },
      { name: 'ternary', template: '{{ ternary "High" "Low" (gt $.severity 7) }}', description: 'Conditional value selection' },
      { name: 'empty', template: '{{ empty $.field }}', description: 'Check if value is empty' },
    ],
  },
  {
    category: 'Data Conversion',
    functions: [
      { name: 'jsonEscape', template: '{{ jsonEscape "hello \\"world\\"" }}', description: 'Escape for JSON' },
      { name: 'toJson', template: '{{ toJson (dict "user" "alice") }}', description: 'Convert to JSON' },
      { name: 'toPrettyJson', template: '{{ toPrettyJson (dict "user" "alice") }}', description: 'Pretty-print JSON' },
      { name: 'toRawJson', template: '{{ toRawJson (dict "user" "alice") }}', description: 'Raw JSON (no escape)' },
      { name: 'int', template: '{{ int "42" }}', description: 'Convert to integer' },
      { name: 'toString', template: '{{ toString 42 }}', description: 'Convert to string' },
      { name: 'toStrings', template: '{{ toStrings (list 1 true "alert") }}', description: 'Convert list to strings' },
    ],
  },
  {
    category: 'String Manipulation',
    functions: [
      { name: 'trim', template: '{{ trim " alert triggered " }}', description: 'Remove spaces' },
      { name: 'trimAll', template: '{{ trimAll "-" "----alert----" }}', description: 'Remove all specified chars' },
      { name: 'trimPrefix', template: '{{ trimPrefix "user_" "user_admin" }}', description: 'Remove prefix' },
      { name: 'trimSuffix', template: '{{ trimSuffix ".log" "incident.log" }}', description: 'Remove suffix' },
      { name: 'upper', template: '{{ upper "torq" }}', description: 'Uppercase' },
      { name: 'lower', template: '{{ lower "TORQ" }}', description: 'Lowercase' },
      { name: 'title', template: '{{ title "security incident" }}', description: 'Title case' },
      { name: 'substr', template: '{{ substr 4 12 "TorqSecurityPlatform" }}', description: 'Extract substring' },
      { name: 'nospace', template: '{{ nospace "SOC Operations" }}', description: 'Remove whitespace' },
      { name: 'trunc', template: '{{ trunc 5 "incidentresponse" }}', description: 'Truncate string' },
      { name: 'contains', template: '{{ contains "Malware" $.alert_message }}', description: 'Check substring exists' },
      { name: 'replace', template: '{{ replace " " "-" "SOC Alert Active" }}', description: 'Replace substring' },
      { name: 'join', template: '{{ join "," (list "a" "b" "c") }}', description: 'Join array into string' },
      { name: 'split', template: '{{ split "," "a,b,c" }}', description: 'Split string into list' },
      { name: 'snakecase', template: '{{ snakecase "Security Incident" }}', description: 'snake_case format' },
      { name: 'camelcase', template: '{{ camelcase "Security Incident" }}', description: 'camelCase format' },
      { name: 'kebabcase', template: '{{ kebabcase "Security Incident" }}', description: 'kebab-case format' },
      { name: 'hasPrefix', template: '{{ hasPrefix "alert_" "alert_high" }}', description: 'Check prefix match' },
      { name: 'hasSuffix', template: '{{ hasSuffix "_high" "alert_high" }}', description: 'Check suffix match' },
      { name: 'wrap', template: '{{ wrap 30 "This is a long statement" }}', description: 'Wrap text with newlines' },
    ],
  },
  {
    category: 'Regex',
    functions: [
      { name: 'regexMatch', template: '{{ regexMatch "^user.*" "user123" }}', description: 'Test regex pattern' },
      { name: 'regexFind', template: '{{ regexFind "[0-9]+" "User123LoggedIn" }}', description: 'Find first match' },
      { name: 'regexFindAll', template: '{{ regexFindAll "[0-9]+" "Item12Box34" -1 }}', description: 'Find all matches' },
      { name: 'regexReplaceAll', template: '{{ regexReplaceAll "[0-9]+" "#" "User123LoggedIn" }}', description: 'Replace all matches' },
      { name: 'regexSplit', template: '{{ regexSplit "[,;\\s]+" "alpha, beta; gamma" -1 }}', description: 'Split by regex pattern' },
    ],
  },
  {
    category: 'Math',
    functions: [
      { name: 'add', template: '{{ add 5 3 }}', description: 'Addition' },
      { name: 'sub', template: '{{ sub 10 4 }}', description: 'Subtraction' },
      { name: 'mul', template: '{{ mul 3 5 }}', description: 'Multiplication' },
      { name: 'div', template: '{{ div 20 4 }}', description: 'Division' },
      { name: 'add1', template: '{{ add1 4 }}', description: 'Increment by 1' },
      { name: 'mod', template: '{{ mod 10 3 }}', description: 'Modulus (remainder)' },
      { name: 'max', template: '{{ max 3 7 2 }}', description: 'Maximum value' },
      { name: 'min', template: '{{ min 3 7 2 }}', description: 'Minimum value' },
      { name: 'floor', template: '{{ floor 4.9 }}', description: 'Round down' },
      { name: 'ceil', template: '{{ ceil 4.1 }}', description: 'Round up' },
      { name: 'round', template: '{{ round 4.5 }}', description: 'Round to nearest' },
    ],
  },
  {
    category: 'Lists',
    functions: [
      { name: 'list', template: '{{ list "one" "two" "three" | toJson }}', description: 'Create array' },
      { name: 'first', template: '{{ first $.items }}', description: 'Get first element' },
      { name: 'last', template: '{{ last $.items }}', description: 'Get last element' },
      { name: 'rest', template: '{{ rest (list 1 2 3) | toJson }}', description: 'All but first' },
      { name: 'initial', template: '{{ initial $.items | toJson }}', description: 'All but last' },
      { name: 'append', template: '{{ append $.items 4 | toJson }}', description: 'Add to end' },
      { name: 'prepend', template: '{{ prepend $.items 0 | toJson }}', description: 'Add to beginning' },
      { name: 'uniq', template: '{{ uniq $.items | toJson }}', description: 'Remove duplicates' },
      { name: 'without', template: '{{ without (list 1 2 3 4) 2 4 }}', description: 'Exclude values' },
      { name: 'slice', template: '{{ slice $.items 1 3 | toJson }}', description: 'Extract sub-array' },
      { name: 'has', template: '{{ has "error" $.items }}', description: 'Check item exists' },
      { name: 'len', template: '{{ len $.items }}', description: 'Array/string length' },
    ],
  },
  {
    category: 'Dictionaries',
    functions: [
      { name: 'dict', template: '{{ dict "name" "Alice" "age" 30 | toJson }}', description: 'Create object' },
      { name: 'keys', template: '{{ keys (dict "a" 1 "b" 2) | toJson }}', description: 'Get all keys' },
      { name: 'values', template: '{{ values (dict "a" 1 "b" 2) | toJson }}', description: 'Get all values' },
      { name: 'set', template: '{{ set (dict "a" 1) "b" 2 | toJson }}', description: 'Add/update key' },
      { name: 'unset', template: '{{ unset (dict "a" 1 "b" 2) "a" | toJson }}', description: 'Remove key' },
      { name: 'hasKey', template: '{{ hasKey (dict "a" 1) "a" }}', description: 'Check key exists' },
      { name: 'merge', template: '{{ merge (dict "a" 1) (dict "b" 2) | toJson }}', description: 'Combine objects' },
    ],
  },
]

function renderSprigFunctionPreview(templateInput: string) {
  if (!templateInput.trim()) {
    return 'Preview unavailable - Enter a template'
  }

  try {
    if (templateInput.includes('now')) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')

      if (templateInput.includes('now.Unix')) {
        return String(Math.floor(now.getTime() / 1000))
      }
      if (templateInput.includes('now.UnixMilli')) {
        return String(now.getTime())
      }
      if (templateInput.includes('now.Year')) {
        return String(year)
      }
      if (templateInput.includes('now.Month')) {
        return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()]
      }
      if (templateInput.includes('now.Day')) {
        return String(now.getDate())
      }
      if (templateInput.includes('now.Weekday')) {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]
      }
      if (templateInput.includes('date "2006-01-02"')) {
        return `${year}-${month}-${day}`
      }
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    if (templateInput.includes('b64enc')) {
      const match = templateInput.match(/b64enc\s*"([^"]*)"/)
      if (match) {
        return btoa(match[1])
      }
      return 'Invalid b64enc format'
    }

    if (templateInput.includes('b64dec')) {
      const match = templateInput.match(/b64dec\s*"([^"]*)"/)
      if (match) {
        try {
          return atob(match[1])
        } catch {
          return 'Invalid base64 string'
        }
      }
      return 'Invalid b64dec format'
    }

    if (templateInput.includes('upper')) {
      const match = templateInput.match(/upper\s*"([^"]*)"|upper\s+(\w+)/i)
      if (match && (match[1] || match[2])) {
        return (match[1] || match[2]).toUpperCase()
      }
      return 'EXAMPLE_TEXT'
    }

    if (templateInput.includes('lower')) {
      const match = templateInput.match(/lower\s*"([^"]*)"|lower\s+(\w+)/i)
      if (match && (match[1] || match[2])) {
        return (match[1] || match[2]).toLowerCase()
      }
      return 'example_text'
    }

    if (templateInput.includes('len')) {
      if (templateInput.includes('$.items')) {
        return '5'
      }
      const strMatch = templateInput.match(/len\s*"([^"]*)"/i)
      if (strMatch) {
        return String(strMatch[1].length)
      }
      return '0'
    }

    if (templateInput.includes('contains')) {
      if (templateInput.includes('Malware')) {
        return 'true'
      }
      return 'false'
    }

    if (templateInput.includes('join')) {
      const match = templateInput.match(/join\s*"([^"]*)"/i)
      if (match) {
        return ['a', 'b', 'c'].join(match[1])
      }
      return 'a, b, c'
    }

    if (templateInput.includes('add ')) {
      const match = templateInput.match(/add\s+(\d+)\s+(\d+)/i)
      if (match) {
        return String(Number(match[1]) + Number(match[2]))
      }
      return '8'
    }

    if (templateInput.includes('sub ')) {
      const match = templateInput.match(/sub\s+(\d+)\s+(\d+)/i)
      if (match) {
        return String(Number(match[1]) - Number(match[2]))
      }
      return '6'
    }

    return 'Preview unavailable - Limited preview available for custom templates'
  } catch (error) {
    return 'Error evaluating preview'
  }
}

function renderJqPreview(expression: string) {
  const value = expression.trim()
  if (!value) {
    return 'Preview unavailable - Enter a jq expression'
  }

  if (value.includes('group_by(.userPrincipalName)')) {
    return '[{"userPrincipalName":"alice@acme.io","lastSignInDateEpoch":1701240000}]'
  }

  if (value.includes('group_by(.email)')) {
    return '[{"email":"analyst@acme.io","sourceA":true,"sourceB":true}]'
  }

  if (value.startsWith('reduce .[] as $i')) {
    return '{"criticalAlert":{"description":"criticalAlert","count":4}}'
  }

  if (value.includes('scan("(.+?)([.][0-9]+)?Z$")')) {
    return '{"event":{"id":"evt-1"},"time":1712223630.125,"index":"main","source":"torq"}'
  }

  if (value.includes('del (.field3)')) {
    return '[{"field1":"a","field2":"b"}]'
  }

  if (value.includes('add | unique')) {
    return '["alice","bob","carol"]'
  }

  return 'Preview is available for built-in examples. Insert an example above to evaluate output.'
}

const DEFAULT_PYTHON_SCRIPT = [
  'import json',
  '',
  'raw_text = "{{ jsonescape $.raw_data.output }}"',
  'payload = {"raw_data": raw_text}',
  'print(json.dumps(payload))',
].join('\n')
const DEFAULT_PYTHON_REQUIREMENTS = ''

const PYTHON_STEP_VARIANTS = [
  {
    id: 'inline',
    title: 'Run an inline Python Script',
    version: 'Python 3.13',
    packages: ['Standard Library', 'pyOpenSSL', 'crcmod', 'requests'],
  },
  {
    id: 'data_processing',
    title: 'Run a Python Data Processing Script',
    version: 'Python 3.11',
    packages: ['Standard Library', 'pyOpenSSL', 'crcmod', 'requests', 'pandas', 'numpy', 'openpyxl'],
  },
  {
    id: 'database_tools',
    title: 'Run a Python Script with Database Tools',
    version: 'Python 3.11',
    packages: ['pandas', 'numpy', 'openpyxl', 'psycopg', 'PyMySQL', 'pymssql'],
  },
  {
    id: 'ioc_extraction',
    title: 'Run a Python IOC Extraction Script',
    version: 'Python 3.9',
    packages: ['ioc-finder', 'msticpy', 'pydantic', 'jinja2', 'ruamel.yaml', 'python-json-logger'],
  },
]

const PYTHON_SCRIPT_TEMPLATES = [
  {
    label: 'Pass previous step value',
    script: [
      'data = """{{ $.get_data.result }}"""',
      'print(f"Data from previous step: {data}")',
    ].join('\n'),
  },
  {
    label: 'Return stdout parameter',
    script: [
      'result = "Hello, Torq!"',
      'print(result)',
    ].join('\n'),
  },
  {
    label: 'Parse nested JSON safely',
    script: [
      'import json',
      '',
      'string_json_data = """{{ $.collect_ip_reputation.result }}"""',
      'json_data = json.loads(string_json_data)',
      'print(json.dumps(json_data), end="")',
    ].join('\n'),
  },
  {
    label: 'Trigger Torq webhook',
    script: [
      'import requests',
      'import json',
      '',
      'url = "{{ $.workflow_parameters.url_for_torq_webhook }}"',
      'data = {{ $.workflow_parameters.json_to_send }}',
      'headers = {',
      '    "{{ $.workflow_parameters.torq_auth_header_name }}": "{{ $.workflow_parameters.torq_auth_header_secret }}"',
      '}',
      'response = requests.post(url, headers=headers, json=data)',
      'print(json.dumps({"Status Code": response.status_code}))',
    ].join('\n'),
  },
  {
    label: 'Graceful list output',
    script: [
      'limited_usernames = ["Alice", "Bob", "Charlie"]',
      'limited_usernames_str = ",".join(limited_usernames)',
      'print(limited_usernames_str, end="")',
    ].join('\n'),
  },
]

function jsonEscapeInlineValue(value: string) {
  return JSON.stringify(value).slice(1, -1)
}

function replaceTemplateExpressions(
  input: string,
  replacer: (expressionBody: string) => string,
) {
  let index = 0
  let output = ''

  while (index < input.length) {
    const start = input.indexOf('{{', index)
    if (start < 0) {
      output += input.slice(index)
      break
    }

    output += input.slice(index, start)

    let cursor = start + 2
    let depth = 1
    while (cursor < input.length && depth > 0) {
      const token = input.slice(cursor, cursor + 2)
      if (token === '{{') {
        depth += 1
        cursor += 2
        continue
      }
      if (token === '}}') {
        depth -= 1
        if (depth === 0) break
        cursor += 2
        continue
      }
      cursor += 1
    }

    if (depth !== 0) {
      output += input.slice(start)
      break
    }

    const expressionBody = input.slice(start + 2, cursor).trim()
    output += replacer(expressionBody)
    index = cursor + 2
  }

  return output
}

function buildAddToJsonPreview(input: string, rawData: string) {
  const withContextValues = replaceTemplateExpressions(input, (expressionBody) => {
    if (/^jsonescape\s+/i.test(expressionBody)) {
      const argument = expressionBody.replace(/^jsonescape\s+/i, '').trim()
      if (argument.includes('$.raw_data.output')) {
        return jsonEscapeInlineValue(rawData)
      }
      return jsonEscapeInlineValue('context_value')
    }

    return '"context_value"'
  })

  try {
    const parsed = JSON.parse(withContextValues)
    return {
      isValid: true,
      preview: JSON.stringify(parsed, null, 2),
      error: '',
    }
  } catch (error) {
    return {
      isValid: false,
      preview: withContextValues,
      error: error instanceof Error ? error.message : 'Invalid JSON input',
    }
  }
}

function parseCurlyEscapePassThrough(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^\{\{`([\s\S]*)`\}\}$/)
  if (!match) {
    return {
      isValid: false,
      output: '',
      error: 'Expected format: {{`...`}}',
    }
  }

  return {
    isValid: true,
    output: match[1],
    error: '',
  }
}

const FRACTIONAL_SECOND_OPTIONS = [
  { id: '1', label: 'Decisecond', digits: 1, token: '%1f' },
  { id: '2', label: 'Centisecond', digits: 2, token: '%2f' },
  { id: '3', label: 'Millisecond', digits: 3, token: '%3f' },
  { id: '6', label: 'Microsecond', digits: 6, token: '%6f' },
  { id: '9', label: 'Nanosecond', digits: 9, token: '%f' },
]

function formatDateWithPrecision(date: Date, precisionDigits: number) {
  const milliseconds = date.getMilliseconds()
  const nanos = String(milliseconds * 1_000_000).padStart(9, '0')
  return nanos.slice(0, precisionDigits)
}

function buildDateTimeFormatWithPrecision(baseFormat: string, precisionDigits: number) {
  const token = precisionDigits === 9 ? '%f' : `%${precisionDigits}f`
  return baseFormat.replace(/%\d?f|%f/g, token)
}

function renderDateTimePreview(format: string, precisionDigits: number) {
  const date = new Date()

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  const fraction = formatDateWithPrecision(date, precisionDigits)

  return format
    .replace('%Y', year)
    .replace('%m', month)
    .replace('%d', day)
    .replace('%H', hour)
    .replace('%M', minute)
    .replace('%S', second)
    .replace(/%\d?f|%f/g, fraction)
}

function applyUrlQueryEncoding(value: string) {
  return encodeURIComponent(value).replace(/%20/g, '+')
}

function renderAdvancedTemplatePreview(template: string, urlSource: string) {
  const t = template.trim()

  if (t === '{{ len $.hosts }}') {
    return String(SAMPLE_HOSTS_CONTEXT.hosts.length)
  }

  if (t === '{{ (index (index $.hosts 0).interfaces 0).name }}') {
    return SAMPLE_HOSTS_CONTEXT.hosts[0].interfaces[0].name
  }

  if (t === '{{ $.hosts[0].interfaces[0].name }}') {
    return SAMPLE_HOSTS_CONTEXT.hosts[0].interfaces[0].name
  }

  if (t === '{{ $.hosts[1].interfaces[:2][1].name }}') {
    return SAMPLE_HOSTS_CONTEXT.hosts[1].interfaces.slice(0, 2)[1].name
  }

  if (t === '{{ $.hosts[1].interfaces[?(@.weight > 10)][0].name }}') {
    return SAMPLE_HOSTS_CONTEXT.hosts[1].interfaces.filter((item) => item.weight > 10)[0].name
  }

  if (t === '{{ $.hosts[1].interfaces[?(@.name=~ /(Interface [23])/)] }}') {
    return JSON.stringify(
      SAMPLE_HOSTS_CONTEXT.hosts[1].interfaces.filter((item) => /(Interface [23])/.test(item.name)),
      null,
      2,
    )
  }

  if (t === '{{ if (gt (len $.hosts) 1) -}} Multiple hosts found {{- else -}} Single host found {{- end}}') {
    return SAMPLE_HOSTS_CONTEXT.hosts.length > 1 ? 'Multiple hosts found' : 'Single host found'
  }

  if (t === 'We currently have {{ len $.hosts }} hosts and their names are: {{ range $index, $host:= $.hosts }} {{ $host.name }} {{ end }}') {
    return `We currently have ${SAMPLE_HOSTS_CONTEXT.hosts.length} hosts and their names are: ${SAMPLE_HOSTS_CONTEXT.hosts
      .map((host) => host.name)
      .join(' ')}`
  }

  if (t === '{{ urlquery $.unescaped_url.result }}') {
    return applyUrlQueryEncoding(urlSource)
  }

  return 'Preview is available for built-in examples. Insert an example above to evaluate output.'
}

function PropertiesPanel({ node, onEditStep }: { node: any, onEditStep: () => void }) {
  const stepDescriptor = `${String(node.data?.label || '')} ${String(node.data?.subtext || '')}`
  const isTrigger = node.type === 'trigger'
  const isMessageLikeStep = /message|slack|ticket|log/i.test(String(node.data?.label || ''))
  const isEmailStep = /gmail|email/i.test(String(node.data?.subtext || '')) || /email|gmail/i.test(String(node.data?.label || ''))
  const isDateTimeStep = /date|time|datetime|timestamp/i.test(String(node.data?.label || ''))
  const isAdvancedTemplateStep = /template|golang|urlquery|print/i.test(String(node.data?.label || ''))
  const isJqStep = /run\s*jq|jq command|\bjq\b/i.test(stepDescriptor)
  const isCurlyEscapeStep = /escape\s*\{\}/i.test(String(node.data?.label || ''))
  const isRawDataStep = /raw data/i.test(String(node.data?.label || ''))
  const isAddToJsonStep = /add to json/i.test(String(node.data?.label || ''))
  const isEscapeJsonStep = /escape json|string utils|escaped string/i.test(String(node.data?.label || ''))
  const isPythonStep = /python/i.test(String(node.data?.label || ''))
  const isSprigFunctionStep = /sprig|function|dynamic data|manipulation/i.test(String(node.data?.label || ''))
  const { nodes, edges, setNodes, setEdges, selectNode, persistCurrentWorkflowGraph } = useWorkflowStore()
  const [isHttpMode, setIsHttpMode] = useState(false)
  const [showHttpConfirm, setShowHttpConfirm] = useState(false)
  const [recipient, setRecipient] = useState(String(node.data?.recipient || ''))
  const [messageText, setMessageText] = useState(String(node.data?.messageText || ''))
  const [contentType, setContentType] = useState(String(node.data?.contentType || 'text/plain'))
  const [rawDataInput, setRawDataInput] = useState(String(node.data?.rawDataInput || DEFAULT_RAW_DATA_INPUT))
  const [addJsonInput, setAddJsonInput] = useState(String(node.data?.addJsonInput || DEFAULT_ADD_TO_JSON_INPUT))
  const [curlyEscapeInput, setCurlyEscapeInput] = useState(String(node.data?.curlyEscapeInput || DEFAULT_CURLY_ESCAPE_STATIC))
  const [escapeJsonInput, setEscapeJsonInput] = useState(String(node.data?.escapeJsonInput || DEFAULT_ESCAPE_JSON_INPUT))
  const [pythonInput, setPythonInput] = useState(String(node.data?.pythonInput || DEFAULT_PYTHON_INPUT))
  const [pythonScript, setPythonScript] = useState(String(node.data?.pythonScript || DEFAULT_PYTHON_SCRIPT))
  const [pythonStepVariant, setPythonStepVariant] = useState(String(node.data?.pythonStepVariant || 'inline'))
  const [pythonRequirements, setPythonRequirements] = useState(String(node.data?.pythonRequirements || DEFAULT_PYTHON_REQUIREMENTS))
  const [dateTimeBaseFormat, setDateTimeBaseFormat] = useState(String(node.data?.dateTimeBaseFormat || DEFAULT_DATETIME_BASE_FORMAT))
  const [fractionalDigits, setFractionalDigits] = useState<number>(Number(node.data?.fractionalDigits || 9))
  const [advancedTemplateInput, setAdvancedTemplateInput] = useState(String(node.data?.advancedTemplateInput || DEFAULT_ADVANCED_TEMPLATE))
  const [urlQuerySource, setUrlQuerySource] = useState(String(node.data?.urlQuerySource || DEFAULT_URLQUERY_SOURCE))
  const [jqExpressionInput, setJqExpressionInput] = useState(String(node.data?.jqExpressionInput || DEFAULT_JQ_EXPRESSION))
  const [sprigFunctionInput, setSprigFunctionInput] = useState(String(node.data?.sprigFunctionInput || '{{ add 5 3 }}'))
  const [expandedCategory, setExpandedCategory] = useState<string | null>('String Manipulation')
  const [activeField, setActiveField] = useState<'recipient' | 'message' | 'addjson' | null>(null)
  const [pickerOpenFor, setPickerOpenFor] = useState<'recipient' | 'message' | 'addjson' | null>(null)
  const [autocomplete, setAutocomplete] = useState<{
    field: 'recipient' | 'message' | 'addjson'
    start: number
    end: number
    query: string
    isInsideTemplate: boolean
  } | null>(null)
  const recipientRef = useRef<HTMLInputElement | null>(null)
  const messageRef = useRef<HTMLTextAreaElement | null>(null)
  const addJsonRef = useRef<HTMLTextAreaElement | null>(null)

  const wrapMessageWithPreTag = () => {
    const trimmed = messageText.trim()
    const hasPreTag = /^<pre>[\s\S]*<\/pre>$/i.test(trimmed)
    const wrapped = hasPreTag ? messageText : `<pre>\n${messageText}\n</pre>`
    setMessageText(wrapped)
    setContentType('text/html, charset=UTF-8')
    persistNodeData({
      messageText: wrapped,
      contentType: 'text/html, charset=UTF-8',
    })
  }

  const contextQuery = (autocomplete?.query || '').toLowerCase()
  const filteredContextPaths = WORKFLOW_CONTEXT_PATHS.filter((item) =>
    item.path.toLowerCase().includes(contextQuery),
  )
  const selectedPythonVariant =
    PYTHON_STEP_VARIANTS.find((item) => item.id === pythonStepVariant) || PYTHON_STEP_VARIANTS[0]

  const persistNodeData = (partial: Record<string, unknown>) => {
    const nextNodes = nodes.map((item) =>
      item.id === node.id
        ? {
            ...item,
            data: {
              ...(item.data || {}),
              ...partial,
            },
          }
        : item,
    )
    setNodes(nextNodes)
    persistCurrentWorkflowGraph(nextNodes as any, edges)
    const updated = nextNodes.find((item) => item.id === node.id)
    if (updated) {
      selectNode(updated as any)
    }
  }

  const updateAutocomplete = (
    field: 'recipient' | 'message' | 'addjson',
    value: string,
    caretPosition: number,
  ) => {
    const context = findContextTokenContext(value, caretPosition)
    if (!context) {
      setAutocomplete(null)
      return
    }
    setAutocomplete({ field, ...context })
  }

  const applyContextPath = (path: string, targetField?: 'recipient' | 'message' | 'addjson') => {
    const field = targetField || autocomplete?.field || activeField
    if (!field) return

    const sourceValue =
      field === 'recipient' ? recipient : field === 'message' ? messageText : addJsonInput
    const inputRef =
      field === 'recipient'
        ? recipientRef.current
        : field === 'message'
        ? messageRef.current
        : addJsonRef.current
    const fallbackCursor = inputRef?.selectionStart ?? sourceValue.length
    const context = autocomplete?.field === field ? autocomplete : findContextTokenContext(sourceValue, fallbackCursor)

    const replacement = context?.isInsideTemplate ? path : buildContextToken(path)
    const start = context ? context.start : fallbackCursor
    const end = context ? context.end : fallbackCursor
    const nextValue = sourceValue.slice(0, start) + replacement + sourceValue.slice(end)

    if (field === 'recipient') {
      setRecipient(nextValue)
      persistNodeData({ recipient: nextValue })
      setTimeout(() => {
        recipientRef.current?.focus()
        const nextCursor = start + replacement.length
        recipientRef.current?.setSelectionRange(nextCursor, nextCursor)
      }, 0)
    } else {
      if (field === 'message') {
        setMessageText(nextValue)
        persistNodeData({ messageText: nextValue })
        setTimeout(() => {
          messageRef.current?.focus()
          const nextCursor = start + replacement.length
          messageRef.current?.setSelectionRange(nextCursor, nextCursor)
        }, 0)
      } else {
        setAddJsonInput(nextValue)
        persistNodeData({ addJsonInput: nextValue })
        setTimeout(() => {
          addJsonRef.current?.focus()
          const nextCursor = start + replacement.length
          addJsonRef.current?.setSelectionRange(nextCursor, nextCursor)
        }, 0)
      }
    }

    setAutocomplete(null)
    setPickerOpenFor(null)
  }

  const insertLiteralTemplate = (
    template: string,
    field: 'recipient' | 'message' | 'addjson',
  ) => {
    const sourceValue =
      field === 'recipient' ? recipient : field === 'message' ? messageText : addJsonInput
    const inputRef =
      field === 'recipient'
        ? recipientRef.current
        : field === 'message'
        ? messageRef.current
        : addJsonRef.current
    const start = inputRef?.selectionStart ?? sourceValue.length
    const end = inputRef?.selectionEnd ?? start
    const nextValue = sourceValue.slice(0, start) + template + sourceValue.slice(end)

    if (field === 'recipient') {
      setRecipient(nextValue)
      persistNodeData({ recipient: nextValue })
      setTimeout(() => {
        recipientRef.current?.focus()
        const nextCursor = start + template.length
        recipientRef.current?.setSelectionRange(nextCursor, nextCursor)
      }, 0)
    } else if (field === 'message') {
      setMessageText(nextValue)
      persistNodeData({ messageText: nextValue })
      setTimeout(() => {
        messageRef.current?.focus()
        const nextCursor = start + template.length
        messageRef.current?.setSelectionRange(nextCursor, nextCursor)
      }, 0)
    } else {
      setAddJsonInput(nextValue)
      persistNodeData({ addJsonInput: nextValue })
      setTimeout(() => {
        addJsonRef.current?.focus()
        const nextCursor = start + template.length
        addJsonRef.current?.setSelectionRange(nextCursor, nextCursor)
      }, 0)
    }

    setAutocomplete(null)
    setPickerOpenFor(null)
  }
  
  useEffect(() => {
    setIsHttpMode(false)
    setShowHttpConfirm(false)
  }, [node])

  useEffect(() => {
    setRecipient(String(node.data?.recipient || ''))
    setMessageText(String(node.data?.messageText || ''))
    setContentType(String(node.data?.contentType || 'text/plain'))
    setRawDataInput(String(node.data?.rawDataInput || DEFAULT_RAW_DATA_INPUT))
    setAddJsonInput(String(node.data?.addJsonInput || DEFAULT_ADD_TO_JSON_INPUT))
    setCurlyEscapeInput(String(node.data?.curlyEscapeInput || DEFAULT_CURLY_ESCAPE_STATIC))
    setEscapeJsonInput(String(node.data?.escapeJsonInput || DEFAULT_ESCAPE_JSON_INPUT))
    setPythonInput(String(node.data?.pythonInput || DEFAULT_PYTHON_INPUT))
    setPythonScript(String(node.data?.pythonScript || DEFAULT_PYTHON_SCRIPT))
    setPythonStepVariant(String(node.data?.pythonStepVariant || 'inline'))
    setPythonRequirements(String(node.data?.pythonRequirements || DEFAULT_PYTHON_REQUIREMENTS))
    setDateTimeBaseFormat(String(node.data?.dateTimeBaseFormat || DEFAULT_DATETIME_BASE_FORMAT))
    setFractionalDigits(Number(node.data?.fractionalDigits || 9))
    setAdvancedTemplateInput(String(node.data?.advancedTemplateInput || DEFAULT_ADVANCED_TEMPLATE))
    setUrlQuerySource(String(node.data?.urlQuerySource || DEFAULT_URLQUERY_SOURCE))
    setJqExpressionInput(String(node.data?.jqExpressionInput || DEFAULT_JQ_EXPRESSION))
    setSprigFunctionInput(String(node.data?.sprigFunctionInput || '{{ add 5 3 }}'))
    setExpandedCategory('String Manipulation')
    setAutocomplete(null)
    setActiveField(null)
    setPickerOpenFor(null)
  }, [node.id])
  
  return (
    <div className="animate-fade-in workflow-editor-properties" style={{
      width: 420, background: '#1c1e23', borderLeft: '1px solid #2a2e35',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      zIndex: 10, overflowY: 'auto', position: 'relative'
    }}>
      {/* ── Header Tabs & Toolbar ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0', borderBottom: '1px solid #2a2e35' }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', paddingBottom: 12, borderBottom: '2px solid #fff', cursor: 'pointer' }}>Properties</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', paddingBottom: 12, cursor: 'pointer' }}>Execution Log</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', paddingBottom: 12, cursor: 'pointer' }}>Mock Output</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, color: '#9ca3af' }}>
          <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}><i className="fa-solid fa-arrow-right-to-bracket" style={{ transform: 'rotate(180deg)' }} /></button>
          <button 
            onClick={() => {
              const newNode = {
                ...node,
                id: `${node.type}-${Date.now()}`,
                position: { x: node.position.x + 40, y: node.position.y + 40 },
                selected: true,
              }
              const newNodes = nodes.map(n => ({ ...n, selected: false }))
              setNodes([...newNodes, newNode])
              selectNode(newNode)
            }}
            title="Duplicate Node"
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}>
            <Copy size={14} />
          </button>
          <button 
            onClick={() => {
              setNodes(nodes.filter(n => n.id !== node.id))
              setEdges(edges.filter(e => e.source !== node.id && e.target !== node.id))
              selectNode(null)
            }}
            title="Delete Node"
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}>
            <Trash2 size={14} />
          </button>
          <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}><MoreHorizontal size={14} /></button>
        </div>
      </div>

      {/* ── Node Info ─────────────────────────────────────────── */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #2a2e35' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {/* White Squircle */}
          <div style={{
            width: 48, height: 48, background: node.data?.iconBg || '#fff', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            {node.data?.iconUrl ? (
              <img src={node.data.iconUrl} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            ) : (
              <i className={isTrigger ? "fa-solid fa-bolt" : "fa-solid fa-code-branch"} style={{ fontSize: 20, color: node.data?.iconColor || '#000' }} />
            )}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
              {node.data?.label || 'Unknown Node'}
            </div>
            <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5, marginBottom: 12 }}>
              {isTrigger ? 'Trigger a workflow execution automatically.' : 'Returns information about the given IP address or handles routing decisions.'}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-rocket" /> Accelerated • {isHttpMode ? 'HTTP' : (node.data?.subtext || 'System')} • 3.0 • V1
            </div>
          </div>
        </div>
      </div>

      {/* ── Parameters Section ────────────────────────────────── */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Parameters</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#9ca3af', position: 'relative' }}>
            <RotateCcw size={14} style={{ cursor: 'pointer' }} />
            <ArrowRightLeft size={14} style={{ cursor: 'pointer', color: showHttpConfirm ? '#fff' : '#9ca3af' }} onClick={() => setShowHttpConfirm(!showHttpConfirm)} />
            
            <div style={{ position: 'relative', display: 'flex' }} title="Edit custom step">
              <Wand2 size={14} style={{ cursor: 'pointer', color: '#fff' }} onClick={onEditStep} />
            </div>

            <Settings size={14} style={{ cursor: 'pointer' }} />
            
            {showHttpConfirm && (
              <div style={{
                position: 'absolute', top: 24, right: 0, width: 300, background: '#252830',
                border: '1px solid #333842', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                padding: 16, zIndex: 20, animation: 'fade-in 0.15s'
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Switch to HTTP mode?</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5, marginBottom: 16 }}>
                  Configure as an HTTP request to use the API's full functionality. Current configurations will be applied. After you switch to HTTP mode, you cannot switch back to Basic mode.
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowHttpConfirm(false)} style={{ padding: '6px 16px', borderRadius: 6, background: '#1c1e23', border: '1px solid #333842', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => { setIsHttpMode(true); setShowHttpConfirm(false) }} style={{ padding: '6px 16px', borderRadius: 6, background: '#fff', border: 'none', color: '#000', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Convert</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isHttpMode ? (
          <div>
            {/* Endpoint */}
            <div style={{ background: '#17191e', border: '1px solid #333842', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '10px 12px', marginBottom: 16 }}>
              <span style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' }}>https://www.virustotal.com/api/v3/ip_addresses/{'{'}{'{'} $.event.ip_address {'}'}{'}'}</span>
            </div>

            {/* Method */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Method</div>
              <div style={{ position: 'relative' }}>
                <select style={{ width: '100%', appearance: 'none', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}>
                  <option>GET</option>
                </select>
                <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Auth */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Authorization</div>
              <div style={{ position: 'relative' }}>
                <select style={{ width: '100%', appearance: 'none', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}>
                  <option>None</option>
                </select>
                <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Headers */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Headers</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', fontSize: 12, cursor: 'pointer' }}>
                  <Plus size={12} /> Add
                </div>
              </div>
              
              <div style={{ background: '#1c1e23', border: '1px solid #333842', borderRadius: 6, display: 'flex', flexDirection: 'column', padding: 12, marginBottom: 12, position: 'relative' }}>
                <button style={{ position: 'absolute', right: -6, top: -6, background: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} color="#000" /></button>
                <div style={{ fontSize: 11, color: '#fff', marginBottom: 4 }}>Key</div>
                <div style={{ background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 12, marginBottom: 10 }}>Accept</div>
                <div style={{ fontSize: 11, color: '#fff', marginBottom: 4 }}>Value</div>
                <div style={{ background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 12 }}>application/json</div>
              </div>

              <div style={{ background: '#1c1e23', border: '1px solid #333842', borderRadius: 6, display: 'flex', flexDirection: 'column', padding: 12, position: 'relative' }}>
                <button style={{ position: 'absolute', right: -6, top: -6, background: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} color="#000" /></button>
                <div style={{ fontSize: 11, color: '#fff', marginBottom: 4 }}>Key</div>
                <div style={{ background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 12, marginBottom: 10 }}>x-apikey</div>
                <div style={{ fontSize: 11, color: '#fff', marginBottom: 4 }}>Value</div>
                <div style={{ background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace' }}>{'{'}{'{'} $.integrations.{'{'}{'{'} $.workflow_parameters.virustotal_integration {'}'}{'}'}.virustotal_api_key {'}'}{'}'}</div>
              </div>
            </div>

            {/* Body */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Body</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Optional</div>
              </div>
              <textarea
                value={'{\n  "users": "all"\n}'}
                readOnly
                style={{ width: '100%', height: 100, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '12px', color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace', resize: 'none' }}
              />
            </div>

            {/* Timeout */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Timeout</div>
              <div style={{ background: '#17191e', border: '1px solid #333842', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '10px 12px' }}>
                <span style={{ color: '#e2e8f0', fontSize: 13 }}>30</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {isMessageLikeStep ? (
              <>
                <div style={{ marginBottom: 16, position: 'relative' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Recipient</span>
                    <button
                      onClick={() => setPickerOpenFor((prev) => (prev === 'recipient' ? null : 'recipient'))}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    >
                      <Plus size={12} /> Context
                    </button>
                  </div>
                  <input
                    ref={recipientRef}
                    value={recipient}
                    onFocus={() => setActiveField('recipient')}
                    onBlur={() => setTimeout(() => setActiveField((prev) => (prev === 'recipient' ? null : prev)), 120)}
                    onChange={(event) => {
                      const value = event.target.value
                      const caret = event.target.selectionStart ?? value.length
                      setRecipient(value)
                      persistNodeData({ recipient: value })
                      updateAutocomplete('recipient', value, caret)
                    }}
                    onKeyUp={(event) => {
                      const target = event.currentTarget
                      updateAutocomplete('recipient', target.value, target.selectionStart ?? target.value.length)
                    }}
                    placeholder="user1@example.com"
                    style={{ width: '100%', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
                  />

                  {autocomplete && autocomplete.field === 'recipient' && activeField === 'recipient' && filteredContextPaths.length > 0 && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 72, background: '#252830', border: '1px solid #333842', borderRadius: 8, zIndex: 30, boxShadow: '0 16px 40px rgba(0,0,0,0.45)', maxHeight: 230, overflowY: 'auto' }}>
                      {filteredContextPaths.map((item) => (
                        <button
                          key={item.path}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyContextPath(item.path)}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer', fontSize: 13 }}
                        >
                          <i className="fa-regular fa-tag" style={{ marginRight: 8, color: '#9ca3af' }} />
                          {item.path}
                          <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 11 }}>{item.group}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {pickerOpenFor === 'recipient' && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 72, background: '#252830', border: '1px solid #333842', borderRadius: 8, zIndex: 35, boxShadow: '0 16px 40px rgba(0,0,0,0.45)', maxHeight: 260, overflowY: 'auto' }}>
                      {WORKFLOW_CONTEXT_PATHS.map((item) => (
                        <button
                          key={item.path}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyContextPath(item.path, 'recipient')}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer', fontSize: 12 }}
                        >
                          <div style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{item.path}</div>
                          <div style={{ color: '#94a3b8', fontSize: 11 }}>{item.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 24, position: 'relative' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Message text</span>
                    <button
                      onClick={() => setPickerOpenFor((prev) => (prev === 'message' ? null : 'message'))}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    >
                      <Plus size={12} /> Context
                    </button>
                  </div>
                  <textarea
                    ref={messageRef}
                    value={messageText}
                    onFocus={() => setActiveField('message')}
                    onBlur={() => setTimeout(() => setActiveField((prev) => (prev === 'message' ? null : prev)), 120)}
                    onChange={(event) => {
                      const value = event.target.value
                      const caret = event.target.selectionStart ?? value.length
                      setMessageText(value)
                      persistNodeData({ messageText: value })
                      updateAutocomplete('message', value, caret)
                    }}
                    onKeyUp={(event) => {
                      const target = event.currentTarget
                      updateAutocomplete('message', target.value, target.selectionStart ?? target.value.length)
                    }}
                    placeholder="Type message. Use {{ $.metadata. }} for execution context"
                    style={{ width: '100%', minHeight: 150, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                  />

                  {autocomplete && autocomplete.field === 'message' && activeField === 'message' && filteredContextPaths.length > 0 && (
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: -150, background: '#252830', border: '1px solid #333842', borderRadius: 8, zIndex: 30, boxShadow: '0 16px 40px rgba(0,0,0,0.45)', maxHeight: 190, overflowY: 'auto' }}>
                      {filteredContextPaths.map((item) => (
                        <button
                          key={item.path}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyContextPath(item.path)}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer', fontSize: 13 }}
                        >
                          <i className="fa-regular fa-tag" style={{ marginRight: 8, color: '#9ca3af' }} />
                          {item.path}
                          <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 11 }}>{item.group}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {pickerOpenFor === 'message' && (
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: -180, background: '#252830', border: '1px solid #333842', borderRadius: 8, zIndex: 35, boxShadow: '0 16px 40px rgba(0,0,0,0.45)', maxHeight: 220, overflowY: 'auto' }}>
                      {WORKFLOW_CONTEXT_PATHS.map((item) => (
                        <button
                          key={item.path}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyContextPath(item.path, 'message')}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer', fontSize: 12 }}
                        >
                          <div style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{item.path}</div>
                          <div style={{ color: '#94a3b8', fontSize: 11 }}>{item.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                  Use workflow context in inputs: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'{{ $.event.user.firstName }}'}</span> or <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'{{ $.metadata.execution_id }}'}</span>
                </div>

                {isEmailStep && (
                  <>
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>ASCII table email formatting</div>
                      <button
                        onClick={wrapMessageWithPreTag}
                        style={{ background: '#17191e', border: '1px solid #333842', color: '#e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}
                      >
                        Apply pre + HTML content type
                      </button>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Content type</div>
                      <input
                        value={contentType}
                        onChange={(event) => {
                          const value = event.target.value
                          setContentType(value)
                          persistNodeData({ contentType: value })
                        }}
                        placeholder="text/html, charset=UTF-8"
                        style={{ width: '100%', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Rendered preview</div>
                      <div style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 6, padding: '10px 12px', color: '#111827', fontSize: 12, fontFamily: contentType.toLowerCase().includes('text/html') ? 'monospace' : 'inherit', whiteSpace: 'pre-wrap' }}>
                        {messageText
                          .replace(/^<pre>\n?/i, '')
                          .replace(/\n?<\/pre>$/i, '')}
                      </div>
                    </div>

                    <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                      Wrap ASCII output with <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'<pre>'}</span> and <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'</pre>'}</span>, and set content type to <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>text/html, charset=UTF-8</span> to preserve table alignment in emails.
                    </div>
                  </>
                )}

                <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => insertLiteralTemplate(DEFAULT_NESTED_CONTEXT_STEP, 'message')}
                    style={{ background: '#17191e', border: '1px solid #333842', color: '#cbd5e1', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}
                  >
                    Insert nested step key
                  </button>
                  <button
                    onClick={() => insertLiteralTemplate(DEFAULT_NESTED_CONTEXT_INTEGRATION, 'message')}
                    style={{ background: '#17191e', border: '1px solid #333842', color: '#cbd5e1', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}
                  >
                    Insert dynamic integration key
                  </button>
                </div>
              </>
            ) : isDateTimeStep ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>DateTime format</div>
                  <input
                    value={dateTimeBaseFormat}
                    onChange={(event) => {
                      const value = event.target.value
                      setDateTimeBaseFormat(value)
                      persistNodeData({ dateTimeBaseFormat: value })
                    }}
                    placeholder="%Y-%m-%dT%H:%M:%S:%f"
                    style={{ width: '100%', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Fractional seconds precision</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {FRACTIONAL_SECOND_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setFractionalDigits(option.digits)
                          persistNodeData({ fractionalDigits: option.digits })
                        }}
                        style={{
                          background: fractionalDigits === option.digits ? '#334155' : '#17191e',
                          border: '1px solid #333842',
                          color: '#e2e8f0',
                          borderRadius: 6,
                          padding: '8px 10px',
                          fontSize: 12,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{option.label}</div>
                        <div style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{option.token}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const computedFormat = buildDateTimeFormatWithPrecision(dateTimeBaseFormat, fractionalDigits)
                  const preview = renderDateTimePreview(computedFormat, fractionalDigits)
                  return (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Computed format</div>
                        <div style={{ width: '100%', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace' }}>
                          {computedFormat}
                        </div>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Preview output</div>
                        <div style={{ width: '100%', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#86efac', fontSize: 12, fontFamily: 'monospace' }}>
                          {preview}
                        </div>
                      </div>
                    </>
                  )
                })()}

                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                  By default <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>%f</span> returns nanoseconds (9 digits). Use <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>%1f</span>, <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>%2f</span>, <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>%3f</span>, or <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>%6f</span> to match external system requirements.
                </div>
              </>
            ) : isAdvancedTemplateStep ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Template input</div>
                  <textarea
                    value={advancedTemplateInput}
                    onChange={(event) => {
                      const value = event.target.value
                      setAdvancedTemplateInput(value)
                      persistNodeData({ advancedTemplateInput: value })
                    }}
                    style={{ width: '100%', minHeight: 120, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ADVANCED_TEMPLATE_EXAMPLES.map((example) => (
                    <button
                      key={example.label}
                      onClick={() => {
                        setAdvancedTemplateInput(example.template)
                        persistNodeData({ advancedTemplateInput: example.template })
                      }}
                      style={{ background: '#17191e', border: '1px solid #333842', color: '#cbd5e1', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>urlquery source (troubleshooting)</div>
                  <input
                    value={urlQuerySource}
                    onChange={(event) => {
                      const value = event.target.value
                      setUrlQuerySource(value)
                      persistNodeData({ urlQuerySource: value })
                    }}
                    style={{ width: '100%', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none', fontFamily: 'monospace' }}
                  />
                  <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 11 }}>
                    Encoded: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{applyUrlQueryEncoding(urlQuerySource)}</span>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Preview output</div>
                  <div style={{ width: '100%', minHeight: 96, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#86efac', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {renderAdvancedTemplatePreview(advancedTemplateInput, urlQuerySource)}
                  </div>
                </div>

                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                  Includes advanced JSONPath and Golang template helpers for <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>len</span>, <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>index</span>, slicing/filtering, <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>range</span>, <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>if/else</span>, and <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>urlquery</span>.
                </div>
              </>
            ) : isJqStep ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>jq expression</div>
                  <textarea
                    value={jqExpressionInput}
                    onChange={(event) => {
                      const value = event.target.value
                      setJqExpressionInput(value)
                      persistNodeData({ jqExpressionInput: value })
                    }}
                    placeholder="reduce .[] as $i ({}; .[$i.description] = $i)"
                    style={{ width: '100%', minHeight: 120, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Common jq expressions</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {JQ_EXPRESSION_LIBRARY.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          setJqExpressionInput(item.expression)
                          persistNodeData({ jqExpressionInput: item.expression })
                        }}
                        style={{ background: '#17191e', border: '1px solid #333842', color: '#e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 11, cursor: 'pointer', textAlign: 'left' }}
                        title={item.description}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
                        <div style={{ color: '#94a3b8' }}>{item.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Preview output</div>
                  <div style={{ width: '100%', minHeight: 96, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#86efac', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {renderJqPreview(jqExpressionInput)}
                  </div>
                </div>

                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                  These snippets are designed for the <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>Run jq Command</span> step to filter, merge, reduce, and dedupe JSON without writing custom code.
                </div>
              </>
            ) : isSprigFunctionStep ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Sprig function template</div>
                  <textarea
                    value={sprigFunctionInput}
                    onChange={(event) => {
                      const value = event.target.value
                      setSprigFunctionInput(value)
                      persistNodeData({ sprigFunctionInput: value })
                    }}
                    placeholder='{{ add 5 3 }}'
                    style={{ width: '100%', minHeight: 100, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Available Sprig functions by category</div>
                  {SPRIG_FUNCTIONS_LIBRARY.map((category) => (
                    <div key={category.category} style={{ marginBottom: 12, border: '1px solid #333842', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === category.category ? null : category.category)}
                        style={{
                          width: '100%',
                          background: expandedCategory === category.category ? '#334155' : '#1f2937',
                          border: 'none',
                          color: '#e2e8f0',
                          padding: '10px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>{category.category} ({category.functions.length})</span>
                        <span style={{ fontSize: 10 }}>{expandedCategory === category.category ? '▼' : '▶'}</span>
                      </button>
                      {expandedCategory === category.category && (
                        <div style={{ background: '#17191e', padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {category.functions.map((func) => (
                            <button
                              key={func.name}
                              onClick={() => {
                                setSprigFunctionInput(func.template)
                                persistNodeData({ sprigFunctionInput: func.template })
                              }}
                              style={{
                                background: '#252830',
                                border: '1px solid #333842',
                                color: '#e2e8f0',
                                borderRadius: 4,
                                padding: '8px 10px',
                                fontSize: 11,
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                              }}
                              title={func.description}
                            >
                              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#60a5fa' }}>{func.name}</span>
                              <span style={{ color: '#9ca3af', fontSize: 10 }}>{func.description}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Preview</div>
                  <div style={{ width: '100%', minHeight: 80, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#86efac', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {renderSprigFunctionPreview(sprigFunctionInput)}
                  </div>
                </div>

                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                  <strong style={{ color: '#f87171', display: 'block', marginBottom: 8 }}>⚠ Template evaluation errors?</strong>
                  <div style={{ marginBottom: 8 }}>If inline Sprig functions fail due to unescaped input (e.g., <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>unexpected "," in operand</span>), move logic to utility steps:</div>
                  <div style={{ color: '#e2e8f0', fontSize: 10, lineHeight: 1.6 }}>
                    • <strong>Escape JSON String</strong> - Fix jsonEscape and JSON parsing errors<br />
                    • <strong>Replace in String</strong> - Safe string manipulation<br />
                    • <strong>Escape Curly Brackets</strong> - Handle nested templating<br />
                    • <strong>Advanced Golang Template</strong> - Complex JSONPath queries
                  </div>
                </div>
              </>
            ) : isCurlyEscapeStep ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Input</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => {
                          setCurlyEscapeInput(DEFAULT_CURLY_ESCAPE_STATIC)
                          persistNodeData({ curlyEscapeInput: DEFAULT_CURLY_ESCAPE_STATIC })
                        }}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 11 }}
                      >
                        Static example
                      </button>
                      <button
                        onClick={() => {
                          setCurlyEscapeInput(DEFAULT_CURLY_ESCAPE_EXPRESSION)
                          persistNodeData({ curlyEscapeInput: DEFAULT_CURLY_ESCAPE_EXPRESSION })
                        }}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 11 }}
                      >
                        Expression example
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={curlyEscapeInput}
                    onChange={(event) => {
                      const value = event.target.value
                      setCurlyEscapeInput(value)
                      persistNodeData({ curlyEscapeInput: value })
                    }}
                    style={{ width: '100%', minHeight: 160, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>

                {(() => {
                  const parsed = parseCurlyEscapePassThrough(curlyEscapeInput)
                  return (
                    <>
                      <div
                        style={{
                          marginBottom: 10,
                          padding: '10px 12px',
                          borderRadius: 6,
                          border: `1px solid ${parsed.isValid ? '#14532d' : '#7f1d1d'}`,
                          background: parsed.isValid ? 'rgba(20,83,45,0.25)' : 'rgba(127,29,29,0.25)',
                          color: parsed.isValid ? '#86efac' : '#fca5a5',
                          fontSize: 12,
                        }}
                      >
                        {parsed.isValid
                          ? 'Curly brackets will pass through as static text.'
                          : `Invalid escape format: ${parsed.error}`}
                      </div>
                      {parsed.isValid && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Output preview</div>
                          <div style={{ width: '100%', minHeight: 74, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {parsed.output}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                  Static format: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'{{`{{THIS WILL BE PRINTED INSIDE}}`}}'}</span><br />
                  Expression format: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'{{`{{{{$.sample_output.api_object.updated}}}}`}}'}</span>
                </div>
              </>
            ) : isRawDataStep ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>INPUT</div>
                  <textarea
                    value={rawDataInput}
                    onChange={(event) => {
                      const value = event.target.value
                      setRawDataInput(value)
                      persistNodeData({ rawDataInput: value })
                    }}
                    style={{ width: '100%', minHeight: 220, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace', whiteSpace: 'pre' }}
                  />
                </div>

                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                  Raw data can include quotes and whitespace. Use <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'{{ jsonescape $.raw_data.output }}'}</span> in downstream JSON steps.
                </div>
              </>
            ) : isAddToJsonStep ? (
              <>
                <div style={{ marginBottom: 16, position: 'relative' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>INPUT</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => insertLiteralTemplate(DEFAULT_NESTED_CONTEXT_STEP, 'addjson')}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                      >
                        Nested key
                      </button>
                      <button
                        onClick={() => insertLiteralTemplate(DEFAULT_NESTED_CONTEXT_INTEGRATION, 'addjson')}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                      >
                        Dynamic integration
                      </button>
                      <button
                        onClick={() => {
                          setAddJsonInput(DEFAULT_ADD_TO_JSON_INPUT)
                          persistNodeData({ addJsonInput: DEFAULT_ADD_TO_JSON_INPUT })
                        }}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                      >
                        <i className="fa-solid fa-wand-magic-sparkles" /> jsonescape
                      </button>
                      <button
                        onClick={() => setPickerOpenFor((prev) => (prev === 'addjson' ? null : 'addjson'))}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                      >
                        <Plus size={12} /> Context
                      </button>
                    </div>
                  </div>

                  <textarea
                    ref={addJsonRef}
                    value={addJsonInput}
                    onFocus={() => setActiveField('addjson')}
                    onBlur={() => setTimeout(() => setActiveField((prev) => (prev === 'addjson' ? null : prev)), 120)}
                    onChange={(event) => {
                      const value = event.target.value
                      const caret = event.target.selectionStart ?? value.length
                      setAddJsonInput(value)
                      persistNodeData({ addJsonInput: value })
                      updateAutocomplete('addjson', value, caret)
                    }}
                    onKeyUp={(event) => {
                      const target = event.currentTarget
                      updateAutocomplete('addjson', target.value, target.selectionStart ?? target.value.length)
                    }}
                    style={{ width: '100%', minHeight: 220, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                  />

                  {autocomplete && autocomplete.field === 'addjson' && activeField === 'addjson' && filteredContextPaths.length > 0 && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 72, background: '#252830', border: '1px solid #333842', borderRadius: 8, zIndex: 30, boxShadow: '0 16px 40px rgba(0,0,0,0.45)', maxHeight: 230, overflowY: 'auto' }}>
                      {filteredContextPaths.map((item) => (
                        <button
                          key={item.path}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyContextPath(item.path, 'addjson')}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer', fontSize: 13 }}
                        >
                          <i className="fa-regular fa-tag" style={{ marginRight: 8, color: '#9ca3af' }} />
                          {item.path}
                          <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 11 }}>{item.group}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {pickerOpenFor === 'addjson' && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 72, background: '#252830', border: '1px solid #333842', borderRadius: 8, zIndex: 35, boxShadow: '0 16px 40px rgba(0,0,0,0.45)', maxHeight: 260, overflowY: 'auto' }}>
                      {WORKFLOW_CONTEXT_PATHS.map((item) => (
                        <button
                          key={item.path}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyContextPath(item.path, 'addjson')}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer', fontSize: 12 }}
                        >
                          <div style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{item.path}</div>
                          <div style={{ color: '#94a3b8', fontSize: 11 }}>{item.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(() => {
                  const preview = buildAddToJsonPreview(addJsonInput, rawDataInput)
                  return (
                    <>
                      <div
                        style={{
                          marginBottom: 10,
                          padding: '10px 12px',
                          borderRadius: 6,
                          border: `1px solid ${preview.isValid ? '#14532d' : '#7f1d1d'}`,
                          background: preview.isValid ? 'rgba(20,83,45,0.25)' : 'rgba(127,29,29,0.25)',
                          color: preview.isValid ? '#86efac' : '#fca5a5',
                          fontSize: 12,
                        }}
                      >
                        {preview.isValid
                          ? 'JSON preview is valid. Escaped characters will be preserved safely.'
                          : `Invalid JSON input: ${preview.error}`}
                      </div>
                      <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                        Recommended format: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'{"data":"{{ jsonescape $.raw_data.output }}"}'}</span>
                      </div>
                    </>
                  )
                })()}
              </>
            ) : isEscapeJsonStep ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>String to escape</div>
                  <textarea
                    value={escapeJsonInput}
                    onChange={(event) => {
                      const value = event.target.value
                      setEscapeJsonInput(value)
                      persistNodeData({ escapeJsonInput: value })
                    }}
                    style={{ width: '100%', minHeight: 120, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Escaped output preview</div>
                  <div style={{ width: '100%', minHeight: 90, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {jsonEscapeInlineValue(escapeJsonInput)}
                  </div>
                </div>

                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                  Use this step output in downstream steps, or apply inline helper directly: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'{{ jsonescape $.raw_data.output }}'}</span>
                </div>
              </>
            ) : isPythonStep ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Python scripting step type</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {PYTHON_STEP_VARIANTS.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setPythonStepVariant(variant.id)
                          persistNodeData({ pythonStepVariant: variant.id })
                        }}
                        style={{
                          background: pythonStepVariant === variant.id ? '#334155' : '#17191e',
                          border: '1px solid #333842',
                          color: '#e2e8f0',
                          borderRadius: 6,
                          padding: '8px 10px',
                          fontSize: 11,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{variant.title}</div>
                        <div style={{ color: '#94a3b8', marginTop: 2 }}>{variant.version}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Pre-installed packages</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedPythonVariant.packages.map((pkg) => (
                      <span
                        key={pkg}
                        style={{
                          border: '1px solid #333842',
                          borderRadius: 999,
                          padding: '4px 8px',
                          color: '#cbd5e1',
                          fontSize: 11,
                          background: '#17191e',
                        }}
                      >
                        {pkg}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Optional REQUIREMENTS</div>
                  <textarea
                    value={pythonRequirements}
                    onChange={(event) => {
                      const value = event.target.value
                      setPythonRequirements(value)
                      persistNodeData({ pythonRequirements: value })
                    }}
                    placeholder={"pydantic==2.10.6\\npython-dateutil==2.9.0.post0"}
                    style={{ width: '100%', minHeight: 70, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ marginBottom: 16, position: 'relative' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Workflow JSON input</span>
                    <button
                      onClick={() => {
                        setPythonInput(DEFAULT_PYTHON_INPUT)
                        persistNodeData({ pythonInput: DEFAULT_PYTHON_INPUT })
                      }}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    >
                      <i className="fa-solid fa-wand-magic-sparkles" /> Insert jsonescape
                    </button>
                  </div>
                  <textarea
                    value={pythonInput}
                    onChange={(event) => {
                      const value = event.target.value
                      setPythonInput(value)
                      persistNodeData({ pythonInput: value })
                    }}
                    style={{ width: '100%', minHeight: 80, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Script patterns</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {PYTHON_SCRIPT_TEMPLATES.map((template) => (
                      <button
                        key={template.label}
                        onClick={() => {
                          setPythonScript(template.script)
                          persistNodeData({ pythonScript: template.script })
                        }}
                        style={{ background: '#17191e', border: '1px solid #333842', color: '#e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 11, cursor: 'pointer', textAlign: 'left' }}
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Python script</div>
                  <textarea
                    value={pythonScript}
                    onChange={(event) => {
                      const value = event.target.value
                      setPythonScript(value)
                      persistNodeData({ pythonScript: value })
                    }}
                    style={{ width: '100%', minHeight: 180, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.5 }}>
                  Use step outputs in scripts with <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'{{ $.step_name.output_field }}'}</span>. For multiline data, wrap with triple quotes. Use <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'print(...)'}</span> to expose values in <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>$.your_python_step.stdout</span> downstream.
                </div>

                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 6, border: '1px solid #333842', background: '#17191e', color: '#9ca3af', fontSize: 11, lineHeight: 1.6 }}>
                  <strong style={{ color: '#e2e8f0' }}>Workflow tips</strong><br />
                  • Replace JSON <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>null</span> with Python <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>None</span> by parsing with <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>json.loads()</span>.<br />
                  • Suppress trailing newline with <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'print(value, end="")'}</span> when needed.<br />
                  • For file output steps, downstream access supports <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{'{{ file $.step_name.api_object.url }}'}</span>.
                </div>
              </>
            ) : (
              <>
                {/* Input 1 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>IP address</div>
                  <div style={{ background: '#17191e', border: '1px solid #333842', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '10px 12px' }}>
                    <span style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' }}>{'{'}{'{'} $.event.ip_address {'}'}{'}'}</span>
                  </div>
                </div>

                {/* Input 2 */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Integration</div>
                  <div style={{ background: '#17191e', border: '1px solid #333842', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
                    <span style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' }}>{'{'}{'{'} $.workflow_parameters.virustotal_integration {'}'}{'}'}</span>
                    <X size={14} color="#9ca3af" style={{ cursor: 'pointer' }} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Execution Options */}
        <div style={{ borderTop: '1px solid #2a2e35', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Execution Options</div>
            <ChevronDown size={16} color="#9ca3af" />
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Step Builder Wizard Overlay ---
function StepBuilder({ node, onClose }: { node: any, onClose: () => void }) {
  const [stepPhase, setStepPhase] = useState(1) // 1: Details, 2: HTTP Request, 3: Output Example
  const [showToast, setShowToast] = useState(false)

  const handleSave = () => {
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      onClose()
    }, 2500)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#1c1e23', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      
      {/* Top Header */}
      <div style={{ height: 60, borderBottom: '1px solid #2a2e35', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 14, height: 2, background: '#4dc4d6', borderRadius: 2 }} />
            <div style={{ width: 14, height: 2, background: '#4dc4d6', borderRadius: 2 }} />
            <div style={{ width: 14, height: 2, background: '#4dc4d6', borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Step Builder</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 13, color: '#fb923c' }}>Status: <span style={{ color: '#fff' }}>Draft</span></div>
          <button style={{ background: 'transparent', border: '1px solid #333842', color: '#fff', padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>Test Run</button>
          <button onClick={handleSave} style={{ background: '#fff', border: 'none', color: '#000', padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', background: '#0e1015' }}>
        
        {/* Left Nav */}
        <div style={{ width: 260, borderRight: '1px solid #1c1e23', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          
          <button onClick={() => setStepPhase(1)} style={{ background: stepPhase === 1 ? '#252830' : 'transparent', border: 'none', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>(1)</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Step details</span>
            </div>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#10b98120', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={12} color="#10b981" />
            </div>
          </button>

          <button onClick={() => setStepPhase(2)} style={{ background: stepPhase === 2 ? '#252830' : 'transparent', border: 'none', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>(2)</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>HTTP request</span>
            </div>
            {stepPhase > 1 && (
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#10b98120', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={12} color="#10b981" />
            </div>
            )}
          </button>

          {/* Variables list */}
          <div style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['INQUIRY_TYPE', 'START_TIME', 'END_TIME', 'STATUS', 'ABNORMAL_A...'].map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#9ca3af', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {i === 0 || i === 3 ? <Check size={14} color="#e2e8f0" /> : <div style={{width: 14, textAlign: 'center'}}>=</div>}
                  <span style={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>{v}</span>
                </div>
                <MoreHorizontal size={14} />
              </div>
            ))}
          </div>

          <button onClick={() => setStepPhase(3)} style={{ background: stepPhase === 3 ? '#252830' : 'transparent', border: 'none', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>(3)</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Output example</span>
            </div>
            {stepPhase > 2 && (
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#10b98120', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={12} color="#10b981" />
            </div>
            )}
          </button>
        </div>

        {/* Center Panel */}
        <div style={{ flex: 1, background: '#16191f', borderRight: '1px solid #1c1e23', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          <div style={{ flex: 1, padding: 48, overflowY: 'auto' }}>
            {stepPhase === 1 && (
              <div className="animate-fade-in" style={{ maxWidth: 500 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 32 }}>Step details</div>
                
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Name</div>
                  <input value="List Detections" readOnly style={{ width: '100%', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none' }} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    <div>Description</div>
                    <div style={{ color: '#6b7280', fontWeight: 400, fontStyle: 'italic' }}>Optional</div>
                  </div>
                  <textarea readOnly value="Returns a list of Detection 360deg reports that you have submitted and view corresponding details for each case, including report summaries, statuses, message analyses, and more." style={{ width: '100%', height: 100, background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.5 }} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    <div>Documentation URL</div>
                    <div style={{ color: '#6b7280', fontWeight: 400, fontStyle: 'italic' }}>Optional</div>
                  </div>
                  <input readOnly value="https://app.swaggerhub.com/apis-docs/abnormal-security/..." style={{ width: '100%', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#9ca3af', fontSize: 13, outline: 'none' }} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Vendor</div>
                  <div style={{ position: 'relative' }}>
                    <select style={{ width: '100%', appearance: 'none', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}>
                      <option>abnormal_security</option>
                    </select>
                    <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    <div>Integration</div>
                    <div style={{ color: '#6b7280', fontWeight: 400, fontStyle: 'italic' }}>Optional</div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <select style={{ width: '100%', appearance: 'none', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}>
                      <option>Abnormal Security</option>
                    </select>
                    <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>
            )}

            {stepPhase === 2 && (
              <div className="animate-fade-in" style={{ maxWidth: 500 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 16 }}>HTTP Request</div>
                <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5, marginBottom: 32 }}>
                  Markers in the HTTP request configuration represent parameters. To add new ones, highlight the value and set it as a parameter...
                </div>
                
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>URL</div>
                  <div style={{ width: '100%', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#9ca3af', fontSize: 13, lineHeight: 1.6, wordBreak: 'break-all' }}>
                    https://api.abnormalplatform.com/v1/detection360/reports?inquiry_type=<span style={{background: '#0e7490', color: '#fff', padding: '0 4px', borderRadius: 2}}>INQUIRY_TYPE</span>&end=<span style={{background: '#0e7490', color: '#fff', padding: '0 4px', borderRadius: 2}}>END_TIME</span>&start=<span style={{background: '#0e7490', color: '#fff', padding: '0 4px', borderRadius: 2}}>START_TIME</span>&status=<span style={{background: '#0e7490', color: '#fff', padding: '0 4px', borderRadius: 2}}>STATUS</span>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Method</div>
                  <div style={{ position: 'relative' }}>
                    <select style={{ width: '100%', appearance: 'none', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}>
                      <option>GET</option>
                    </select>
                    <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Authorization</div>
                  <div style={{ position: 'relative' }}>
                    <select style={{ width: '100%', appearance: 'none', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}>
                      <option>Bearer</option>
                    </select>
                    <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Token</div>
                  <div style={{ width: '100%', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px' }}>
                    <span style={{background: '#0e7490', color: '#fff', padding: '2px 4px', borderRadius: 2, fontSize: 12}}>ABNORMAL_ACCESS_TOKEN</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #2a2e35', paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Headers</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0', fontSize: 12, cursor: 'pointer' }}>
                    <Plus size={14} /> Add
                  </div>
                </div>
              </div>
            )}

            {stepPhase === 3 && (
              <div className="animate-fade-in" style={{ maxWidth: 500 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 32 }}>Define output example <span style={{color: '#9ca3af', fontWeight: 400, fontSize: 16}}>(optional)</span></div>
                
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    <div>Description</div>
                    <div style={{ color: '#6b7280', fontWeight: 400, fontStyle: 'italic' }}>Optional</div>
                  </div>
                  <input placeholder="Enter description" style={{ width: '100%', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none' }} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    <div>Example</div>
                    <div style={{ color: '#6b7280', fontWeight: 400, fontStyle: 'italic' }}>Optional</div>
                  </div>
                  <textarea style={{ width: '100%', height: 200, background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, resize: 'none', outline: 'none' }} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Nav Bar center */}
          <div style={{ height: 60, borderTop: '1px solid #2a2e35', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#16191f' }}>
            <button onClick={() => setStepPhase(Math.max(1, stepPhase - 1))} style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', visibility: stepPhase > 1 ? 'visible' : 'hidden' }}>
              <ArrowLeft size={16} /> Back
            </button>
            
            <div style={{ height: 2, flex: 1, margin: '0 24px', background: '#333842', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: '#ff3366', width: `${((stepPhase) / 3) * 100}%`, transition: 'width .2s' }} />
            </div>

            {stepPhase < 3 ? (
              <button onClick={() => setStepPhase(stepPhase + 1)} style={{ background: '#e2e8f0', border: 'none', color: '#000', fontSize: 13, fontWeight: 600, padding: '8px 24px', borderRadius: 6, cursor: 'pointer' }}>Next</button>
            ) : (
              <button onClick={handleSave} style={{ background: '#e2e8f0', border: 'none', color: '#000', fontSize: 13, fontWeight: 600, padding: '8px 24px', borderRadius: 6, cursor: 'pointer' }}>Save</button>
            )}
          </div>
        </div>

        {/* Right Preview Panel */}
        <div style={{ width: 440, padding: 32 }}>
          <div style={{ background: '#1c1e23', borderRadius: 8, padding: 24, border: '1px solid #333842' }}>
            
            {/* Header Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #2a2e35', paddingBottom: 12, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', borderBottom: '2px solid #fff', paddingBottom: 11, marginBottom: -13 }}>Properties</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>Execution Log</div>
            </div>

            {/* Node representation preview */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
              <div style={{ width: 48, height: 48, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{fontWeight: 900, fontSize: 32, color: '#000', marginTop: -4}}>Λ</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>List Detections</div>
                <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.5, marginBottom: 8 }}>Returns a list of Detection 360deg reports that you have submitted and view corresponding details for each case...</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Abnormal Security • 2.0.0</div>
              </div>
            </div>

            {/* Parameters preview */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Parameters</div>
              <Settings size={14} color="#9ca3af" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 8 }}>Inquiry type</div>
              <div style={{ position: 'relative' }}>
                <select style={{ width: '100%', appearance: 'none', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}>
                  <option>MISSED_ATTACK</option>
                </select>
                <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 8 }}>Integration</div>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '100%', background: '#252830', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', height: 40 }} />
                <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: '#1c1e23', border: '1px solid #1db87a', borderRadius: 8, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', zIndex: 10000 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1db87a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={14} color="#000" strokeWidth={3} />
          </div>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Step was saved and added to your custom tab</span>
        </div>
      )}

    </div>
  )
}

