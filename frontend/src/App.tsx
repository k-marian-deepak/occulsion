import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { WorkflowsPage } from '@/routes/WorkflowsPage'
import { CanvasPage } from '@/routes/CanvasPage'
import { CasesPage } from '@/routes/CasesPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { IntegrationsPage } from '@/routes/IntegrationsPage'
import { InsightsPage } from '@/routes/InsightsPage'
import { ActivityPage } from '@/routes/ActivityPage'
import { SettingsPage } from '@/routes/SettingsPage'

function AppLayout({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content" style={noPad ? { padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } : undefined}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/workflows" replace />} />
            <Route path="/dashboards" element={<AppLayout><DashboardPage /></AppLayout>} />
            <Route path="/workflows"   element={<AppLayout><WorkflowsPage /></AppLayout>} />
            <Route path="/canvas"      element={<AppLayout><CanvasPage /></AppLayout>} />
            <Route path="/cases"       element={<AppLayout><CasesPage /></AppLayout>} />
            <Route path="/integrations"element={<AppLayout><IntegrationsPage /></AppLayout>} />
            <Route path="/insights"    element={<AppLayout><InsightsPage /></AppLayout>} />
            <Route path="/activity"    element={<AppLayout><ActivityPage /></AppLayout>} />
            <Route path="/settings"    element={<AppLayout noPad><SettingsPage /></AppLayout>} />
            {/* Remaining stubs */}
            {['/variables', '/templates', '/changelog', '/help'].map(p => (
              <Route key={p} path={p} element={
                <AppLayout>
                  <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 36 }}>🚧</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Coming soon</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>This page is under construction.</div>
                  </div>
                </AppLayout>
              } />
            ))}
          </Routes>
        </BrowserRouter>
      </QueryProvider>
    </ThemeProvider>
  )
}
