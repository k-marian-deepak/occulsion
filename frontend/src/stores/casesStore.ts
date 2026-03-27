// casesStore.ts - Zustand store for managing board cases and their states

import { create } from 'zustand'

export type BoardCaseState = 'new' | 'in_progress' | 'on_hold' | 'resolved' | 'closed'
export type BoardCaseSeverity = 'high' | 'medium' | 'low' | 'critical'

export type BoardCase = {
  id: string
  state: BoardCaseState
  number: number
  category: string
  title: string
  timeText: string
  tags: string[]
  assigneeImg: string
  severity: BoardCaseSeverity
}

const MOCK_CASES: BoardCase[] = [
  { id: 'c1', state: 'new', number: 664, category: 'Identity & Access Man...', title: 'User tried to login from new location with a failed MFA -', timeText: '9h 19m | 2w', tags: ['Malicious IP'], assigneeImg: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', severity: 'high' },
  { id: 'c2', state: 'new', number: 653, category: 'Email Security', title: 'Phishing Alert: Email to user... Title: "Your package is ready, needs to be released from customs."', timeText: '2d 6h | 2w', tags: ['Malicious I...', '+2'], assigneeImg: 'https://api.dicebear.com/7.x/identicon/svg?seed=12', severity: 'critical' },
  { id: 'c3', state: 'new', number: 666, category: 'Email Security', title: 'Phishing Alert: Email to user...', timeText: '8h 54m | 2w', tags: [], assigneeImg: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', severity: 'medium' },
  { id: 'c4', state: 'in_progress', number: 667, category: 'Email Security', title: 'Phishing Alert: Email to bob@comp.com, Title: "Your package is ready, needs to be released from customs."', timeText: '2h 49m | 2w', tags: ['Phishing'], assigneeImg: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', severity: 'high' },
  { id: 'c5', state: 'on_hold', number: 521, category: 'Endpoint Detection and...', title: 'Suspicious Process Behavior on leonid-il-win', timeText: '-13w 1d | 1d', tags: ['phishing', '+4'], assigneeImg: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave', severity: 'critical' },
  { id: 'c6', state: 'resolved', number: 658, category: 'Identity & Access Man...', title: 'User connected from two geographically remote IP locations in a short time period -', timeText: '13h 12m | 1d', tags: [], assigneeImg: 'https://api.dicebear.com/7.x/identicon/svg?seed=22', severity: 'low' },
  { id: 'c7', state: 'closed', number: 616, category: 'Identity & Access Man...', title: 'User tried to login from new location with a failed MFA -', timeText: '3w 2d | 508w 2d', tags: [], assigneeImg: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve', severity: 'low' },
]

interface CasesStore {
  cases: BoardCase[]
  addCase: (c: BoardCase) => void
  updateCaseState: (id: string, newState: BoardCaseState) => void
}

export const useCasesStore = create<CasesStore>((set) => ({
  cases: MOCK_CASES,
  addCase: (c) => set((state) => ({ cases: [c, ...state.cases] })),
  updateCaseState: (id, newState) => set((state) => ({
    cases: state.cases.map(c => c.id === id ? { ...c, state: newState } : c)
  }))
}))
