import { useNavigate } from 'react-router-dom'
import { Search, Plus, GitBranch, Download, X, Sparkles, Trash2, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useWorkflowStore } from '@/stores/workflowStore'

export function WorkflowsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [cat, setCat] = useState('all')
  const [showAIModal, setShowAIModal] = useState(false)

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Workflows</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Build, version-control, and automate your SOC playbooks</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost"><Download size={13} /> Import</button>
          <button className="btn btn-primary" style={{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)' }} onClick={() => navigate('/canvas')}>
            <Plus size={13} /> New blank workflow
          </button>
          <button className="btn btn-primary" onClick={() => setShowAIModal(true)} style={{ background: '#7b40f0', color: '#fff', border: 'none' }}>
            <Sparkles size={13} /> Generate with AI
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[
          { v: 'all', l: 'All', count: 0 },
          { v: 'published', l: 'Published', count: 0 },
          { v: 'testing', l: 'Testing', count: 0 },
          { v: 'drafts', l: 'Drafts', count: 0 },
        ].map(t => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12.5, border: 'none', cursor: 'pointer',
              background: tab === t.v ? 'var(--bg4)' : 'transparent',
              color: tab === t.v ? 'var(--text)' : 'var(--text2)',
              fontWeight: tab === t.v ? 500 : 400,
              transition: 'all .12s',
            }}
          >
            {t.l}
            <span style={{ fontSize: 10, fontFamily: 'monospace', marginLeft: 5, opacity: 0.5 }}>0</span>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 11px', flex: '0 0 240px' }}>
          <Search size={12} color="var(--text3)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 12.5, width: '100%' }}
            placeholder="Search workflows…"
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><X size={11} /></button>}
        </div>
        {['All types', 'Phishing', 'Identity', 'Malware', 'Cloud'].map(c => (
          <button
            key={c}
            onClick={() => setCat(c === 'All types' ? 'all' : c)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer',
              border: `1px solid ${(c === 'All types' ? 'all' : c) === cat ? 'var(--accent)' : 'var(--border)'}`,
              background: (c === 'All types' ? 'all' : c) === cat ? 'var(--aglow)' : 'var(--bg3)',
              color: (c === 'All types' ? 'all' : c) === cat ? 'var(--accent2)' : 'var(--text2)',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 340, gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--aglow)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GitBranch size={22} color="var(--accent2)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No workflows yet</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 320 }}>
            Create your first workflow to start automating SOC playbooks, alert triage, and response actions.
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAIModal(true)} style={{ background: '#7b40f0', border: 'none' }}>
          <Sparkles size={13} /> Generate with AI
        </button>
      </div>

      {showAIModal && <AIModal onClose={() => setShowAIModal(false)} />}
    </div>
  )
}

function AIModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'prompt' | 'generating' | 'preview' | 'setup'>('prompt')
  const [prompt, setPrompt] = useState('Check IP Address 8.8.8.8 with VirusTotal and if the malicious score is higher than 3 do the following:\n1. Open a Jira ticket\n2. Send a Slack notification to #alerts channel')
  const navigate = useNavigate()
  const { setNodes, setEdges } = useWorkflowStore()

  const handleGenerate = () => {
    setStep('generating')
    setTimeout(() => {
      setStep('preview')
    }, 2000)
  }

  const handleCreate = () => {
    setStep('setup')
  }

  const handleFinish = () => {
    // Inject nodes into canvas and navigate
    const centerX = 300
    setNodes([
      { id: '1', type: 'trigger', position: { x: centerX, y: 50 }, data: { label: 'On-demand', subtext: 'Trigger' } },
      { id: '2', type: 'step', position: { x: centerX, y: 190 }, data: { subtext: 'Parameters Utils', label: 'Workflow Parameters', iconUrl: 'https://companieslogo.com/img/orig/BAM.ST-7c603fd1.png?t=1' } },
      { id: '3', type: 'step', position: { x: centerX, y: 330 }, data: { subtext: 'VirusTotal', label: 'Check IP with VirusTotal', iconUrl: 'https://companieslogo.com/img/orig/VirusTotal-icon.png?t=1' } },
      { id: '4', type: 'step', position: { x: centerX, y: 470 }, data: { subtext: 'Operator', label: 'If', iconBg: '#05c793', iconColor: '#000' } },
      { id: '5', type: 'step', position: { x: centerX + 180, y: 610 }, data: { subtext: 'Jira', label: 'Create JIRA Ticket', iconUrl: 'https://companieslogo.com/img/orig/TEAM-b4b39a3f.png?t=1720244494' } },
      { id: '6', type: 'step', position: { x: centerX - 180, y: 610 }, data: { subtext: 'Slack', label: 'Send Slack Notification', iconUrl: 'https://companieslogo.com/img/orig/WORK-2ac3a5e8.png?t=1720244494' } }
    ] as any)
    setEdges([
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5', label: 'TRUE', style: { stroke: '#4b5563' }, labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 700 } },
      { id: 'e4-6', source: '4', target: '6', label: 'FALSE', style: { stroke: '#4b5563' }, labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 700 } }
    ] as any)
    navigate('/canvas')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#1f2229', border: '1px solid #333842', borderRadius: 12,
        width: 1060, height: 600, display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333842' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: '#fff' }}>
            {step === 'setup' ? 'Workflow Setup' : <><Sparkles size={16} color="#c084fc" /> Generate with AI</>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {step !== 'setup' ? (
          <div style={{ display: 'flex', flex: 1, padding: 24, gap: 24, background: '#17191e' }}>
            {/* Left Prompt Area */}
            <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Prompt</span>
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}><i className="fa-solid fa-clock-rotate-left"></i> History</span>
              </div>
              
              <div style={{ flex: 1, background: '#1c1e23', border: '1px solid #333842', borderRadius: 8, display: 'flex', flexDirection: 'column', padding: 16 }}>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#e2e8f0', fontSize: 13, lineHeight: '1.6', resize: 'none', fontFamily: 'inherit'
                  }}
                  readOnly={step !== 'prompt'}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={step !== 'prompt'}
                    style={{
                      background: '#7b40f0', color: '#fff', border: 'none', borderRadius: 20,
                      padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: step === 'prompt' ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', gap: 6, opacity: step !== 'prompt' ? 0.5 : 1
                    }}
                  >
                    <Sparkles size={14} /> Generate
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 12, fontStyle: 'italic' }}>Workflows generated by AI should be checked and validated.</div>
            </div>

            {/* Right Preview Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Preview</span>
                <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={14} /></button>
              </div>

              <div style={{ flex: 1, background: '#1c1e23', border: '1px solid #333842', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                {step === 'prompt' && (
                  <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.3 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 120, height: 40, border: '2px dashed #9ca3af', borderRadius: 6 }} />
                      <div style={{ width: 2, height: 20, background: '#9ca3af', borderStyle: 'dashed' }} />
                      <div style={{ display: 'flex', gap: 20 }}>
                        <div style={{ width: 120, height: 40, border: '2px dashed #9ca3af', borderRadius: 6 }} />
                        <div style={{ width: 120, height: 40, border: '2px dashed #9ca3af', borderRadius: 6 }} />
                      </div>
                    </div>
                  </div>
                )}
                
                {step === 'generating' && (
                  <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: 0.5, animation: 'pulse 2s infinite' }}>
                       <div style={{ width: 140, height: 44, border: '2px solid #9ca3af', borderRadius: 6 }} />
                       <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                         <div style={{ width: 140, height: 44, border: '2px solid #9ca3af', borderRadius: 6 }} />
                         <div style={{ width: 140, height: 44, border: '2px solid #9ca3af', borderRadius: 6 }} />
                       </div>
                    </div>
                    <div style={{ marginTop: 40, fontSize: 13, color: '#fff', fontStyle: 'italic' }}>Processing your request...</div>
                  </div>
                )}

                {step === 'preview' && (
                  <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, overflowY: 'auto', height: '100%' }}>
                    {/* Fake Nodes */}
                    <div style={{ background: '#0e1015', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, width: 240 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-bolt" style={{ color: '#000' }} /></div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Trigger</div>
                        <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>On-demand</div>
                      </div>
                    </div>
                    
                    <div style={{ background: '#0e1015', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, width: 240 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://companieslogo.com/img/orig/TEAM-b4b39a3f.png?t=1" style={{ width: 14 }} /></div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Jira</div>
                        <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>Create JIRA Ticket</div>
                      </div>
                    </div>

                    <div style={{ background: '#0e1015', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, width: 240 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://companieslogo.com/img/orig/WORK-2ac3a5e8.png?t=1" style={{ width: 14 }} /></div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Slack</div>
                        <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>Send Slack Notification</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {step === 'preview' && (
                  <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 10 }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 20, background: 'transparent', border: '1px solid #4b5563', color: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleCreate} style={{ padding: '8px 16px', borderRadius: 20, background: '#e5e7eb', border: 'none', color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Create Workflow</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flex: 1, padding: 40, gap: 60, background: '#1c1e23' }}>
            {/* Setup Left */}
            <div style={{ flex: '0 0 340px' }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>Set the workflow's parameters</div>
              <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, marginBottom: 24 }}>This will fill in all relevant fields in this workflow. You can edit these parameters any time.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, background: '#2d3340', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-bolt" style={{ color: '#9ca3af', fontSize: 20 }} /></div>
                <i className="fa-solid fa-arrow-right" style={{ color: '#6b7280' }} />
                <div style={{ width: 44, height: 44, background: '#2d3340', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-code-branch" style={{ color: '#9ca3af', fontSize: 20 }} /></div>
              </div>
            </div>

            {/* Setup Right */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { label: 'Jira integration', icon: 'https://companieslogo.com/img/orig/TEAM-b4b39a3f.png?t=1' },
                { label: 'Slack integration', icon: 'https://companieslogo.com/img/orig/WORK-2ac3a5e8.png?t=1' },
                { label: 'Virustotal integration', icon: 'https://companieslogo.com/img/orig/VirusTotal-icon.png?t=1' }
              ].map(int => (
                <div key={int.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <img src={int.icon} style={{ width: 14, height: 14 }} alt="" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{int.label}</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <select style={{ width: '100%', appearance: 'none', background: '#17191e', border: '1px solid #333842', borderRadius: 6, padding: '10px 14px', color: '#9ca3af', fontSize: 13, outline: 'none' }}>
                      <option>Select integration</option>
                      <option>Production {int.label.split(' ')[0]}</option>
                    </select>
                    <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 14, top: 12, pointerEvents: 'none' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
              <button style={{ background: 'none', border: 'none', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}><i className="fa-solid fa-play" /> Test Run</button>
              <button onClick={handleFinish} style={{ padding: '10px 32px', borderRadius: 24, background: '#fff', border: 'none', color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
