import { useState, useRef, useEffect } from 'react'
import { Search, Filter, ChevronDown, Check, Download, Eye, X, ArrowRight, PlayCircle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWorkflowStore } from '@/stores/workflowStore'

// Define categories to match the dropdown image
const CATEGORIES = [
  { id: 'Device & User Compliance', count: 14 },
  { id: 'DLP', count: 2 },
  { id: 'DSPM', count: 1 },
  { id: 'Endpoint Detection and Response (EDR)', count: 20 },
  { id: 'Example', count: 19 },
  { id: 'Function', count: 35 },
  { id: 'Identity and Access Management', count: 48 },
  { id: 'Phishing', count: 10 },
  { id: 'Remediate Network Security Alerts', count: 10 },
  { id: 'Remediate Web Security Alerts', count: 5 },
  { id: 'Security Bots', count: 24 },
  { id: 'Suspicious User Activity', count: 8 },
]

const TEMPLATES = [
  {
    id: 1,
    title: 'AbuseIPDB IPv4 Address Enrichment with Cache',
    level: 'Basic', levelColor: '#38bdf8',
    desc: 'Workflow that will take an IPv4 address as input and query AbuseIPDB for details about the address including the Abuse...',
    icons: ['https://companieslogo.com/img/orig/AI.PA-6142c6eb.png?t=1655381861', 'https://companieslogo.com/img/orig/WORK-2ac3a5e8.png?t=1720244494'],
    tags: [{ label: 'Easy Starters', bg: '#dcfce7', color: '#166534' }, { label: 'Threat Intelligence Enrichment', bg: '#fef3c7', color: '#92400e' }],
    category: 'Threat Intelligence Enrichment'
  },
  {
    id: 2,
    title: 'Add and Remove URLs from the Global Blacklist (Zscaler)',
    level: 'Intermediate', levelColor: '#fb923c',
    desc: 'Triggers from Slack message for check url or remove url for the Global Blacklist for Zscaler. On a check url, the URL category is...',
    icons: ['https://companieslogo.com/img/orig/WORK-2ac3a5e8.png?t=1720244494', 'https://companieslogo.com/img/orig/TEAM-b4b39a3f.png?t=1720244494'],
    tags: [{ label: 'Featured', bg: '#dcfce7', color: '#166534' }, { label: 'Remediate Network Security Alerts', bg: '#fef3c7', color: '#92400e' }, { label: 'MITRE', bg: '#fee2e2', color: '#991b1b' }],
    category: 'Remediate Network Security Alerts'
  },
  {
    id: 3,
    title: 'Add Anti-Virus Evidence in Drata',
    level: 'Basic', levelColor: '#38bdf8',
    desc: 'Identify devices that are anti-virus non-compliant within Drata and upload evidence file provided to workflow.',
    icons: ['https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_2012_logo.svg', 'https://companieslogo.com/img/orig/TEAM-b4b39a3f.png?t=1720244494'],
    tags: [{ label: 'Featured', bg: '#dcfce7', color: '#166534' }, { label: 'Device & User Compliance', bg: '#fef3c7', color: '#92400e' }],
    category: 'Device & User Compliance'
  },
  {
    id: 4,
    title: 'Add Malicious IPs to Network Block Zone from Okta System Logs',
    level: 'Basic', levelColor: '#38bdf8',
    desc: 'On a schedule pull Okta system logs for specific event types, extract any IPv4 address and if found malicious update the bloc...',
    icons: ['https://companieslogo.com/img/orig/OKTA-44b20539.png?t=1720244493', 'https://companieslogo.com/img/orig/CRWD-369b50b5.png?t=1720244491'],
    tags: [{ label: 'Featured', bg: '#dcfce7', color: '#166534' }, { label: 'Identity and Access Management', bg: '#fef3c7', color: '#92400e' }],
    category: 'Identity and Access Management'
  },
  {
    id: 5,
    title: 'Block Domain Finding on PerceptionPoint (IntSights)',
    level: 'Intermediate', levelColor: '#fb923c',
    desc: 'Poll alerts in IntSights for High level Phishing issues. Ask a Slack channel if the domain should be blocked in PerceptionPoint\'s...',
    icons: ['https://companieslogo.com/img/orig/PANW-3cd017f7.png?t=1720244493', 'https://companieslogo.com/img/orig/WORK-2ac3a5e8.png?t=1720244494'],
    tags: [{ label: 'Featured', bg: '#dcfce7', color: '#166534' }, { label: 'Phishing', bg: '#fef3c7', color: '#92400e' }, { label: 'MITRE', bg: '#fee2e2', color: '#991b1b' }],
    category: 'Phishing'
  },
  {
    id: 6,
    title: 'Generate a Screenshot of a URL and Describe the Image via OpenAI',
    level: 'Basic', levelColor: '#38bdf8',
    desc: 'Generate a screenshot of a specific URL and ask OpenAI to review the image and provide input if it could be part of a phishing...',
    icons: ['https://companieslogo.com/img/orig/MSFT-a203b22d.png?t=1720244492'],
    tags: [{ label: 'Easy Starters', bg: '#dcfce7', color: '#166534' }, { label: 'Phishing', bg: '#fef3c7', color: '#92400e' }],
    category: 'Phishing'
  },
  {
    id: 7,
    title: 'Monitor an Outlook Mailbox for Phishing via Graph Subscription',
    level: 'Advanced', levelColor: '#f43f5e',
    desc: 'Analyze a message arriving to a mailbox in Outlook with VirusTotal for malicious and suspicious URLs and files. Update label on...',
    icons: ['https://companieslogo.com/img/orig/MSFT-a203b22d.png?t=1720244492', 'https://companieslogo.com/img/orig/TEAM-b4b39a3f.png?t=1720244494', 'https://companieslogo.com/img/orig/VirusTotal-icon.png?t=1'],
    tags: [{ label: 'Featured', bg: '#dcfce7', color: '#166534' }, { label: 'Phishing', bg: '#fef3c7', color: '#92400e' }],
    category: 'Phishing'
  },
  {
    id: 8,
    title: 'Monitor an Outlook Mailbox for Phishing with Recorded Future',
    level: 'Advanced', levelColor: '#f43f5e',
    desc: 'Scan messages arriving to a specific folder in Outlook with Recorded Future for malicious urls and files. Update category on...',
    icons: ['https://companieslogo.com/img/orig/MSFT-a203b22d.png?t=1720244492'],
    tags: [{ label: 'Featured', bg: '#dcfce7', color: '#166534' }, { label: 'Phishing', bg: '#fef3c7', color: '#92400e' }],
    category: 'Phishing'
  },
  {
    id: 9,
    title: 'Monitor an Outlook Mailbox for Phishing with VirusTotal',
    level: 'Advanced', levelColor: '#f43f5e',
    desc: 'Scan messages arriving to a specific folder in Outlook with VirusTotal for malicious urls and files. Update category on...',
    icons: ['https://companieslogo.com/img/orig/VirusTotal-icon.png?t=1'],
    tags: [{ label: 'Featured', bg: '#dcfce7', color: '#166534' }, { label: 'Phishing', bg: '#fef3c7', color: '#92400e' }],
    category: 'Phishing'
  }
]

