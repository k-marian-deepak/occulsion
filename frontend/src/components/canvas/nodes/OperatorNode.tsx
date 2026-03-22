import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitBranch } from 'lucide-react'

export function OperatorNode({ data, selected }: NodeProps) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${selected ? 'var(--amber)' : 'var(--abg)'}`,
      borderRadius: 10,
      padding: '10px 14px',
      minWidth: 160,
      transition: 'all 0.15s ease',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--amber)', width: 8, height: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'var(--abg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--amber)',
        }}>
          <GitBranch size={14} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Condition</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {(data.label as string) ?? 'If / Else'}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="true"
        style={{ background: 'var(--green)', width: 8, height: 8, left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="false"
        style={{ background: 'var(--red)', width: 8, height: 8, left: '70%' }} />
    </div>
  )
}
