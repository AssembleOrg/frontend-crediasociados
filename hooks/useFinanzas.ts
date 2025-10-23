/**
 * THE CHEF/CONTROLLER - useFinanzas Hook
 *
 * Business logic orchestration for financial management
 * Returns mock data from services - NO REAL API IMPLEMENTATION
 *
 * Following architecture:
 * - Initialization handled by FinanzasProvider (NOT auto-init here)
 * - NO store methods in useCallback dependencies
 * - Centralized loading/error states
 */

'use client'

import { useState, useCallback } from 'react'
import { useFinanzasStore } from '@/stores/finanzas'
import { useAuth } from '@/hooks/useAuth'
import { finanzasService } from '@/services/finanzas.service'
import type { UserRole } from '@/types/auth'

export const useFinanzas = () => {
  const { user } = useAuth()
  const store = useFinanzasStore()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Refresh all financial data
   */
  const refreshFinancialData = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const userRole = (user?.role || 'prestamista') as UserRole

      const summary = await finanzasService.getFinancialSummary(
        user?.id || '',
        userRole === 'subadmin' ? 'subadmin' : 'manager'
      )
      store.setFinancialSummary(summary)

      if (userRole === 'subadmin') {
        const [managersData, portfolioData, capitalDist] = await Promise.all([
          finanzasService.getManagersFinancial(user?.id || ''),
          finanzasService.getPortfolioEvolution(user?.id || '', 30),
          finanzasService.getCapitalDistribution(user?.id || '')
        ])

        store.setManagersFinancial(managersData)
        store.setPortfolioEvolution(portfolioData)
        store.setCapitalDistribution(capitalDist)
      } else if (userRole === 'manager' || userRole === 'prestamista') {
        const [loansData, portfolioData, incomeData] = await Promise.all([
          finanzasService.getActiveLoansFinancial(user?.id || ''),
          finanzasService.getPortfolioEvolution(user?.id || '', 30),
          finanzasService.getIncomeVsExpenses(user?.id || '', 6)
        ])

        store.setActiveLoansFinancial(loansData)
        store.setPortfolioEvolution(portfolioData)
        store.setIncomeVsExpenses(incomeData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando datos financieros'
      setError(errorMessage)
      console.error('Error refreshing financial data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user, store])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Financial data
    financialSummary: store.financialSummary,
    managersFinancial: store.managersFinancial,
    activeLoansFinancial: store.activeLoansFinancial,
    portfolioEvolution: store.portfolioEvolution,
    incomeVsExpenses: store.incomeVsExpenses,
    capitalDistribution: store.capitalDistribution,

    // State
    isLoading,
    error,

    // Actions
    refreshFinancialData,
    clearError
  }
}
