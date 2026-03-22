import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore } from '@/stores/workflowStore'
import { TriggerNode } from './nodes/TriggerNode'
import { StepNode } from './nodes/StepNode'
import { OperatorNode } from './nodes/OperatorNode'
import { AINode } from './nodes/AINode'

const nodeTypes = {
  trigger: TriggerNode,
  step: StepNode,
  operator: OperatorNode,
  ai: AINode,
}

export function WorkflowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode } =
    useWorkflowStore()

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node)}
        onPaneClick={() => selectNode(null)}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          style: { stroke: 'var(--border2)', strokeWidth: 1.5 },
          animated: true,
        }}
      >
        <Background
          variant={'dots' as any}
          gap={22}
          size={1}
          color="var(--border2)"
          style={{ background: 'var(--bg)' }}
        />
        <Controls
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border2)',
            borderRadius: 8,
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'trigger') return 'var(--accent)'
            if (n.type === 'ai') return 'var(--green)'
            return 'var(--bg4)'
          }}
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border2)',
            borderRadius: 8,
          }}
        />
      </ReactFlow>
    </div>
  )
}
