import { create } from 'zustand'

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type CaseStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface Case {
  id: string
  title: string
  severity: Severity
  status: CaseStatus
  assignee_id: string | null
  workspace_id: string
  created_at: string
  resolved_at: string | null
}

interface CaseStore {
  selectedCase: Case | null
  filterSeverity: Severity | null
  filterStatus: CaseStatus | null
  selectCase: (c: Case | null) => void
  setFilterSeverity: (s: Severity | null) => void
  setFilterStatus: (s: CaseStatus | null) => void
}

export const useCaseStore = create<CaseStore>((set) => ({
  selectedCase: null,
  filterSeverity: null,
  filterStatus: null,
  selectCase: (c) => set({ selectedCase: c }),
  setFilterSeverity: (s) => set({ filterSeverity: s }),
  setFilterStatus: (s) => set({ filterStatus: s }),
}))
