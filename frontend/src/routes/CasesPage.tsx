import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ChevronDown, Check, LayoutPanelLeft, Plus, Settings2, RefreshCcw, Sidebar, Clock, Star, Edit2, LayoutDashboard, MoreHorizontal, X } from 'lucide-react'

// --- Types & Mock Data ---

type BoardCase = {
  id: string
  state: 'new' | 'in_progress' | 'on_hold' | 'resolved' | 'closed'
  number: number
  category: string
  title: string
  timeText: string
  tags: string[]
  assigneeImg: string
  severity: 'high' | 'medium' | 'low' | 'critical'
}

const COLUMNS = [
  { id: 'new', label: 'New', count: 45 },
  { id: 'in_progress', label: 'In progress', count: 11 },
  { id: 'on_hold', label: 'On hold', count: 32 },
  { id: 'resolved', label: 'Resolved', count: 53 },
  { id: 'closed', label: 'Closed', count: 232 }
]

const MOCK_CASES: BoardCase[] = [
  { id: 'c1', state: 'new', number: 664, category: 'Identity & Access Man...', title: 'User tried to login from new location with a failed MFA -', timeText: '9h 19m | 2w', tags: ['Malicious IP'], assigneeImg: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', severity: 'high' },
  { id: 'c2', state: 'new', number: 653, category: 'Email Security', title: 'Phishing Alert: Email to user... Title: "Your package is ready, needs to be released from customs."', timeText: '2d 6h | 2w', tags: ['Malicious I...', '+2'], assigneeImg: 'https://api.dicebear.com/7.x/identicon/svg?seed=12', severity: 'critical' },
  { id: 'c3', state: 'new', number: 666, category: 'Email Security', title: 'Phishing Alert: Email to user...', timeText: '8h 54m | 2w', tags: [], assigneeImg: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', severity: 'medium' },
  { id: 'c4', state: 'in_progress', number: 667, category: 'Email Security', title: 'Phishing Alert: Email to bob@comp.com, Title: "Your package is ready, needs to be released from customs."', timeText: '2h 49m | 2w', tags: ['Phishing'], assigneeImg: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', severity: 'high' },
  { id: 'c5', state: 'on_hold', number: 521, category: 'Endpoint Detection and...', title: 'Suspicious Process Behavior on leonid-il-win', timeText: '-13w 1d | 1d', tags: ['phishing', '+4'], assigneeImg: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave', severity: 'critical' },
  { id: 'c6', state: 'resolved', number: 658, category: 'Identity & Access Man...', title: 'User connected from two geographically remote IP locations in a short time period -', timeText: '13h 12m | 1d', tags: [], assigneeImg: 'https://api.dicebear.com/7.x/identicon/svg?seed=22', severity: 'low' },
  { id: 'c7', state: 'closed', number: 616, category: 'Identity & Access Man...', title: 'User tried to login from new location with a failed MFA -', timeText: '3w 2d | 508w 2d', tags: [], assigneeImg: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve', severity: 'low' },
]

// --- Helper Components ---

function DropdownFilter({ label, options, selected, onChange, width = 160 }: any) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayVal = selected.includes('Select all') ? 'All' : (selected.length > 0 ? selected[0] + (selected.length>1?' +':'') : 'All')

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ 
        background: 'transparent', border: '1px solid #333842', borderRadius: 4, padding: '6px 10px', 
        display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0', fontSize: 12, cursor: 'pointer',
      }}>
        <div style={{ color: '#9ca3af' }}>{label}:</div>
        <div style={{ fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayVal}</div>
        <ChevronDown size={14} color="#9ca3af" style={{ marginLeft: 'auto' }} />
      </button>
      
      {open && (
        <div className="animate-fade-in" style={{ 
          position: 'absolute', top: '100%', left: 0, marginTop: 4, width, 
          background: '#16191f', border: '1px solid #2a2e35', borderRadius: 6, zIndex: 50,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid #2a2e35' }}>
            <div style={{ background: '#252830', border: '1px solid #333842', borderRadius: 4, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Search size={14} color="#9ca3af" />
              <input placeholder={`Find ${label}...`} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 12, width: '100%' }} />
            </div>
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {options.map((opt: string) => {
              const checked = selected.includes(opt)
              return (
                <label key={opt} style={{ 
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 4, 
                  cursor: 'pointer', fontSize: 13, color: '#e2e8f0'
                }} className="hoverable-row">
                  <div style={{ width: 14, height: 14, border: '1px solid ' + (checked?'#fff':'#6b7280'), borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checked?'#fff':'transparent' }}>
                    {checked && <Check size={10} color="#000" strokeWidth={3} />}
                  </div>
                  {opt}
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function getSeverityColor(sev: string) {
  if (sev === 'critical') return '#ef4444'
  if (sev === 'high') return '#f97316'
  if (sev === 'medium') return '#eab308'
  return '#22c55e'
}

export function CasesPage() {
  const navigate = useNavigate()
  const [selectedCase, setSelectedCase] = useState<BoardCase | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('Overview')
  const [runWorkflowOpen, setRunWorkflowOpen] = useState(false)
  const [analyzeBodyOpen, setAnalyzeBodyOpen] = useState(false)
  const [isSubmittingAnalyze, setIsSubmittingAnalyze] = useState(false)
  const [sidePanelView, setSidePanelView] = useState<'timeline' | 'socrates'>('timeline')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')

  // Example Filter States
  const [sevSelection, setSevSelection] = useState<string[]>(['Select all'])
  const [stateSelection, setStateSelection] = useState<string[]>(['Select all'])
  const [assigneeSelection, setAssigneeSelection] = useState<string[]>(['Assigned to me'])

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#08090b', color: '#fff', overflow: 'hidden', fontFamily: 'inherit' }}>
      
      {/* ── Overarching Top Header ────────────────────────────────────── */}
      <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #1c1e23', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1c1e23', border: '1px solid #2a2e35', borderRadius: 6, padding: '6px 12px', width: 280 }}>
            <Search size={14} color="#8891a8" />
            <input placeholder="Search cases" style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13, width: '100%', fontStyle: 'italic' }} />
          </div>

          <div style={{ width: 32, height: 32, background: '#252830', border: '1px solid #333842', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Filter size={14} color="#e2e8f0" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            All Cases <ChevronDown size={14} color="#9ca3af" />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#1c1e23', border: '1px solid #2a2e35', borderRadius: 20, padding: '2px' }}>
            <div style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>All Workspaces</div>
            <div style={{ background: '#fff', color: '#000', borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>socrates-playground</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
            <Settings2 size={16} color="#9ca3af" style={{ cursor: 'pointer' }} />
            <RefreshCcw size={16} color="#e2e8f0" style={{ cursor: 'pointer' }} />
            <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Plus size={16} color="#000" strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Second Row Filters ────────────────────────────────────── */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #1c1e23', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: '1px solid #333842', borderRadius: 4, padding: '6px 10px', gap: 6, color: '#e2e8f0', fontSize: 12 }}>
            <span style={{ color: '#9ca3af' }}>Sort by:</span> <span style={{ fontWeight: 600 }}>Severity</span> <ChevronDown size={14} color="#9ca3af" />
            <div style={{ width: 1, height: 14, background: '#333842', margin: '0 4px' }} />
            <i className="fa-solid fa-arrow-down-short-wide" style={{ color: '#9ca3af', cursor: 'pointer' }} />
          </div>

          <DropdownFilter label="Severity" options={['Select all', 'Informational', 'Low', 'Medium', 'High', 'Critical']} selected={sevSelection} onChange={setSevSelection} />
          <DropdownFilter label="Tag" options={['Select all', 'Phishing', 'Malware', 'Credential Access']} selected={['Select all']} onChange={()=>{}} />
          <DropdownFilter label="Assignee" options={['Select all', 'Assigned to me', 'Unassigned', 'Bob Boyle', 'Alice Admin']} selected={assigneeSelection} onChange={(v:any)=>setAssigneeSelection(v)} />
          <DropdownFilter label="Resolution SLA" options={['Select all', 'Breached', 'At risk', 'On track']} selected={['Select all']} onChange={()=>{}} />
          <DropdownFilter label="Category" options={['Select all', 'Email Security', 'Identity', 'Endpoint']} selected={['Select all']} onChange={()=>{}} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <DropdownFilter label="State" options={['Select all', 'New', 'In progress', 'On hold', 'Resolved', 'Closed']} selected={stateSelection} onChange={setStateSelection} />
            <DropdownFilter label="Tasks" options={['Select all', 'Pending', 'Action required']} selected={['Select all']} onChange={()=>{}} />
            <DropdownFilter label="Created at" options={['Any time', 'Last 24 hours', 'Last 7 days']} selected={['Any time']} onChange={()=>{}} />
            <button style={{ background: 'transparent', border: 'none', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 4 }}><Plus size={16} /></button>
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
          <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Reset</span>
          <button style={{ background: 'transparent', border: '1px solid #fff', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, padding: '6px 16px', cursor: 'pointer' }}>Save</button>
        </div>
      </div>

      {/* ── Board Layout Container ────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflowX: 'auto', overflowY: 'hidden', padding: '24px' }}>
        
        {COLUMNS.map(col => {
          const colCases = MOCK_CASES.filter(c => c.state === col.id)
          return (
            <div key={col.id} style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', marginRight: 24 }}>
              
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{col.label}</div>
                <div style={{ background: '#252830', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>{col.count}</div>
              </div>

              {/* Card List in Column */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
                {colCases.length === 0 ? (
                  <div style={{ background: '#13151a', borderRadius: 8, height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16, border: '1px solid #2a2e35' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>No more</span>
                  </div>
                ) : (
                  colCases.map(c => {
                    const sevColor = getSeverityColor(c.severity)
                    const isSelected = selectedCase?.id === c.id
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => { setSelectedCase(c); setIsExpanded(false) }}
                        style={{ 
                          background: '#1c1e23', border: `1px solid ${isSelected ? '#9ca3af' : '#2a2e35'}`, 
                          borderRadius: 8, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12,
                          cursor: 'pointer', transition: 'border-color .15s', position: 'relative'
                        }}
                      >
                        {/* Selected Checkbox overlay logic from image 4 -> not exactly full overlay, just highlighting border is enough or standard selector */}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: -1, left: -1, width: 28, height: 28, background: '#1c1e23', border: '1px solid #9ca3af', borderBottomRightRadius: 8, borderTopLeftRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 12, height: 12, border: '1px solid #fff', borderRadius: 2 }} />
                          </div>
                        )}

                        {/* Top Dash array */}
                        <div style={{ display: 'flex', gap: 4, height: 4, marginLeft: isSelected ? 32 : 0 }}>
                          {[1,2,3,4,5].map(i => (
                            <div key={i} style={{ flex: 1, background: i <= 2 ? sevColor : '#333842', borderRadius: 2 }} />
                          ))}
                        </div>

                        {/* Time label */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 4, alignSelf: 'flex-start', fontSize: 12, fontWeight: 600 }}>
                          <Star size={12} fill="#3b82f6" /> {c.timeText}
                        </div>

                        {/* Category & ID */}
                        <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
                          #{c.number} • {c.category}
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: 14, color: '#fff', fontWeight: 500, lineHeight: 1.5 }}>
                          {c.title}
                        </div>

                        {/* Footer tags / assignee */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', background: '#333842' }}>
                            <img src={c.assigneeImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {c.tags.map(tag => (
                              <div key={tag} style={{ border: '1px solid #333842', background: '#252830', color: '#e2e8f0', fontSize: 11, fontWeight: 500, padding: '4px 8px', borderRadius: 4 }}>
                                {tag}
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )
                  })
                )}
              </div>

            </div>
          )
        })}

      </div>

      {/* ── Slide-over Case Details Panel ────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: selectedCase ? (isExpanded ? '100vw' : 600) : 0, 
        background: '#0e1015', borderLeft: '1px solid #2a2e35', zIndex: 1000, // ensures it covers the sidebar
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden',
        boxShadow: selectedCase ? '-20px 0 50px rgba(0,0,0,0.5)' : 'none',
        display: 'flex'
      }}>
        {selectedCase && (
          <>
            {/* Left Timeline Pane */}
            <div style={{ 
              width: isExpanded ? 450 : 600, flexShrink: 0, display: 'flex', flexDirection: 'column', 
              borderRight: isExpanded ? '1px solid #2a2e35' : 'none', background: '#0e1015', height: '100%' 
            }}>
              
              {/* Header */}
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #1c1e23', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div onClick={() => setIsExpanded(!isExpanded)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4dc4d6', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      {isExpanded ? (
                        <><i className="fa-solid fa-down-left-and-up-right-to-center" /> Collapse</>
                      ) : (
                        <><i className="fa-solid fa-up-right-and-down-left-from-center" /> Expand</>
                      )}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>#{selectedCase.number}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {!isExpanded && <button style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}><i className="fa-solid fa-reply" /></button>}
                    {!isExpanded && <button style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}><LayoutDashboard size={16} /></button>}
                    {!isExpanded && <button style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}><MoreHorizontal size={16} /></button>}
                    <button onClick={() => setSelectedCase(null)} style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', marginLeft: 8 }}><X size={18} /></button>
                  </div>
                </div>

              {/* Progress Bar Header */}
              <div style={{ display: 'flex', gap: 4, height: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex: 1, background: i <= 2 ? getSeverityColor(selectedCase.severity) : '#333842', borderRadius: 2 }} />
                ))}
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: 4, alignSelf: 'flex-start', fontSize: 12, fontWeight: 600 }}>
                <Star size={12} fill="#3b82f6" /> {selectedCase.timeText}
              </div>

              <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
                {selectedCase.title}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ border: '1px solid #333842', background: '#1c1e23', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', fontSize: 13, color: '#e2e8f0' }}>
                  <i className="fa-regular fa-clone" /> {selectedCase.state.replace('_',' ')} <ChevronDown size={14} />
                </div>
                <div style={{ border: '1px solid #333842', background: '#1c1e23', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', fontSize: 13, color: '#e2e8f0' }}>
                  <img src="https://companieslogo.com/img/orig/BAM.ST-7c603fd1.png?t=1" width="14" alt="" /> {selectedCase.category} <ChevronDown size={14} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ border: '1px solid #333842', background: '#252830', color: '#e2e8f0', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 4, display: 'flex', gap: 6 }}>
                    Phishing <Edit2 size={12} color="#9ca3af" />
                  </div>
                </div>
                <img src={selectedCase.assigneeImg} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) minmax(130px, 1fr) minmax(130px, 1fr) auto', border: '1px solid #2a2e35', borderRadius: 6, marginTop: 8, position: 'relative' }}>
                <div 
                  onClick={() => setAnalyzeBodyOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#fff', borderRight: '1px solid #2a2e35', cursor: 'pointer' }}
                >
                  Analyze Body
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#9ca3af', borderRight: '1px solid #2a2e35', lineHeight: 1.2 }}>
                  Scan Attachments
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#9ca3af', borderRight: '1px solid #2a2e35', lineHeight: 1.2 }}>
                  Analyze Headers
                </div>
                <div 
                  onClick={() => setRunWorkflowOpen(!runWorkflowOpen)}
                  style={{ 
                    padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    background: runWorkflowOpen ? '#333842' : 'transparent', borderTopRightRadius: 6, borderBottomRightRadius: 6
                  }}
                  title="Run a workflow ⇧ R"
                >
                  <i className="fa-solid fa-layer-group" style={{ color: runWorkflowOpen ? '#fff' : '#9ca3af' }} />
                </div>

                {runWorkflowOpen && (
                  <div className="animate-fade-in" style={{
                    position: 'absolute', top: 48, right: 0, width: 340, background: '#1c1e23', 
                    border: '1px solid #333842', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 50,
                    display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #2a2e35' }}>
                      <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Run a workflow</div>
                      <X size={14} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => setRunWorkflowOpen(false)} />
                    </div>
                    
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ border: '1px solid #333842', background: '#13151a', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 10 }}>
                        <Search size={14} color="#8891a8" />
                        <input
                          placeholder="Search for a workflow"
                          style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: '100%' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 12 }}>
                      {[
                        'Let Socrates Handle It',
                        'Get Detailed Device Information',
                        'Quarantine User',
                        'Get Detailed User Information',
                        'Retrieve and Normalize data on a File Hash'
                      ].map(item => (
                        <div key={item} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                          onClick={() => {
                            setRunWorkflowOpen(false);
                            setSidePanelView('socrates');
                            const userMsg = { role: 'user', content: `Run workflow: ${item}`, name: 'Bob Boyle', time: 'a few seconds ago' };
                            setChatMessages(prev => [...prev, userMsg]);
                            setTimeout(() => {
                              setChatMessages(prev => [...prev, {
                                role: 'assistant',
                                name: 'Socrates',
                                time: 'a few seconds ago',
                                content: `I have initiated the workflow **${item}**. You will see the results momentarily. Please let me know if you need to perform additional actions.`
                              }]);
                            }, 1000);
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#252830'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <i className="fa-solid fa-globe" style={{ color: '#10b981', fontSize: 14 }} />
                          <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 400 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Timeline Area */}
            {/* Timeline Area (Includes Socrates Toggle) */}
            <div style={{ flex: 1, display: 'flex', background: '#13151a', overflow: 'hidden' }}>
              <div style={{ width: 48, borderRight: '1px solid #1c1e23', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 16, flexShrink: 0 }}>
                <div 
                  onClick={() => setSidePanelView('timeline')}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 8, background: sidePanelView === 'timeline' ? '#1c1e23' : 'transparent', color: sidePanelView === 'timeline' ? '#fff' : '#e2e8f0', transition: 'background 0.2s' }}
                >
                  <i className="fa-solid fa-code-branch" />
                </div>
                <div 
                  onClick={() => setSidePanelView('socrates')}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 8, background: sidePanelView === 'socrates' ? '#1c1e23' : 'transparent', color: sidePanelView === 'socrates' ? '#fff' : '#9ca3af', position: 'relative', transition: 'background 0.2s' }}
                  onMouseEnter={e => {
                    const tip = document.createElement('div');
                    tip.className = 'socrates-tooltip';
                    tip.innerHTML = 'Socrates';
                    Object.assign(tip.style, {
                      position: 'absolute', left: '46px', background: '#000', color: '#fff', padding: '4px 8px', 
                      borderRadius: '4px', fontSize: '10px', zIndex: '100', whiteSpace: 'nowrap'
                    });
                    e.currentTarget.appendChild(tip);
                  }}
                  onMouseLeave={e => e.currentTarget.querySelector('.socrates-tooltip')?.remove()}
                >
                  <i className="fa-solid fa-headset" />
                </div>
                <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 8, color: '#9ca3af', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1c1e23'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <i className="fa-regular fa-pen-to-square" />
                </div>
                <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 8, color: '#9ca3af', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1c1e23'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <i className="fa-solid fa-user-shield" />
                </div>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {sidePanelView === 'timeline' ? (
                  <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Timeline</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>Today</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: '#252830' }} />

                      {[
                        { icon: <Plus size={16} color="#000" />, bg: '#fff', title: 'Case created', sub: 'Workflow | 13:03' },
                        { icon: <i className="fa-solid fa-paperclip" style={{ color: '#000' }}/>, bg: '#facc15', title: 'Event attached', sub: 'Workflow | 13:03' },
                        { icon: <i className="fa-regular fa-pen-to-square" style={{ color: '#e2e8f0' }}/>, bg: '#333842', title: 'From was updated', sub: 'Workflow | 13:03' },
                        { icon: <i className="fa-regular fa-pen-to-square" style={{ color: '#e2e8f0' }}/>, bg: '#333842', title: 'Subject was updated', sub: 'Workflow | 13:03' },
                        { icon: <i className="fa-regular fa-pen-to-square" style={{ color: '#e2e8f0' }}/>, bg: '#333842', title: 'Reply To was updated', sub: 'Workflow | 13:04' },
                      ].map((evt, i) => (
                        <div key={i} style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 2 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: evt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #13151a' }}>
                            {evt.icon}
                          </div>
                          <div style={{ paddingTop: 6 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{evt.title}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>
                              <span onClick={() => navigate('/canvas?mode=runlog')} style={{ textDecoration: 'underline', cursor: 'pointer', color: '#e2e8f0' }}>Workflow</span> | {evt.sub.split('|')[1]}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Socrates Header */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1e23', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#9ca3af' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <i className="fa-solid fa-chevron-left" style={{ cursor: 'pointer' }} onClick={() => setSidePanelView('timeline')} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{chatMessages.length > 0 ? 'Phishing email report in progress.' : 'New Conversation'}</span>
                      </div>
                      <i className="fa-regular fa-pen-to-square" style={{ cursor: 'pointer' }} onClick={() => setChatMessages([])} />
                    </div>

                    {/* Chat Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 32 }}>
                      {chatMessages.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center' }}>
                          <div style={{ width: 44, height: 44, background: '#8b5cf6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-headset" style={{ color: '#fff', fontSize: 24 }} />
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>How can I help today?</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360 }}>
                            {[
                              'Analyze Suspicious Email Headers for Phishing Email',
                              'Scan Email Attachments for Malware',
                              'Search for Related Phishing Cases',
                              'Find Cases Related to Endpoint Devices',
                              'Investigate Indicators of Compromise (IOCs) in URL Observables'
                            ].map(suggestion => (
                              <div 
                                key={suggestion} 
                                onClick={() => {
                                  const userMsg = { role: 'user', content: suggestion, name: 'Bob Boyle', time: 'a few seconds ago' };
                                  setChatMessages([userMsg]);
                                  setTimeout(() => {
                                    setChatMessages(prev => [...prev, {
                                      role: 'assistant',
                                      name: 'Socrates',
                                      time: 'a few seconds ago',
                                      content: `Certainly! Here's a summary of case #${selectedCase?.number}:\n\n• **Title**: Phishing Alert: Email to user with the subject "Your package is ready..."\n• **Description**: A potential phishing email was reported... It passed DMARC/SPF checks... included a malicious link pointing to a worker site on jayden1077.workers.io.`
                                    }]);
                                  }, 1000);
                                }}
                                style={{ padding: '10px 16px', background: '#1c1e23', border: '1px solid #333842', borderRadius: 20, fontSize: 12, color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                                onMouseEnter={e => e.currentTarget.style.background = '#252830'}
                                onMouseLeave={e => e.currentTarget.style.background = '#1c1e23'}
                              >
                                <i className="fa-solid fa-terminal" style={{ fontSize: 12, color: '#9ca3af' }} />
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        chatMessages.map((msg, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 16 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.role === 'user' ? '#fff' : '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {msg.role === 'user' ? (
                                <img src={selectedCase?.assigneeImg} style={{ width: '100%', height: '100%', borderRadius: '50%' }} alt="" />
                              ) : (
                                <i className="fa-solid fa-headset" style={{ color: '#fff', fontSize: 16 }} />
                              )}
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                                {msg.name} <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: 8, fontStyle: 'italic', fontSize: 12 }}>{msg.time}</span>
                              </div>
                              <div style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat Input Area */}
                    <div style={{ padding: '0 20px 24px' }}>
                      <div style={{ border: '1px solid #333842', background: '#1c1e23', borderRadius: 24, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input 
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && chatInput.trim()) {
                              const newMessages = [...chatMessages, { role: 'user', name: 'Bob Boyle', time: 'a few seconds ago', content: chatInput }];
                              setChatMessages(newMessages);
                              setChatInput('');
                              setTimeout(() => {
                                setChatMessages(prev => [...prev, { role: 'assistant', name: 'Socrates', time: 'a few seconds ago', content: "I'm analyzing the details for you. Is there anything specific from headers you'd like me to focus on?" }]);
                              }, 1000);
                            }
                          }}
                          placeholder="Ask me anything" 
                          style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, flex: 1 }} 
                        />
                        <div 
                          onClick={() => {
                            if (chatInput.trim()) {
                              const newMessages = [...chatMessages, { role: 'user', name: 'Bob Boyle', time: 'a few seconds ago', content: chatInput }];
                              setChatMessages(newMessages);
                              setChatInput('');
                              setTimeout(() => {
                                setChatMessages(prev => [...prev, { role: 'assistant', name: 'Socrates', time: 'a few seconds ago', content: "I'm analyzing the details for you. Is there anything specific from headers you'd like me to focus on?" }]);
                              }, 1000);
                            }
                          }}
                          style={{ 
                            width: 28, height: 28, background: chatInput.trim() ? '#8b5cf6' : '#252830', borderRadius: '50%', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            cursor: chatInput.trim() ? 'pointer' : 'default', transition: 'background 0.2s',
                            boxShadow: chatInput.trim() ? '0 0 10px rgba(139, 92, 246, 0.5)' : 'none'
                          }}>
                          <i className="fa-solid fa-arrow-up" style={{ color: chatInput.trim() ? '#fff' : '#6b7280', fontSize: 13 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Footer (Fixed when scrollable) */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #1c1e23', background: '#0e1015', display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
              <Plus size={16} color="#9ca3af" />
              <i className="fa-solid fa-filter" style={{ color: '#9ca3af' }} />
              <div style={{ flex: 1, background: '#1c1e23', border: '1px solid #333842', borderRadius: 20, padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                <input placeholder="Add a comment" style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: '100%' }} />
              </div>
            </div>

          </div>

          {/* Right Extended Details Pane */}
          {isExpanded && (
            <div className="animate-fade-in" style={{ flex: 1, background: '#1c1e23', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              
              {/* Top Details Nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #2a2e35' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                  <div style={{ cursor: 'pointer', color: '#9ca3af' }}><i className="fa-solid fa-chevron-left" /></div>
                  
                  {['Overview', 'Observables', 'Notes', 'Attachments', 'Linked cases', 'Events'].map((tab, idx) => (
                    <div key={tab} onClick={() => setActiveTab(tab)} style={{ 
                      fontSize: 13, fontWeight: tab === activeTab ? 600 : 500, color: tab === activeTab ? '#fff' : '#e2e8f0', 
                      position: 'relative', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingBottom: 16, marginBottom: -16
                    }}>
                      {tab}
                      {idx > 0 && idx < 5 && <div style={{ background: '#333842', color: '#9ca3af', fontSize: 11, padding: '1px 6px', borderRadius: 12 }}>{idx === 1 ? 2 : (idx === 3 ? 4 : (idx === 4 ? 0 : 2))}</div>}
                      {idx === 5 && <div style={{ background: '#333842', color: '#9ca3af', fontSize: 11, padding: '1px 6px', borderRadius: 12 }}>1</div>}
                      {tab === activeTab && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: '#fff' }} />}
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <button onClick={() => setSidePanelView('socrates')} style={{ background: 'none', border: 'none', color: sidePanelView === 'socrates' ? '#8b5cf6' : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}><i className="fa-solid fa-headset" style={{ fontSize: 16 }} /></button>
                  <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><MoreHorizontal size={16} /></button>
                  <button onClick={() => setSelectedCase(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', marginRight: -8 }}><X size={16} /></button>
                </div>
              </div>

              {/* Toggled Tabs Content */}
              {activeTab === 'Overview' && (
                <div style={{ padding: '32px 48px', maxWidth: 1000, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>
                  
                  {/* Case Summary block */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#fff' }}>
                        <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#9ca3af' }} /> Case Summary
                      </div>
                      <button style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <RefreshCcw size={12} /> Regenerate
                      </button>
                    </div>
                    
                    <div style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div><span style={{background: '#8b5cf6', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 600, fontSize: 12, marginRight: 8}}>What:</span> A phishing email was sent to customer disguised as a notification from DHL Customs. The email contained malicious links and an attachment labeled as an invoice but identified as malicious.</div>
                      <div><span style={{background: '#8b5cf6', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 600, fontSize: 12, marginRight: 8}}>When:</span> The phishing attempt was detected and reported by automation on 2024-09-18 20:03:53 UTC.</div>
                      <div><span style={{background: '#8b5cf6', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 600, fontSize: 12, marginRight: 8}}>Impact:</span> The phishing attack aimed to compromise the recipient's computer or network through malicious downloads. The email passed SPF and DMARC checks, increasing its chances of deceiving the recipient.</div>
                      <div><span style={{background: '#db2777', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 600, fontSize: 12, marginRight: 8}}>Key indicators:</span> Malicious links were detected, specifically '<span style={{color: '#8b5cf6', textDecoration: 'underline'}}>https://wood-82c2.jayden1077.workers.io/...</span>', underscoring the phishing attack's intent to deceive.</div>
                      <div style={{fontSize: 12, color: '#6b7280', marginTop: 4}}>Generated by AI on Sep 18, 2024, 03:53 PM</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>Description</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8, lineHeight: 1.4 }}>
                      A Phishing Alert Was received from service@dhl.com
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>
                      Description:<br/>
                      An Possible Phishing Email was submitted by the user. The email attempts to solicit credential harvesting through a fake customs portal.
                    </div>
                  </div>

                  {/* Alert Details Table */}
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Alert Details</div>
                    <div style={{ border: '1px solid #333842', borderRadius: 4, overflow: 'hidden' }}>
                      {[
                        { k: 'From', v: 'service@dhl.com', link: true },
                        { k: 'Recipient', v: 'bob.boyle@company.com', link: true },
                        { k: 'Received', v: 'from gmail.com by gmail.com on July 8th 2024' },
                        { k: 'Subject', v: 'Your package is ready, needs to be released from customs.' },
                        { k: 'ReplyTo', v: 'service@dhl.cupkaedomain.com', link: true },
                        { k: 'BCC', v: 'Empty' },
                        { k: 'CC', v: 'Empty' },
                        { k: 'DMARC Valid', v: 'Pass' },
                        { k: 'SPF Valid', v: 'Pass' },
                        { k: 'Message ID', v: '<20240125070259.339d1ea6240e193b>', link: true },
                        { k: 'Attachments Included', v: 'true' },
                      ].map((row, i) => (
                        <div key={row.k} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', borderBottom: i === 10 ? 'none' : '1px solid #333842', background: i % 2 === 0 ? '#13151a' : '#1c1e23' }}>
                          <div style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: 13, borderRight: '1px solid #333842', fontWeight: 600 }}>{row.k}</div>
                          <div style={{ padding: '12px 16px', color: row.link ? '#8b5cf6' : '#9ca3af', fontSize: 13, textDecoration: row.link ? 'underline' : 'none', cursor: row.link ? 'pointer' : 'default', fontWeight: 500, wordBreak: 'break-all' }}>{row.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* HTML Rendered Emali Body (Placeholder) */}
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Rendered Email Body</div>
                    <div style={{ background: '#fff', padding: 32, borderRadius: 4, color: '#000', fontSize: 14, fontFamily: 'sans-serif' }}>
                      <p style={{ marginBottom: 16 }}>Dear Customer,</p>
                      <p style={{ marginBottom: 16 }}>We attempted to deliver your package today but were unsuccessful because nobody was present to sign for the delivery.</p>
                      <button style={{ background: '#d40511', color: '#fff', border: 'none', padding: '12px 24px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>Release Package Now</button>
                      <p style={{ color: '#666', fontSize: 12 }}>Note: If not claimed within 48 hours, the package will be returned to sender.</p>
                    </div>
                  </div>

                </div>
              )}
              {activeTab === 'Events' && (
                <div style={{ padding: '32px 48px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(200px, 2fr) minmax(200px, 2fr) auto', borderBottom: '1px solid #333842', paddingBottom: 16, marginBottom: 16, color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>
                    <div>Event ID</div>
                    <div>Event source</div>
                    <div>Event name</div>
                    <div>Event time</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(200px, 2fr) minmax(200px, 2fr) auto', color: '#e2e8f0', fontSize: 13, padding: '16px 0', borderBottom: '1px solid #2a2e35', alignItems: 'center' }}>
                    <div>AA-021493</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <img src={'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'} width={24} height={24} style={{ borderRadius: '50%', background: '#333842' }} alt="" /> On demand execution
                    </div>
                    <div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>Today at 1:03 PM <ChevronDown size={14} color="#9ca3af"/></div>
                  </div>
                </div>
              )}

              {activeTab === 'Observables' && (
                <div style={{ padding: '32px 48px', maxWidth: 1000, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100%' }}>
                  <div style={{ background: '#1c1e23', border: '1px solid #333842', borderRadius: 12, padding: '16px 24px', display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ width: 80, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>URL</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{width: 6, height: 6, background: '#22c55e', borderRadius: '50%'}}/> Probably safe <span style={{color: '#9ca3af', fontWeight: 500}}>ID 39</span>
                      </div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', wordBreak: 'break-all' }}>https://walmart.com.mx</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Unknown</div>
                    </div>
                  </div>

                  <div style={{ background: '#1c1e23', border: '1px solid #333842', borderRadius: 12, padding: '16px 24px', display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ width: 80, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>URL</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{width: 8, height: 8, background: '#ef4444', transform: 'rotate(45deg)'}}/> Malicious <span style={{color: '#9ca3af', fontWeight: 500}}>ID 40</span>
                      </div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', wordBreak: 'break-all' }}>https://wood-82c2.jayden1077.workers.io/c64ed9ed-b68b-4f61-b26e-20d32f013ab</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Unknown</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', borderTop: '1px solid #2a2e35', paddingTop: 16 }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                      <Plus size={14}/> Add Observable
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'Attachments' && (
                <div style={{ padding: '32px 48px', maxWidth: 1000, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
                  {[
                    {name: 'email_body', meta: 'html | 9.48 KB'},
                    {name: 'body_screenshot', meta: 'png | 53.25 KB'},
                    {name: 'VirusTotalResponse', meta: 'json | 0 Bytes'},
                    {name: 'invoice', meta: 'doc | 9 Bytes'}
                  ].map((att, i) => (
                    <div key={i} style={{ background: '#1c1e23', border: '1px solid #333842', borderRadius: 12, padding: '16px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-file-zipper" style={{ color: '#000', fontSize: 16 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{att.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{att.meta}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Sep 18, 2024, 01:05 PM</div>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: 'auto', borderTop: '1px solid #2a2e35', paddingTop: 16, paddingBottom: 32 }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                      <Plus size={14}/> Add Attachments
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          </>
        )}
      </div>

      {/* MODALS */}
      {analyzeBodyOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-in" style={{ width: 600, background: '#0e1015', border: '1px solid #333842', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1c1e23', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Analyze Body</div>
              <X size={18} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => setAnalyzeBodyOpen(false)} />
            </div>
            <div style={{ padding: '40px 48px 60px' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 8 }}>case_id</div>
                <div style={{ background: '#1c1e23', border: '1px solid #333842', borderRadius: 6, padding: '10px 16px' }}>
                  <input defaultValue="0" style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
                <button 
                  onClick={() => {
                    setIsSubmittingAnalyze(true);
                    setTimeout(() => {
                      setIsSubmittingAnalyze(false);
                      setAnalyzeBodyOpen(false);
                      setSidePanelView('socrates');
                      setChatMessages([{
                        role: 'assistant', name: 'Socrates', time: 'a few seconds ago',
                        content: `Certainly! Here's a summary of case #${selectedCase?.number}:\n\n• **Title**: Phishing Alert: Email to user with the subject "Your package is ready..."\n• **Description**: A potential phishing email was reported... It passed DMARC/SPF checks... included a malicious link pointing to a worker site on jayden1077.workers.io.`
                      }]);
                    }, 1000);
                  }}
                  style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 24, padding: '10px 40px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmittingAnalyze ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
