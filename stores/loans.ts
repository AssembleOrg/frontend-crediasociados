import { create } from 'zustand'
import type { Loan } from '@/types/auth'

interface LoansStore {
  // State
  loans: Loan[]
  isLoading: boolean
  error: string | null

  // Synchronous setters only - "MUDO" store
  setLoans: (loans: Loan[]) => void
  addLoan: (loan: Loan) => void
  updateLoan: (id: string, updatedLoan: Partial<Loan>) => void
  removeLoan: (id: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void

  // Computed values (selectors)
  getTotalLoans: () => number
  getActiveLoansByStatus: () => Loan[]
  getLoanById: (id: string) => Loan | undefined
  getLoansByClient: (clientId: string) => Loan[]
  getLoanByTrack: (loanTrack: string) => Loan | undefined
  getFilteredLoans: (filter?: {
    status?: string
    clientId?: string
    currency?: string
    paymentFrequency?: string
  }) => Loan[]
}

const initialState = {
  loans: [],
  isLoading: false,
  error: null,
}

export const useLoansStore = create<LoansStore>((set, get) => ({
  ...initialState,

  // Synchronous setters - "MUDO" store pattern
  setLoans: (loans) => set({ loans, error: null }),
  
  addLoan: (loan) => set((state) => ({ 
    loans: [...state.loans, loan],
    error: null 
  })),
  
  updateLoan: (id, updatedLoan) => set((state) => ({
    loans: state.loans.map(loan => 
      loan.id === id ? { ...loan, ...updatedLoan } : loan
    ),
    error: null
  })),
  
  removeLoan: (id) => set((state) => ({
    loans: state.loans.filter(loan => loan.id !== id),
    error: null
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  reset: () => set(initialState),

  // Computed values (getters)
  getTotalLoans: () => get().loans.length,
  
  getActiveLoansByStatus: () => get().loans.filter(loan => 
    loan.status === 'ACTIVE' || loan.status === 'APPROVED'
  ),
  
  getLoanById: (id) => get().loans.find(loan => loan.id === id),
  
  getLoansByClient: (clientId) => get().loans.filter(loan => 
    loan.clientId === clientId
  ),
  
  getLoanByTrack: (loanTrack) => get().loans.find(loan => 
    loan.loanTrack === loanTrack
  ),
  
  getFilteredLoans: (filter = {}) => {
    const loans = get().loans
    
    return loans.filter(loan => {
      if (filter.status && loan.status !== filter.status) return false
      if (filter.clientId && loan.clientId !== filter.clientId) return false  
      if (filter.currency && loan.currency !== filter.currency) return false
      if (filter.paymentFrequency && loan.paymentFrequency !== filter.paymentFrequency) return false
      return true
    })
  },
}))

// Export individual selectors for optimization
export const selectLoans = (state: LoansStore) => state.loans
export const selectIsLoading = (state: LoansStore) => state.isLoading
export const selectError = (state: LoansStore) => state.error