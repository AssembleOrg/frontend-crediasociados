/**
 * THE WAREHOUSE - Finanzas Store
 *
 * "Dumb" store following architecture patterns:
 * - NO async operations
 * - NO API calls
 * - NO business logic
 * - ONLY synchronous state setters
 * - Centralized calculations
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  FinancialSummary,
  ManagerFinancialData,
  ActiveLoanFinancial,
  Expense,
  PortfolioEvolution,
  IncomeVsExpenses,
  CapitalDistribution
} from '@/types/finanzas'
import type { Transaccion } from '@/types/operativa'

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

interface FinanzasStore {
  // Financial Summary
  financialSummary: FinancialSummary | null

  // Managers financial data (for Subadmin view)
  managersFinancial: ManagerFinancialData[]

  // Active loans financial (for Manager view)
  activeLoansFinancial: ActiveLoanFinancial[]

  // Expenses
  expenses: Expense[]

  // Evolution data for charts
  portfolioEvolution: PortfolioEvolution[]
  incomeVsExpenses: IncomeVsExpenses[]
  capitalDistribution: CapitalDistribution[]

  // UI state
  isLoading: boolean
  error: string | null

  // ============================================================================
  // SYNCHRONOUS SETTERS ONLY
  // ============================================================================

  setFinancialSummary: (summary: FinancialSummary | null) => void
  setManagersFinancial: (managers: ManagerFinancialData[]) => void
  setActiveLoansFinancial: (loans: ActiveLoanFinancial[]) => void
  setExpenses: (expenses: Expense[]) => void
  setPortfolioEvolution: (data: PortfolioEvolution[]) => void
  setIncomeVsExpenses: (data: IncomeVsExpenses[]) => void
  setCapitalDistribution: (data: CapitalDistribution[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Single setters for mutations
  addExpense: (expense: Expense) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
  removeExpense: (id: string) => void

  // Integration with Operativa
  applyTransaccion: (transaccion: Transaccion) => void

  // ============================================================================
  // CENTRALIZED CALCULATIONS (GETTERS)
  // ============================================================================

  getTotalExpenses: () => number
  getExpensesByCategory: (category: string) => Expense[]
  getExpensesInPeriod: (startDate: Date, endDate: Date) => Expense[]
  getAverageExpense: () => number

  // Clear/reset
  clearFinancialData: () => void
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useFinanzasStore = create<FinanzasStore>()(
  immer((set, get) => ({
    // Initial state
    financialSummary: null,
    managersFinancial: [],
    activeLoansFinancial: [],
    expenses: [],
    portfolioEvolution: [],
    incomeVsExpenses: [],
    capitalDistribution: [],
    isLoading: false,
    error: null,

    // ============================================================================
    // SETTERS - SYNCHRONOUS ONLY
    // ============================================================================

    setFinancialSummary: (summary) => {
      set((state) => {
        state.financialSummary = summary
      })
    },

    setManagersFinancial: (managers) => {
      set((state) => {
        state.managersFinancial = managers
      })
    },

    setActiveLoansFinancial: (loans) => {
      set((state) => {
        state.activeLoansFinancial = loans
      })
    },

    setExpenses: (expenses) => {
      set((state) => {
        state.expenses = expenses
      })
    },

    setPortfolioEvolution: (data) => {
      set((state) => {
        state.portfolioEvolution = data
      })
    },

    setIncomeVsExpenses: (data) => {
      set((state) => {
        state.incomeVsExpenses = data
      })
    },

    setCapitalDistribution: (data) => {
      set((state) => {
        state.capitalDistribution = data
      })
    },

    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading
      })
    },

    setError: (error) => {
      set((state) => {
        state.error = error
      })
    },

    // ============================================================================
    // MUTATION SETTERS
    // ============================================================================

    addExpense: (expense) => {
      set((state) => {
        state.expenses.push(expense)
      })
    },

    updateExpense: (id, updates) => {
      set((state) => {
        const index = state.expenses.findIndex((e) => e.id === id)
        if (index !== -1) {
          state.expenses[index] = { ...state.expenses[index], ...updates }
        }
      })
    },

    removeExpense: (id) => {
      set((state) => {
        state.expenses = state.expenses.filter((e) => e.id !== id)
      })
    },

    // ============================================================================
    // INTEGRATION WITH OPERATIVA
    // ============================================================================

    applyTransaccion: (transaccion) => {
      set((state) => {
        if (!state.financialSummary) return

        // Apply transaction to financial metrics
        if (transaccion.tipo === 'ingreso') {
          // INGRESO: Increase capital disponible + recaudado
          state.financialSummary.capitalDisponible += transaccion.amount
          state.financialSummary.recaudadoEsteMes += transaccion.amount

          // Recalculate valor cartera
          state.financialSummary.valorCartera =
            state.financialSummary.capitalDisponible +
            state.financialSummary.montoEnPrestamosActivos -
            state.financialSummary.gastosEsteMes
        } else {
          // EGRESO: Decrease capital disponible + increase gastos
          state.financialSummary.capitalDisponible -= transaccion.amount
          state.financialSummary.gastosEsteMes += transaccion.amount

          // Recalculate valor cartera
          state.financialSummary.valorCartera =
            state.financialSummary.capitalDisponible +
            state.financialSummary.montoEnPrestamosActivos -
            state.financialSummary.gastosEsteMes
        }
      })
    },

    // ============================================================================
    // GETTERS - CENTRALIZED CALCULATIONS
    // ============================================================================

    getTotalExpenses: () => {
      const { expenses } = get()
      return expenses.reduce((sum, expense) => sum + expense.amount, 0)
    },

    getExpensesByCategory: (category) => {
      const { expenses } = get()
      return expenses.filter((expense) => expense.category === category)
    },

    getExpensesInPeriod: (startDate, endDate) => {
      const { expenses } = get()
      return expenses.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= startDate && expenseDate <= endDate
      })
    },

    getAverageExpense: () => {
      const { expenses } = get()
      if (expenses.length === 0) return 0
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
      return total / expenses.length
    },

    // ============================================================================
    // RESET
    // ============================================================================

    clearFinancialData: () => {
      set((state) => {
        state.financialSummary = null
        state.managersFinancial = []
        state.activeLoansFinancial = []
        state.expenses = []
        state.portfolioEvolution = []
        state.incomeVsExpenses = []
        state.capitalDistribution = []
        state.error = null
      })
    }
  }))
)
