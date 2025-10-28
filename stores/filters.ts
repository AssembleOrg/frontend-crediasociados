import { create } from 'zustand'

export interface LoansFilters {
  clientId?: string
  paymentFrequency?: string
  loanStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'ALL'
}

export interface CobrosFilters {
  status?: 'OVERDUE' | 'TODAY' | 'SOON' | 'UPCOMING' | 'NOTIFIED' | 'ALL'
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'ALL'
  clientId?: string
}

interface FiltersStore {
  // Loans filters
  loansFilters: LoansFilters
  setLoansFilters: (filters: LoansFilters) => void
  clearLoansFilters: () => void
  
  // Cobros filters
  cobrosFilters: CobrosFilters
  setCobrosFilters: (filters: CobrosFilters) => void
  clearCobrosFilters: () => void
  
  // Client notification status
  notifiedClients: Set<string>
  markClientAsNotified: (clientId: string) => void
  markClientAsPending: (clientId: string) => void
  isClientNotified: (clientId: string) => boolean
}

export const useFiltersStore = create<FiltersStore>((set, get) => ({
  // Loans filters
  loansFilters: {},
  setLoansFilters: (filters: LoansFilters) => 
    set({ loansFilters: filters }),
  clearLoansFilters: () => 
    set({ loansFilters: {} }),
  
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
    get().notifiedClients.has(clientId)
}))