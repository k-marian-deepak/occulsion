import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { WorkflowsPage } from '@/routes/WorkflowsPage'
import { CanvasPage } from '@/routes/CanvasPage'
import { CasesPage } from '@/routes/CasesPage'
import { DashboardPage } from '@/routes/DashboardPage'

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content">{children}</div>
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
            <Route path="/" element={<Navigate to="/dashboards" replace />} />
            <Route path="/dashboards" element={
              <AppLayout><DashboardPage /></AppLayout>
            } />
            <Route path="/workflows" element={
              <AppLayout><WorkflowsPage /></AppLayout>
            } />
            <Route path="/canvas" element={
              <AppLayout><CanvasPage /></AppLayout>
            } />
            <Route path="/cases" element={
              <AppLayout><CasesPage /></AppLayout>
            } />
            {/* Placeholder routes */}
            {['/integrations','/variables','/templates','/activity','/insights','/settings','/changelog','/help'].map(p => (
              <Route key={p} path={p} element={
                <AppLayout>
                  <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 40 }}>🚧</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Coming soon</div>
                    <div style={{ fontSize: 14, color: 'var(--text2)' }}>This page is under construction.</div>
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
