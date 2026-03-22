import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Zap } from 'lucide-react'

export function TriggerNode({ data, selected }: NodeProps) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: `2px solid ${selected ? 'var(--accent)' : 'var(--accent-border)'}`,
      borderRadius: 10,
      padding: '10px 14px',
      minWidth: 180,
      boxShadow: selected ? '0 0 0 3px var(--aglow)' : 'none',
      transition: 'all 0.15s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'var(--aglow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)',
        }}>
          <Zap size={14} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Trigger
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {(data.label as string) ?? 'When…'}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--accent)', width: 8, height: 8 }} />
    </div>
  )
}
