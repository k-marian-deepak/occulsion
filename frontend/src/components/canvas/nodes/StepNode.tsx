import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitBranch } from 'lucide-react'

export function StepNode({ data, selected }: NodeProps) {
  return (
    <div style={{
      background: '#0e1015',
      border: `1px solid ${selected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 6,
      padding: '10px 16px 10px 16px',
      minWidth: 200,
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'relative',
      boxShadow: selected ? '0 0 0 2px rgba(255,255,255,0.1)' : '0 4px 12px rgba(0,0,0,0.5)',
      transition: 'all 0.15s ease',
    }}>
      {/* ── Icon Squircle ──────────────────────────────────── */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: (data.iconBg as string) || '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {data.label === 'If' ? (
          <GitBranch size={16} color={(data.iconColor as string) || '#000'} strokeWidth={2.5} />
        ) : (
          <img
            src={(data.iconUrl as string) || 'https://fav.farm/✨'}
            alt=""
            style={{ width: 16, height: 16, objectFit: 'contain' }}
          />
        )}
      </div>

      {/* ── Text ───────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginBottom: 2 }}>
          {(data.subtext as string) || 'Step'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>
          {(data.label as string) ?? 'Action'}
        </div>
      </div>

      {/* ── Handles ────────────────────────────────────────── */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#0e1015',
          border: '1px solid rgba(255,255,255,0.4)',
          width: 12, height: 12,
          borderRadius: 4,
          top: -6,
        }}
      />
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
    </div>
  )
}