export function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null)
  const [importingTemplate, setImportingTemplate] = useState<any | null>(null)

  const navigate = useNavigate()
  const { setNodes, setEdges } = useWorkflowStore()
  
  const filterRef = useRef<HTMLDivElement>(null)

  // Clicking outside to close filter
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [filterRef])

  const toggleFilter = (catId: string) => {
    setSelectedFilters(prev => 
      prev.includes(catId) 
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    )
  }

  const isFiltered = selectedFilters.length > 0
  
  // Apply visual filtering
  const visibleTemplates = TEMPLATES.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = !isFiltered || selectedFilters.includes(t.category)
    return matchesSearch && matchesFilter
  })

  // Format the label on the dropdown button
  let filterLabel = 'All'
  if (selectedFilters.length === 1) {
    const cat = CATEGORIES.find(c => c.id === selectedFilters[0])
    filterLabel = cat ? `${cat.id} (${cat.count})` : selectedFilters[0]
  } else if (selectedFilters.length > 1) {
    filterLabel = `${selectedFilters.length} selected`
  }

  const handleImport = (template: any) => {
    setPreviewTemplate(null)
    setImportingTemplate(template)
  }

  const finalizeImport = () => {
    // Navigate to canvas with prefilled nodes
    setNodes([
      { id: '1', type: 'trigger', position: { x: 300, y: 100 }, data: { label: 'Trigger Event', subtext: 'Trigger' } },
      { id: '2', type: 'step', position: { x: 300, y: 240 }, data: { label: 'List Message Categories', subtext: 'Microsoft Outlook', iconUrl: 'https://companieslogo.com/img/orig/MSFT-a203b22d.png?t=1' } },
      { id: '3', type: 'step', position: { x: 300, y: 380 }, data: { label: 'Filter Categories', subtext: 'Array Utils', iconUrl: 'https://companieslogo.com/img/orig/BAM.ST-7c603fd1.png?t=1' } },
      { id: '4', type: 'step', position: { x: 300, y: 520 }, data: { label: 'If All Categories Exist', subtext: 'Operator', iconBg: '#05c793', iconColor: '#000' } },
      { id: '5', type: 'step', position: { x: 120, y: 660 }, data: { label: 'Parallel Executions', subtext: 'Operator', iconBg: '#7e22ce', iconColor: '#fff' } }
    ] as any)
    setEdges([
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5', label: 'FALSE', labelStyle: { fill: '#9ca3af', fontSize: 10 } }
    ] as any)
    navigate('/canvas')
  }

  return (
    <div className="animate-fade-in" style={{ padding: '32px 40px', background: '#0e1015', minHeight: '100vh', position: 'relative' }}>
      
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#17191e', border: '1px solid #2a2e35', borderRadius: 6, padding: '7px 12px', width: 320 }}>
          <Search size={16} color="#9ca3af" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: '100%' }}
            placeholder="Search"
          />
        </div>
        <button style={{ background: 'transparent', border: '1px solid #2a2e35', borderRadius: 6, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', cursor: 'pointer' }}>
          <Filter size={16} />
        </button>
      </div>

      {/* ── Dropdowns Row ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        
        {/* Filter Dropdown */}
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            style={{
              background: 'transparent', border: '1px solid #2a2e35', borderRadius: 6, padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0', fontSize: 12, cursor: 'pointer',
              minWidth: 160, justifyContent: 'space-between'
            }}
          >
            <span><span style={{ color: '#9ca3af' }}>Filter by:</span> {filterLabel}</span>
            <ChevronDown size={14} color="#9ca3af" />
          </button>
          
          {filterOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 340, background: '#1c1e23',
              border: '1px solid #333842', borderRadius: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
              zIndex: 50, maxHeight: 400, overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #2a2e35' }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>All (293)</span>
                <ChevronDown size={14} color="#9ca3af" />
              </div>
              <div style={{ padding: '8px 0' }}>
                {CATEGORIES.map(cat => {
                  const active = selectedFilters.includes(cat.id)
                  return (
                    <label
                      key={cat.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', cursor: 'pointer',
                        background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                        transition: 'background .15s'
                      }}
                      onMouseEnter={e => { if(!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                      onMouseLeave={e => { if(!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{
                        width: 14, height: 14, border: `1px solid ${active ? '#fff' : '#4b5563'}`, borderRadius: 2,
                        background: active ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {active && <Check size={10} color="#000" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: 12, color: '#e2e8f0', userSelect: 'none' }}>{cat.id} ({cat.count})</span>
                      {/* Checkbox trigger hack since standard input visually differs */}
                      <input type="checkbox" checked={active} onChange={() => toggleFilter(cat.id)} style={{ display: 'none' }} />
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <button
          style={{
            background: 'transparent', border: '1px solid #2a2e35', borderRadius: 6, padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0', fontSize: 12, cursor: 'pointer',
          }}
        >
          <span><span style={{ color: '#9ca3af' }}>Sort By:</span> Name - Ascending</span>
          <ChevronDown size={14} color="#9ca3af" />
        </button>

      </div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24
      }}>
        {visibleTemplates.map(t => (
          <div key={t.id} style={{
            background: '#16191f', border: '1px solid #2a2e35', borderRadius: 8,
            padding: 24, display: 'flex', flexDirection: 'column', position: 'relative',
            transition: 'border-color .15s, box-shadow .15s', cursor: 'pointer'
          }}
          onClick={() => setPreviewTemplate(t)}
          onMouseEnter={e => { setHoveredCardId(t.id); e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { setHoveredCardId(null); e.currentTarget.style.borderColor = '#2a2e35'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: t.levelColor, marginBottom: 16 }}>
              {t.level}
            </div>
            
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f3f4f6', marginBottom: 16, lineHeight: 1.4, minHeight: 44 }}>
              {t.title}
            </div>
            
            <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>
              {t.desc}
            </div>

            {/* Workflow Action Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              {t.icons.map((iconUrl, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={iconUrl} alt="icon" style={{ width: 16, height: 16, objectFit: 'contain' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>
                  {i < t.icons.length - 1 && (
                    <span style={{ color: '#4b5563', fontWeight: 'bold' }}>→</span>
                  )}
                </div>
              ))}
            </div>

            {/* Tags footer */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 16, borderTop: '1px solid #2a2e35' }}>
              {t.tags.map((tag, i) => (
                <span key={i} style={{
                  background: tag.bg + '20', /* slight opacity hack assuming valid hex/color strings, Torq uses muted tones */
                  color: tag.color,
                  border: `1px solid ${tag.bg}40`,
                  padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600
                }}>
                  {tag.label}
                </span>
              ))}
            </div>

            {/* Hover Actions overlay */}
            {hoveredCardId === t.id && (
              <div 
                className="animate-fade-in"
                style={{ 
                  position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 8, zIndex: 5 
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleImport(t)}
                  style={{ background: 'transparent', border: '1px solid #4b5563', borderRadius: 6, color: '#e2e8f0', fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Download size={13} /> Import
                </button>
                <button
                  onClick={() => setPreviewTemplate(t)}
                  style={{ background: '#fff', border: 'none', borderRadius: 6, color: '#000', fontSize: 12, fontWeight: 600, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <Eye size={13} /> Open Preview
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Preview Modal ────────────────────────────────────── */}
      {previewTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-scale-in" style={{ width: 1080, height: 700, background: '#1c1e23', borderRadius: 12, border: '1px solid #333842', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a2e35' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                Templates <span style={{ color: previewTemplate.levelColor }}>{previewTemplate.level}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <button style={{ background: 'none', border: 'none', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <i className="fa-solid fa-link" /> Template Link
                </button>
                <button onClick={() => setPreviewTemplate(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={16} /></button>
              </div>
            </div>

            {/* Split Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left Side: Info */}
              <div style={{ flex: '0 0 520px', padding: 32, overflowY: 'auto' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
                  {previewTemplate.title}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  {previewTemplate.tags.map((tag: any, i: number) => (
                    <span key={i} style={{ background: tag.bg + '20', color: tag.color, border: `1px solid ${tag.bg}40`, padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      {tag.label}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6, marginBottom: 32 }}>
                  {previewTemplate.desc}
                </div>
                <button style={{ background: 'none', border: 'none', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 40 }}>
                  <PlayCircle size={16} /> Watch Tutorial
                </button>

                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Workflow Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {['Change the label to Scan-Started on new messages that are found.', 'Retrieve URLs, attachments and headers that are part of the message and scan with VirusTotal.', 'Use VirusTotal findings to append the suspicious or malicious data to return to the user.', 'Update email categories on the message in the folder with the resulting verdict.', 'Send a response message to the originator of the message when the scan is complete.'].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{i + 1}</div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{step}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 40, marginBottom: 16 }}>Nested workflows</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: '#fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-boxes-stacked" style={{ color: '#854d0e' }} /></div>
                  <div style={{ fontSize: 14, color: '#e2e8f0' }}>Analyze URLs in VirusTotal</div>
                </div>
              </div>

              {/* Right Side: Preview Minimap & Import Button */}
              <div style={{ flex: 1, background: '#0e1015', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #333842' }}>
                <div style={{ textAlign: 'center', width: 200, height: 400, opacity: 0.1, background: '#fff', borderRadius: 8 }}>
                  [Static Flow image graphic here]
                </div>
                {/* Zoom tools */}
                <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, color: '#9ca3af', fontSize: 14 }}>
                    <Search size={16} style={{ cursor: 'pointer' }} /> 40% <Search size={16} style={{ cursor: 'pointer' }} />
                  </div>
                  <button
                    onClick={() => handleImport(previewTemplate)}
                    style={{ padding: '12px 32px', borderRadius: 30, background: '#fff', border: 'none', color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 20px rgba(255,255,255,0.2)' }}
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ─────────────────────────────────────── */}
      {importingTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-scale-in" style={{ width: 660, background: '#1c1e23', borderRadius: 12, border: '1px solid #333842', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
            
            {/* Header */}
            <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a2e35' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 600, color: '#1db87a' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1db87a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} color="#fff" strokeWidth={3} /></div>
                Template imported successfully
              </div>
              <button onClick={() => setImportingTemplate(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            {/* Split layout inside import */}
            <div style={{ display: 'flex', padding: 32, gap: 40 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
                  Set the desired time for the workflow to run.
                </div>
                <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, marginBottom: 24 }}>
                  The workflow will be scheduled according to your specified setting. You can skip this step and set it up later.
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#252830', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={20} color="#9ca3af" />
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <button style={{ position: 'absolute', top: -16, right: 0, background: 'none', border: 'none', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <ArrowRight size={14} /> Replace Trigger
                </button>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Trigger every</div>
                  <div style={{ position: 'relative', width: 140, marginBottom: 20 }}>
                    <select style={{ width: '100%', appearance: 'none', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}>
                      <option>Day</option>
                    </select>
                    <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>At</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 60, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 13, textAlign: 'center' }}>9</div>
                    <span style={{ color: '#9ca3af', fontWeight: 'bold' }}>:</span>
                    <div style={{ width: 60, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 13, textAlign: 'center' }}>00</div>
                    <div style={{ width: 60, background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 13, textAlign: 'center' }}>AM</div>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Timezone</div>
                  <div style={{ position: 'relative' }}>
                    <select style={{ width: '100%', appearance: 'none', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}>
                      <option>America/New_York</option>
                    </select>
                    <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #2a2e35' }}>
              <button onClick={finalizeImport} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Skip</button>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Step 1 of 2</div>
              <button onClick={finalizeImport} style={{ padding: '8px 24px', borderRadius: 20, background: '#fff', border: 'none', color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Next</button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}

