import { create } from 'zustand'
import type { Loan } from '@/types/auth'

export interface LoansFilters {
  clientId?: string
  clientName?: string // Búsqueda parcial por nombre de cliente
  paymentFrequency?: string
  loanStatus?: 'ACTIVE' | 'COMPLETED' | 'ALL' // Mapeado al backend: ACTIVE (ACTIVE/APPROVED), COMPLETED, ALL
}

export interface CobrosFilters {
  status?: 'OVERDUE' | 'TODAY' | 'SOON' | 'UPCOMING' | 'NOTIFIED' | 'ALL'
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'ALL'
  clientId?: string
}

export interface LoansPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface FiltersStore {
  // Loans filters
  loansFilters: LoansFilters
  setLoansFilters: (filters: LoansFilters) => void
  clearLoansFilters: () => void

  // Loans filter results (shared across hook instances)
  filteredLoans: Loan[]
  loansFilterPagination: LoansPagination
  loansFilterLoading: boolean
  loansFilterError: string | null
  setFilteredLoans: (loans: Loan[]) => void
  setLoansFilterPagination: (pagination: LoansPagination) => void
  setLoansFilterLoading: (loading: boolean) => void
  setLoansFilterError: (error: string | null) => void

  // Cobros filters
  cobrosFilters: CobrosFilters
  setCobrosFilters: (filters: CobrosFilters) => void
  clearCobrosFilters: () => void

  // Client notification status
  notifiedClients: Set<string>
  markClientAsNotified: (clientId: string) => void
  markClientAsPending: (clientId: string) => void
  isClientNotified: (clientId: string) => boolean
  clearAllFilters: () => void
}

export const useFiltersStore = create<FiltersStore>((set, get) => ({
  // Loans filters
  loansFilters: {},
  setLoansFilters: (filters: LoansFilters) =>
    set({ loansFilters: filters }),
  clearLoansFilters: () =>
    set({ loansFilters: {} }),

  // Loans filter results
  filteredLoans: [],
  loansFilterPagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
  loansFilterLoading: false,
  loansFilterError: null,
  setFilteredLoans: (loans) => set({ filteredLoans: loans }),
  setLoansFilterPagination: (pagination) => set({ loansFilterPagination: pagination }),
  setLoansFilterLoading: (loading) => set({ loansFilterLoading: loading }),
  setLoansFilterError: (error) => set({ loansFilterError: error }),
  
  // Cobros filters  
  cobrosFilters: { status: 'ALL' },
  setCobrosFilters: (filters: CobrosFilters) => 
    set({ cobrosFilters: filters }),
  clearCobrosFilters: () => 
    set({ cobrosFilters: {} }),
    
  // Client notification status
  notifiedClients: new Set<string>(),
  markClientAsNotified: (clientId: string) => 
    set((state) => ({
      notifiedClients: new Set([...state.notifiedClients, clientId])
    })),
  markClientAsPending: (clientId: string) =>
    set((state) => {
      const newNotified = new Set(state.notifiedClients);
      newNotified.delete(clientId);
      return { notifiedClients: newNotified };
    }),
  isClientNotified: (clientId: string) =>
    get().notifiedClients.has(clientId),
  
  clearAllFilters: () =>
    set({
      loansFilters: {},
      filteredLoans: [],
      loansFilterPagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      loansFilterLoading: false,
      loansFilterError: null,
      cobrosFilters: { status: 'ALL' },
      notifiedClients: new Set<string>()
    })
}))