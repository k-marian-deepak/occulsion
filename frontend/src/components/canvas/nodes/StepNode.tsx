import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Box } from 'lucide-react'

export function StepNode({ data, selected }: NodeProps) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${selected ? 'var(--border3)' : 'var(--border2)'}`,
      borderRadius: 10,
      padding: '10px 14px',
      minWidth: 180,
      boxShadow: selected ? '0 0 0 3px var(--aglow)' : 'none',
      transition: 'all 0.15s ease',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--border3)', width: 8, height: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'var(--bg3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text2)',
        }}>
          <Box size={14} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Step</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {(data.label as string) ?? 'Action'}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--border3)', width: 8, height: 8 }} />
    </div>
  )
}
