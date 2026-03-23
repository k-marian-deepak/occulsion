import { useState } from 'react'
import { Filter, Search, ChevronDown } from 'lucide-react'
import { DB, type Integration } from '@/data/integrations'

export function IntegrationsPage() {
  const [search, setSearch] = useState('')
  const visible = DB.filter(i => search === '' || i.n.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0, padding: 24, background: 'var(--bg)' }}>
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)',
            border: '1px solid var(--border2)', borderRadius: 6, padding: '8px 12px', width: 340,
          }}>
            <Search size={15} color="var(--text3)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, width: '100%', fontFamily: 'inherit' }}
              placeholder="Search for an integration"
            />
          </div>

          {/* Filter button */}
          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 6, border: '1px solid var(--border2)',
            background: 'var(--bg2)', cursor: 'pointer', color: 'var(--text2)', transition: 'all .15s',
          }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>
            <Filter size={15} />
          </button>
        </div>

        <button className="btn btn-primary" style={{ height: 36, padding: '0 16px', borderRadius: 18, background: '#fff', color: '#000', fontWeight: 600, border: 'none' }}>
          Create
        </button>
      </div>

      {/* ── Dropdowns ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Type', val: 'All' },
          { label: 'Shared', val: 'All' },
          { label: 'Activation', val: 'All' },
        ].map(d => (
          <button key={d.label} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6,
            fontSize: 12, color: 'var(--text2)', cursor: 'pointer',
          }}>
            <span>{d.label}: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{d.val}</span></span>
            <ChevronDown size={12} color="var(--text3)" />
          </button>
        ))}
      </div>

      {/* ── Grid ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px 12px', overflowY: 'auto' }}>
        {visible.map((int, i) => (
          <div key={i} style={{
            background: 'var(--bg2)', borderRadius: 6, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '24px 12px 20px',
            border: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color .15s',
            minHeight: 130, position: 'relative'
          }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}>
            
            {/* White Squircle inside dark card */}
            <div style={{
              width: 48, height: 48, background: '#fff', borderRadius: 12, display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              <i className={int.fa} style={{ color: int.ic !== '#fff' && int.ic !== 'var(--text)' ? int.ic : '#333', fontSize: 24 }} />
            </div>

            {/* Name */}
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textAlign: 'center', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
              {int.n}
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
