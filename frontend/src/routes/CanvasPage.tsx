import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DB, getIntegrationLogo } from '@/data/integrations'
import { ReactFlowProvider, useReactFlow, Panel } from '@xyflow/react'
import { Search, ChevronDown, X, Copy, Trash2, MoreHorizontal, RotateCcw, ArrowRightLeft, Wand2, Settings, Plus, Check, ArrowLeft, Save, RefreshCcw } from 'lucide-react'
import { useCasesStore } from '@/stores/casesStore'

export function CanvasPage() {
  const {
    setNodes,
    setEdges,
    addNode,
    selectedNode,
    currentWorkflowId,
    workflows,
    saveCurrentWorkflowDraft,
    publishCurrentWorkflow,
    exportWorkflowYaml,
    unpublishWorkflow,
  } = useWorkflowStore()
  const location = useLocation()
  const navigate = useNavigate()
  const addCase = useCasesStore(s => s.addCase)
  
  const [search, setSearch] = useState('')
  const [editingStep, setEditingStep] = useState<any | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [versionDescription, setVersionDescription] = useState('')
  const [tags, setTags] = useState('')
  const [timeBackMinutes, setTimeBackMinutes] = useState(20)

  const currentWorkflow = workflows.find((item) => item.id === currentWorkflowId)

  const statusLabel =
    currentWorkflow?.status === 'published_enabled'
      ? 'Published, trigger enabled'
      : currentWorkflow?.status === 'published_disabled'
      ? 'Published, trigger disabled'
      : currentWorkflow?.status === 'has_unpublished_changes'
      ? 'Has unpublished changes'
      : 'Not published'

  const saveDraft = () => {
    saveCurrentWorkflowDraft(currentWorkflow?.name || 'Untitled workflow')
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

  const confirmPublish = () => {
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
  
  const handleRunWorkflow = () => {
    saveDraft()
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

  const onDragStart = (e: React.DragEvent, action: any) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(action))
    e.dataTransfer.effectAllowed = 'move'
  }

  const visible = DB.filter(a =>
    a.n.toLowerCase().includes(search.toLowerCase()) ||
    a.cat.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: '#0e1015', overflow: 'hidden' }}>
      
      {/* ── Left Sidebar ───────────────────────────────────────── */}
      <div style={{
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
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ReactFlowProvider>
          <WorkflowCanvasWrapper addNode={addNode as any}>
            {/* Top Header Toggle & Breadcrumb */}
            <Panel position="top-left" style={{ margin: 0, width: '100%', pointerEvents: 'none', zIndex: 10 }}>
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
                  <div style={{ fontSize: 12, color: '#9ca3af', padding: '6px 10px', border: '1px solid #333842', borderRadius: 6, background: '#1c1e23' }}>
                    {statusLabel}
                  </div>
                  <button onClick={saveDraft} style={{ background: 'transparent', color: '#fff', border: '1px solid #4b5563', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <i className="fa-regular fa-floppy-disk" style={{ fontSize: 12, marginRight: 6 }} /> Save
                  </button>
                  <button onClick={() => setPublishOpen(true)} style={{ background: '#e5e7eb', color: '#000', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Publish
                  </button>
                  <button onClick={handleRunWorkflow} style={{ background: '#7b40f0', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(123, 64, 240, 0.3)' }}>
                    <i className="fa-solid fa-play" style={{ fontSize: 12 }} /> Save & Run Workflow
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setActionsOpen((prev) => !prev)} style={{ background: 'transparent', color: '#e2e8f0', border: '1px solid #4b5563', borderRadius: 6, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}>
                      <MoreHorizontal size={16} />
                    </button>
                    {actionsOpen && (
                      <div style={{ position: 'absolute', top: 42, right: 0, width: 220, background: '#252830', border: '1px solid #333842', borderRadius: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 30 }}>
                        <button onClick={() => handleExport(false)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer' }}>
                          <i className="fa-solid fa-arrow-up-from-bracket" style={{ marginRight: 8 }} /> Export workflow
                        </button>
                        <button onClick={() => handleExport(true)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', textAlign: 'left', padding: '10px 12px', cursor: 'pointer' }}>
                          <i className="fa-solid fa-arrow-up-from-bracket" style={{ marginRight: 8 }} /> Export published
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

            <Panel position="bottom-center" style={{ margin: 0, bottom: 24, zIndex: 10 }}>
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

      {publishOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    </div>
  )
}

function WorkflowCanvasWrapper({ addNode, children }: { addNode: (node: any) => void, children?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <DropZone addNode={addNode}>
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

function DropZone({ addNode, children }: { addNode: (node: any) => void, children?: React.ReactNode }) {
  const { screenToFlowPosition } = useReactFlow()

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

  return (
    <div style={{ width: '100%', height: '100%' }} onDragOver={onDragOver} onDrop={onDrop}>
      <WorkflowCanvas>
        {children}
      </WorkflowCanvas>
    </div>
  )
}

function PropertiesPanel({ node, onEditStep }: { node: any, onEditStep: () => void }) {
  const isTrigger = node.type === 'trigger'
  const { nodes, edges, setNodes, setEdges, selectNode } = useWorkflowStore()
  const [isHttpMode, setIsHttpMode] = useState(false)
  const [showHttpConfirm, setShowHttpConfirm] = useState(false)
  
  useEffect(() => {
    setIsHttpMode(false)
    setShowHttpConfirm(false)
  }, [node])
  
  return (
    <div className="animate-fade-in" style={{
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

