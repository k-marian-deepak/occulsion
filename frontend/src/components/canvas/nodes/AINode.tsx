import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Sparkles } from 'lucide-react'

export function AINode({ data, selected }: NodeProps) {
  const diffType = data.__diffType as 'modified' | 'added' | 'deleted' | undefined
  const diffBorder =
    diffType === 'modified'
      ? '#3b82f6'
      : diffType === 'added'
      ? '#22c55e'
      : diffType === 'deleted'
      ? '#ef4444'
      : null

  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${selected ? 'var(--green)' : diffBorder || 'var(--gbg)'}`,
      borderRadius: 10,
      padding: '10px 14px',
      minWidth: 180,
      position: 'relative',
      transition: 'all 0.15s ease',
      boxShadow: selected ? '0 0 16px var(--gbg)' : diffBorder ? `0 0 0 2px ${diffBorder}40` : 'none',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--green)', width: 8, height: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'var(--gbg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--green)',
        }}>
          <Sparkles size={14} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>AI Agent</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {(data.label as string) ?? 'Analyze'}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--green)', width: 8, height: 8 }} />

      {diffType && (
        <div
          style={{
            position: 'absolute',
            top: -18,
            right: 0,
            color: diffBorder || '#fff',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {diffType}
        </div>
      )}
    </div>
  )
}
