/**
 * THE CHEF/CONTROLLER - useGastos Hook
 *
 * Business logic orchestration for expense management
 * Returns mock data from services - NO REAL API IMPLEMENTATION
 *
 * Following architecture:
 * - Auto-initialization with useEffect
 * - CRUD operations with store updates
 * - NO store methods in useCallback dependencies
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useFinanzasStore } from '@/stores/finanzas'
import { useAuth } from '@/hooks/useAuth'
import { gastosService } from '@/services/gastos.service'
import type {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilters,
  ExpenseSummary
} from '@/types/finanzas'

export const useGastos = () => {
  const { user } = useAuth()
  const store = useFinanzasStore()

  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)

  // Prevent double initialization
  const initializationRef = useRef(false)

  /**
   * Initialize expenses data
   */
  const initializeExpenses = useCallback(async () => {
    if (!user || initializationRef.current) return

    initializationRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      // Get all expenses for user
      const expenses = await gastosService.getExpenses(user?.id || '')
      store.setExpenses(expenses)

      // Get summary for current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const monthSummary = await gastosService.getExpenseSummary(
        user?.id || '',
        startOfMonth,
        endOfMonth
      )
      setSummary(monthSummary)

      setIsInitialized(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando gastos'
      setError(errorMessage)
      console.error('Error initializing expenses:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user, store])

  /**
   * Create new expense
   */
  const createExpense = useCallback(
    async (data: CreateExpenseDto): Promise<boolean> => {
      if (!user) return false

      setIsLoading(true)
      setError(null)

      try {
        const newExpense = await gastosService.createExpense(user?.id || '', data)
        store.addExpense(newExpense)

        // Refresh summary
        await refreshSummary()

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error creando gasto'
        setError(errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [user, store]
  )

  /**
   * Update existing expense
   */
  const updateExpense = useCallback(
    async (id: string, data: UpdateExpenseDto): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const updatedExpense = await gastosService.updateExpense(id, data)
        store.updateExpense(id, updatedExpense)

        // Refresh summary
        await refreshSummary()

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error actualizando gasto'
        setError(errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [store]
  )

  /**
   * Delete expense
   */
  const deleteExpense = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        await gastosService.deleteExpense(id)
        store.removeExpense(id)

        // Refresh summary
        await refreshSummary()

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error eliminando gasto'
        setError(errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [store]
  )

  /**
   * Refresh expenses with filters
   */
  const refreshExpenses = useCallback(
    async (filters?: ExpenseFilters) => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const expenses = await gastosService.getExpenses(user?.id || '', filters)
        store.setExpenses(expenses)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error cargando gastos'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [user, store]
  )

  /**
   * Refresh summary
   */
  const refreshSummary = useCallback(async () => {
    if (!user) return

    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const monthSummary = await gastosService.getExpenseSummary(
        user?.id || '',
        startOfMonth,
        endOfMonth
      )
      setSummary(monthSummary)
    } catch (err) {
      console.error('Error refreshing summary:', err)
    }
  }, [user])

  /**
   * Auto-initialization on mount
   */
  useEffect(() => {
    if (user && !initializationRef.current) {
      initializeExpenses()
    }
  }, [user, initializeExpenses])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Expenses data
    expenses: store.expenses,
    summary,

    // Store getters
    getTotalExpenses: store.getTotalExpenses,
    getExpensesByCategory: store.getExpensesByCategory,
    getExpensesInPeriod: store.getExpensesInPeriod,
    getAverageExpense: store.getAverageExpense,

    // State
    isLoading,
    isInitialized,
    error,

    // Actions
    createExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses,
    refreshSummary,
    clearError
  }
}
