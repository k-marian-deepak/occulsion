import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, ChevronDown, X, Copy, Trash2, MoreHorizontal, RotateCcw, ArrowRightLeft, Wand2, Settings, Plus } from 'lucide-react'
import { ReactFlowProvider, useReactFlow } from '@xyflow/react'

const ACTIONS = [
  { int: 'CrowdStrike', action: 'Create Indicator',        icon: 'https://companieslogo.com/img/orig/CRWD-369b50b5.png?t=1720244491' },
  { int: 'CrowdStrike', action: 'Create RTR Session',      icon: 'https://companieslogo.com/img/orig/CRWD-369b50b5.png?t=1720244491' },
  { int: 'CrowdStrike', action: 'Create Session',          icon: 'https://companieslogo.com/img/orig/CRWD-369b50b5.png?t=1720244491' },
  { int: 'CrowdStrike', action: 'Delete Host',             icon: 'https://companieslogo.com/img/orig/CRWD-369b50b5.png?t=1720244491' },
  { int: 'CrowdStrike', action: 'Delete Indicator',        icon: 'https://companieslogo.com/img/orig/CRWD-369b50b5.png?t=1720244491' },
  { int: 'CrowdStrike', action: 'Download Intel Report',   icon: 'https://companieslogo.com/img/orig/CRWD-369b50b5.png?t=1720244491' },
  { int: 'Jira',        action: 'Create Ticket',           icon: 'https://companieslogo.com/img/orig/TEAM-b4b39a3f.png?t=1720244494' },
  { int: 'Slack',       action: 'Send Message',            icon: 'https://companieslogo.com/img/orig/WORK-2ac3a5e8.png?t=1720244494' },
  { int: 'VirusTotal',  action: 'Check IP',                icon: 'https://companieslogo.com/img/orig/VirusTotal-icon.png?t=1' },
]

export function CanvasPage() {
  const { setNodes, setEdges, addNode, selectedNode } = useWorkflowStore()
  const [search, setSearch] = useState('')

  // On mount, demo node matching Torq screenshot
  useEffect(() => {
    setNodes([{
      id: 'n-1',
      type: 'trigger',
      position: { x: 350, y: 120 },
      data: { label: 'On-demand' }
    }] as any)
    setEdges([])
  }, [])

  const onDragStart = (e: React.DragEvent, action: any) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(action))
    e.dataTransfer.effectAllowed = 'move'
  }

  const visible = ACTIONS.filter(a =>
    a.int.toLowerCase().includes(search.toLowerCase()) ||
    a.action.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: '#0e1015' }}>
      
      {/* ── Drag & Drop Sidebar ────────────────────────────────── */}
      <div style={{
        width: 320, background: '#1c1e23', borderRight: '1px solid #2a2e35',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        boxShadow: '4px 0 20px rgba(0,0,0,0.4)', zIndex: 10
      }}>
        
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
        <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid #2a2e35', marginBottom: 16 }}>
          {[
            { label: 'Public', count: 59, active: true },
            { label: 'Cases', count: 0 },
            { label: 'Utilities', count: 0 },
            { label: 'Custom', count: 0 },
          ].map(t => (
            <div key={t.label} style={{
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <img src={a.icon} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }}
                  onError={e => e.currentTarget.style.display = 'none'}
                />
              </div>

              {/* Text */}
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{a.int}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{a.action}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Canvas Area ──────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlowProvider>
          <WorkflowCanvasWrapper addNode={addNode as any} />
        </ReactFlowProvider>
      </div>

      {/* ── Properties Panel ─────────────────────────────────── */}
      {selectedNode && (
        <PropertiesPanel node={selectedNode} />
      )}
    </div>
  )
}

function WorkflowCanvasWrapper({ addNode }: { addNode: (node: any) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Need to extract the hook 
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <DropZone addNode={addNode} />
    </div>
  )
}

function DropZone({ addNode }: { addNode: (node: any) => void }) {
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
        label: action.action, 
        subtext: action.int,
        iconUrl: action.icon 
      },
    }

    addNode(newNode)
  }, [addNode, screenToFlowPosition])

  return (
    <div style={{ width: '100%', height: '100%' }} onDragOver={onDragOver} onDrop={onDrop}>
      <WorkflowCanvas />
    </div>
  )
}

function PropertiesPanel({ node }: { node: any }) {
  const isTrigger = node.type === 'trigger'
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
          <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}><Copy size={14} /></button>
          <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
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
            <Wand2 size={14} style={{ cursor: 'pointer' }} />
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

