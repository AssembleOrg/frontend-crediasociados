import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import type { SubLoanResponseDto } from '@/types/export'

interface SubLoanStats {
  totalDueToday: number
  pendingCount: number
  overdueCount: number
  paidCount: number
  totalAmount: number
}

interface SubLoansState {
  todayDueSubLoans: SubLoanResponseDto[]
  allSubLoans: SubLoanResponseDto[] // Para cobros - todos los subloans
  allSubLoansWithClient: SubLoanWithClientInfo[] // Para cobros - todos los subloans con info del cliente
  stats: SubLoanStats | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface SubLoansStore extends SubLoansState {
  setTodayDueSubLoans: (subLoans: SubLoanResponseDto[]) => void
  setAllSubLoans: (subLoans: SubLoanResponseDto[]) => void
  setAllSubLoansWithClient: (subLoans: SubLoanWithClientInfo[]) => void
  setStats: (stats: SubLoanStats) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPagination: (pagination: SubLoansState['pagination']) => void
  reset: () => void
  
  getTotalDueToday: () => number
  getOverdueCount: () => number
  getPendingCount: () => number
  getPaidCount: () => number
  getTotalAmount: () => number
}

const initialState: SubLoansState = {
  todayDueSubLoans: [],
  allSubLoans: [],
  allSubLoansWithClient: [],
  stats: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  }
}

export const useSubLoansStore = create<SubLoansStore>()(
  immer((set, get) => ({
    ...initialState,

    setTodayDueSubLoans: (subLoans: SubLoanResponseDto[]) => {
      set((state) => {
        state.todayDueSubLoans = subLoans
        state.error = null
      })
    },

    setAllSubLoans: (subLoans: SubLoanResponseDto[]) => {
      set((state) => {
        state.allSubLoans = subLoans
        state.error = null
      })
    },

    setAllSubLoansWithClient: (subLoans: SubLoanWithClientInfo[]) => {
      set((state) => {
        state.allSubLoansWithClient = subLoans
        state.error = null
      })
    },

    setStats: (stats: SubLoanStats) => {
      set((state) => {
        state.stats = stats
        state.error = null
      })
    },

    setLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading
      })
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error
        state.isLoading = false
      })
    },

    setPagination: (pagination: SubLoansState['pagination']) => {
      set((state) => {
        state.pagination = pagination
      })
    },

    reset: () => {
      set(initialState)
    },

    getTotalDueToday: () => {
      const stats = get().stats
      return stats?.totalDueToday || get().todayDueSubLoans.length
    },

    getOverdueCount: () => {
      const stats = get().stats
      if (stats) return stats.overdueCount
      return get().todayDueSubLoans.filter(subloan => subloan.status === 'OVERDUE').length
    },

    getPendingCount: () => {
      const stats = get().stats
      if (stats) return stats.pendingCount
      return get().todayDueSubLoans.filter(subloan => subloan.status === 'PENDING').length
    },

    getPaidCount: () => {
      const stats = get().stats
      if (stats) return stats.paidCount
      return get().todayDueSubLoans.filter(subloan => subloan.status === 'PAID').length
    },

    getTotalAmount: () => {
      const stats = get().stats
      if (stats) return stats.totalAmount
      return get().todayDueSubLoans.reduce((sum, subloan) => sum + (subloan.totalAmount ?? subloan.amount ?? 0), 0)
    },
  }))
)