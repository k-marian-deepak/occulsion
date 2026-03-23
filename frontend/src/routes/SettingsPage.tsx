import { useState } from 'react'
import { User, Key, Shield, Users, Building2, Cpu, IdCard, ChevronRight, Save, Copy, Plus, Check } from 'lucide-react'

// ─── Nav ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'profile',   label: 'Profile',        icon: <User size={13} />,      section: 'Account' },
  { id: 'apikeys',   label: 'API Keys',        icon: <Key size={13} />,       section: 'Account' },
  { id: 'security',  label: 'Security & 2FA',  icon: <Shield size={13} />,    section: 'Account' },
  { id: 'users',     label: 'Users & Roles',   icon: <Users size={13} />,     section: 'Workspace' },
  { id: 'org',       label: 'Organization',    icon: <Building2 size={13} />, section: 'Workspace' },
  { id: 'aicredits', label: 'AI Credits',      icon: <Cpu size={13} />,       section: 'Workspace' },
  { id: 'sso',       label: 'SSO / Auth',      icon: <IdCard size={13} />,    section: 'Workspace' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{ width: 36, height: 20, borderRadius: 20, background: on ? 'var(--accent)' : 'var(--bg5)', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s' }}
    >
      <div style={{ position: 'absolute', top: 2, left: on ? 'calc(100% - 18px)' : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
    </button>
  )
}

function SHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, color: 'var(--text)' }}>{title}</h2>
      <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6 }}>{sub}</p>
    </div>
  )
}

function SCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 11, padding: '18px 20px', marginBottom: 12 }}>
      {children}
    </div>
  )
}

function SRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', marginBottom: desc ? 2 : 0 }}>{label}</div>
        {desc && <div style={{ fontSize: 11.5, color: 'var(--text2)', lineHeight: 1.45, maxWidth: 380 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0, marginLeft: 24 }}>{children}</div>
    </div>
  )
}

