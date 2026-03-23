import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, ChevronRight } from 'lucide-react'
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
  const { setNodes, setEdges, addNode } = useWorkflowStore()
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
