import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useEffect } from 'react'
import { Plus, Zap, Box, GitBranch, Sparkles, Save, GitCommit } from 'lucide-react'

const DEMO_NODES = [
  { id: '1', type: 'trigger',  position: { x: 250, y: 100 }, data: { label: 'Alert Received' } },
  { id: '2', type: 'step',     position: { x: 250, y: 230 }, data: { label: 'Enrich IOCs' } },
  { id: '3', type: 'operator', position: { x: 250, y: 360 }, data: { label: 'Severity ≥ High?' } },
  { id: '4', type: 'ai',       position: { x: 80,  y: 490 }, data: { label: 'AI Triage' } },
  { id: '5', type: 'step',     position: { x: 420, y: 490 }, data: { label: 'Close Alert' } },
]

const DEMO_EDGES = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4', sourceHandle: 'true',  label: 'Yes', style: { stroke: 'var(--green)' } },
  { id: 'e3-5', source: '3', target: '5', sourceHandle: 'false', label: 'No',  style: { stroke: 'var(--red)' } },
]

const TOOLBOX = [
  { type: 'trigger',  label: 'Trigger',    icon: <Zap size={12} />,       color: 'var(--accent)' },
  { type: 'step',     label: 'Step',       icon: <Box size={12} />,        color: 'var(--text2)' },
  { type: 'operator', label: 'Condition',  icon: <GitBranch size={12} />,  color: 'var(--amber)' },
  { type: 'ai',       label: 'AI Agent',   icon: <Sparkles size={12} />,   color: 'var(--green)' },
]

export function CanvasPage() {
  const { setNodes, setEdges, addNode, nodes } = useWorkflowStore()

  useEffect(() => {
    setNodes(DEMO_NODES as any)
    setEdges(DEMO_EDGES as any)
  }, [])

  const handleAddNode = (type: string, label: string) => {
    const id = `node-${Date.now()}`
    const offset = nodes.length * 20
    addNode({
      id,
      type,
      position: { x: 200 + offset, y: 200 + offset },
      data: { label },
    } as any)
  }

  return (
    <div style={{ display: 'flex', height: '100%', gap: 12 }}>
      {/* Toolbox */}
      <div className="card" style={{
        width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8,
        height: 'fit-content',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Node Types
        </div>
        {TOOLBOX.map(t => (
          <button
            key={t.type}
            className="btn btn-ghost"
            id={`toolbox-${t.type}`}
            style={{ justifyContent: 'flex-start', gap: 8, color: t.color }}
            onClick={() => handleAddNode(t.type, t.label)}
          >
            {t.icon} {t.label}
          </button>
        ))}

        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

        <button className="btn btn-primary" id="btn-publish-workflow" style={{ width: '100%', justifyContent: 'center' }}>
          <GitCommit size={12} /> Publish
        </button>
        <button className="btn btn-ghost" id="btn-save-draft" style={{ width: '100%', justifyContent: 'center' }}>
          <Save size={12} /> Save Draft
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, height: 'calc(100vh - 120px)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <WorkflowCanvas />
      </div>
    </div>
  )
}
