import { ReactFlow, Background, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore } from '@/stores/workflowStore'
import { TriggerNode } from './nodes/TriggerNode'
import { StepNode } from './nodes/StepNode'
import { OperatorNode } from './nodes/OperatorNode'
import { AINode } from './nodes/AINode'
import { AnnotationNode } from './nodes/AnnotationNode'

export const nodeTypes = {
  trigger: TriggerNode,
  step: StepNode,
  operator: OperatorNode,
  ai: AINode,
  annotation: AnnotationNode,
}

export function WorkflowCanvas({ children }: { children?: React.ReactNode }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode } =
    useWorkflowStore()

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        proOptions={{ hideAttribution: true }}
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
        {children}
        <Background
          variant={'dots' as any}
          gap={22}
          size={1}
          color="var(--border2)"
          style={{ background: 'var(--bg)' }}
        />
      </ReactFlow>
    </div>
  )
}
