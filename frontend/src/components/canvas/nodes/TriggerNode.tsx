import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Zap } from 'lucide-react'

export function TriggerNode({ data, selected }: NodeProps) {
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
      background: '#0e1015',
      border: `1px solid ${selected ? 'rgba(255,255,255,0.4)' : diffBorder || 'rgba(255,255,255,0.08)'}`,
      borderRadius: 6,
      padding: '10px 16px 10px 12px',
      minWidth: 200,
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'relative',
      boxShadow: selected
        ? '0 0 0 2px rgba(255,255,255,0.1)'
        : diffBorder
        ? `0 0 0 2px ${diffBorder}40`
        : '0 4px 12px rgba(0,0,0,0.5)',
      transition: 'all 0.15s ease',
    }}>
      {/* ── Left color bar ─────────────────────────────────── */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#fff', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }} />

      {/* ── Icon Squircle ──────────────────────────────────── */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginLeft: 4,
      }}>
        <Zap size={16} color="#000" strokeWidth={2.5} />
      </div>

      {/* ── Text ───────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginBottom: 2 }}>
          Trigger
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>
          {(data.label as string) ?? 'On-demand'}
        </div>
      </div>

      {/* ── Handle ─────────────────────────────────────────── */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#0e1015',
          border: '1px solid rgba(255,255,255,0.4)',
          width: 12, height: 12,
          borderRadius: 4,
          bottom: -6,
        }}
      />

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