function SInput({ placeholder, style }: { placeholder?: string; style?: React.CSSProperties }) {
  return (
    <input
      placeholder={placeholder}
      style={{
        background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6,
        padding: '7px 10px', fontSize: 12.5, color: 'var(--text)', outline: 'none',
        minWidth: 220, transition: 'border-color .12s', fontFamily: 'inherit', ...style,
      }}
      onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onBlur={e => e.currentTarget.style.borderColor = 'var(--border2)'}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const [page, setPage] = useState('profile')
  const sections = Array.from(new Set(NAV.map(n => n.section)))

  return (
    <div className="animate-fade-in" style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Left nav */}
      <div style={{ width: 196, borderRight: '1px solid var(--border)', padding: '14px 8px', flexShrink: 0, overflowY: 'auto' }}>
        {sections.map(section => (
          <div key={section} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text3)', padding: '0 8px 4px' }}>{section}</div>
            {NAV.filter(n => n.section === section).map(n => (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                id={`settings-nav-${n.id}`}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  borderRadius: 6, cursor: 'pointer', border: 'none', fontSize: 12.5,
                  transition: 'all .12s', textAlign: 'left',
                  background: page === n.id ? 'var(--aglow)' : 'transparent',
                  color: page === n.id ? 'var(--accent2)' : 'var(--text2)',
                  fontFamily: 'inherit',
                }}
              >
                {n.icon} {n.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {page === 'profile'   && <ProfilePage />}
        {page === 'apikeys'   && <ApiKeysPage />}
        {page === 'security'  && <SecurityPage />}
        {page === 'users'     && <UsersPage />}
        {page === 'org'       && <OrgPage />}
        {page === 'aicredits' && <CreditsPage />}
        {page === 'sso'       && <SSOPage />}
      </div>
    </div>
  )
}

// ─── Sub-pages ────────────────────────────────────────────────────────────

function ProfilePage() {
  const [widget, setWidget] = useState(true)
  return (
    <div>
      <SHead title="Personal Settings" sub="Update your profile, avatar, display theme, and community identity." />
      <SCard>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>User Profile</div>
        <SRow label="Full name" desc="Displayed in cases and activity logs">
          <SInput placeholder="Your full name" />
        </SRow>
        <SRow label="Community username" desc="2–50 chars. Shown in community. Re-login to apply.">
          <SInput placeholder="username" />
        </SRow>
        <SRow label="Email address" desc="Used for notifications and 2FA reset">
          <SInput placeholder="you@example.com" />
        </SRow>
        <SRow label="Avatar" desc="Upload image (max 1 MB).">
          <button className="btn btn-ghost"><i className="fa-solid fa-arrow-up-from-bracket" style={{ marginRight: 5 }} />Upload</button>
        </SRow>
        <SRow label="Display theme" desc="Light, Dark, or System (follows OS)">
          <select style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, color: 'var(--text)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option>Dark</option><option>Light</option><option>System</option>
          </select>
        </SRow>
        <SRow label="Knowledge Hub widget" desc="Show or hide the help widget">
          <Toggle on={widget} onChange={setWidget} />
        </SRow>
      </SCard>
      <button className="btn btn-primary"><Save size={13} /> Save Changes</button>
    </div>
  )
}

function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false)
  return (
    <div>
      <SHead title="API Keys" sub="Generate client ID + secret pairs to authenticate programmatic access. Bearer tokens are valid for 3,600 seconds." />
      <SCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={13} style={{ color: 'var(--text2)' }} /> Active API Keys
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={13} /> Create API Key</button>
        </div>
        {/* Table head */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)' }}>
              {['Name', 'Type', 'Client ID', 'Expiry', 'Role', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={6} style={{ padding: '40px 12px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No API keys yet</td></tr>
          </tbody>
        </table>
      </SCard>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 11, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Key size={15} style={{ color: 'var(--accent2)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Create API Key</h3>
              <button onClick={() => setShowCreate(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>Key name</label>
                <SInput placeholder="e.g. my-integration-key" style={{ width: '100%' }} />
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Use a descriptive name that identifies the key's purpose</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>Expiry</label>
                <select style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '8px 11px', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}>
                  <option>30 days</option><option>90 days</option><option>1 year</option><option>Custom date…</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary"><Key size={13} /> Generate Key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SecurityPage() {
  const [enforce2fa, setEnforce2fa] = useState(false)
  return (
    <div>
      <SHead title="Security & Two-Factor Authentication" sub="2FA applies to email/password logins only. SSO and OAuth sign-on users are not prompted for 2FA." />
      <SCard>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Two-Factor Authentication</div>
        <SRow label="Enforce 2FA workspace-wide" desc="All email/password users must set up 2FA on next login">
          <Toggle on={enforce2fa} onChange={setEnforce2fa} />
        </SRow>
        <SRow label="Reset a user's 2FA" desc="Owners can reset 2FA for any member from Users & Roles">
          <button className="btn btn-ghost" style={{ fontSize: 12 }}><ChevronRight size={12} /> Go to Users</button>
        </SRow>
      </SCard>
      <SCard>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Session & Timeout</div>
        <SRow label="Inactivity timeout" desc="Automatically sign out after a period of inactivity">
          <select style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, color: 'var(--text)', outline: 'none', minWidth: 160, fontFamily: 'inherit' }}>
            <option>30 minutes</option><option>1 hour</option><option>4 hours</option><option>Never</option>
          </select>
        </SRow>
        <SRow label="Session expiration" desc="Maximum session duration regardless of activity">
          <select style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, color: 'var(--text)', outline: 'none', minWidth: 160, fontFamily: 'inherit' }}>
            <option>24 hours</option><option>7 days</option><option>30 days</option>
          </select>
        </SRow>
      </SCard>
      <button className="btn btn-primary"><Save size={13} /> Save</button>
    </div>
  )
}

function UsersPage() {
  return (
    <div>
      <SHead title="Users & Roles" sub="RBAC is workspace-specific. Users can have different roles across workspaces." />
      <SCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Workspace Members</div>
          <button className="btn btn-primary"><Plus size={13} /> Invite User</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)' }}>
              {['User', 'Email', 'Role', '2FA', 'Last active', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={6} style={{ padding: '40px 12px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No members yet — invite your team</td></tr>
          </tbody>
        </table>
      </SCard>

      {/* Roles reference */}
      <SCard>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Available Roles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 10 }}>
          {[
            { name: 'Viewer',         desc: 'View workflows, integrations, variables, and insights. Can submit Interact forms.' },
            { name: 'Operator',       desc: 'Viewer + trigger workflow executions and run individual steps.' },
            { name: 'Creator',        desc: 'Operator + create and modify workflows, integrations, and variables.' },
            { name: 'Contributor',    desc: 'Creator + publish workflows and create/update cases and secrets.' },
            { name: 'Owner',          desc: 'Contributor + manage users, SSO, audit logs, and workspace settings.' },
            { name: 'Cases Analyst',  desc: 'Access only the Cases page. Create, update, and close cases.' },
          ].map(r => (
            <div key={r.name} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{r.name}</div>
              <p style={{ fontSize: 11.5, color: 'var(--text2)', lineHeight: 1.55 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </SCard>
    </div>
  )
}

function OrgPage() {
  return (
    <div>
      <SHead title="Organization Management" sub="Organization Managers see all workspaces, key metrics, AI usage, and owner lists without requiring workspace membership." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {['Total Workspaces', 'Total Workflows', 'Workflow Editors', 'Monthly AI Credits'].map(label => (
          <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 11, padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>{label}</div>
            <div className="skeleton" style={{ height: 26, width: 50, borderRadius: 5 }} />
          </div>
        ))}
      </div>
      <SCard>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Workspace Overview</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)' }}>
              {['Workspace', 'Plan', 'Workflows', 'AI Credits', 'Owners'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} style={{ padding: '40px 12px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No workspaces to display</td></tr>
          </tbody>
        </table>
      </SCard>
    </div>
  )
}

const CREDIT_TIERS = [
  { name: 'Dev',      val: '500' },
  { name: 'Essential',val: '2,000' },
  { name: 'Pro',      val: '5,000' },
  { name: 'Elite',    val: '10,000' },
  { name: 'Elite+',   val: '20,000' },
]

const CREDIT_USAGE = [
  { name: 'Socrates — Autonomous',   desc: 'Full case analysis and resolution',     credits: 12 },
  { name: 'Socrates — Conversation', desc: 'Chat-based investigation assistance',   credits: 8  },
  { name: 'AI Agent Execution',      desc: 'Requires reasoning or data analysis',   credits: 6  },
  { name: 'AI Task Execution',       desc: 'Standard single LLM operation',         credits: 1  },
]

function CreditsPage() {
  return (
    <div>
      <SHead title="AI Credits" sub="Unified AI Credits power Socrates, AI Agents, and AI Tasks. Credits reset monthly and do not roll over." />
      <SCard>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Monthly Allocation by Tier</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
          {CREDIT_TIERS.map(t => (
            <div key={t.name} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent2)', letterSpacing: '-0.02em' }}>{t.val}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>credits/mo</div>
            </div>
          ))}
        </div>
      </SCard>
      <SCard>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Credit Cost per Activity</div>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>One execution = one known credit cost, regardless of token count or model duration.</p>
        {CREDIT_USAGE.map((c, i) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < CREDIT_USAGE.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{c.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 2 }}>{c.desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{c.credits}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>credits</div>
            </div>
          </div>
        ))}
      </SCard>
    </div>
  )
}

function SSOPage() {
  return (
    <div>
      <SHead title="Single Sign-On" sub="Configure SAML 2.0 or OIDC with your identity provider for centralized authentication." />
      <SCard>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>SSO Providers</div>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>SSO users are not prompted for 2FA. SSO configuration is workspace-specific.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            ['Okta SAML 2.0',       'App Catalog or Manual'],
            ['Okta OpenID Connect', 'OIDC protocol'],
            ['Microsoft Entra ID',  'Formerly Azure AD'],
            ['OneLogin SAML',       'SAML 2.0'],
            ['Google Workspace',    'OAuth 2.0 / OIDC'],
            ['Generic SAML / OIDC', 'Any identity provider'],
          ].map(([name, sub]) => (
            <div
              key={name}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 12px', cursor: 'pointer', transition: 'border-color .12s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </SCard>
    </div>
  )
}
