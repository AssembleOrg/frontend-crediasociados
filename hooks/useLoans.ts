import { useCallback, useEffect } from 'react'
import { useLoansStore } from '@/stores/loans'
import { useAdminStore } from '@/stores/admin'
import { useSubadminStore } from '@/stores/subadmin'
import { useAuth } from '@/hooks/useAuth'
import { useSubLoansProviderContext } from '@/components/providers/SubLoansProvider'
import { loansService } from '@/services/loans.service'
import { subLoansLookupService } from '@/services/subloans-lookup.service'
import { useSubLoansStore } from '@/stores/sub-loans'
import { apiLoanToLoan, loanToCreateDto } from '@/types/transforms'
import type { Loan, PaginationParams, CreateLoanDto } from '@/types/auth'

/**
 * THE CONDUCTOR - useLoans Hook
 * 
 * Business logic controller that orchestrates:
 * - Async operations (API calls via service)
 * - State management (simple commands to store)  
 * - Data transformations (API ↔ Frontend)
 * - Loading states and error handling
 */
export function useLoans() {
  const { user: currentUser } = useAuth()
  const adminStore = useAdminStore()
  const subadminStore = useSubadminStore()
  const subLoansStore = useSubLoansStore()

  // Make SubLoansProvider context optional for admin users
  const subLoansContext = (() => {
    try {
      return useSubLoansProviderContext()
    } catch (error) {
      // Admin users don't have SubLoansProvider, return null context
      return { refreshData: () => {} }
    }
  })()
  const { refreshData } = subLoansContext
  const {
    loans,
    isLoading,
    error,
    setLoans,
    addLoan,
    updateLoan,
    removeLoan,
    setLoading,
    setError,
    reset,
    getTotalLoans,
    getActiveLoansByStatus,
    getLoanById,
    getLoansByClient,
    getLoanByTrack,
    getFilteredLoans,
  } = useLoansStore()

  // Note: Auto-initialization removed to prevent architectural drift
  // Data is now initialized by SubLoansProvider at layout level
  // Following "Layout Provides, Pages Consume" principle

  const fetchLoans = useCallback(async (params?: PaginationParams) => {
    if (!currentUser) return

    try {
      setLoading(true)
      setError(null)

      const response = await loansService.getAllLoans()
      const transformedLoans = response.map(apiLoanToLoan)
      setLoans(transformedLoans)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al cargar préstamos: ${errorMessage}`)
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLoanById = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const apiLoan = await loansService.getLoanById(id)
      const loan = apiLoanToLoan(apiLoan)
      
      // Update the loan in the store if it exists, otherwise add it
      const existingLoan = getLoanById(id)
      if (existingLoan) {
        updateLoan(id, loan)
      } else {
        addLoan(loan)
      }

      return loan
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al cargar préstamo: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const createLoan = useCallback(async (loanData: CreateLoanDto) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Creating loan...')
      
      // TODO: Fix loanToCreateDto transform to accept CreateLoanDto directly
      // const createDto = loanToCreateDto(loanData)
      const apiLoan = await loansService.createLoan(loanData)
      const newLoan = apiLoanToLoan(apiLoan)

      addLoan(newLoan)

      console.log('✅ Loan created, refreshing all related data...')

      // Invalidate related caches to ensure other views refresh
      adminStore.invalidateCache()
      subadminStore.invalidateCache()

      // ✅ CRITICAL: Refresh BOTH loans AND subloans data
      // This ensures the loan details modal shows the correct subloans immediately
      try {
        // Refresh provider data (if available)
        await refreshData()
        
        // ✅ CRITICAL: Clear cache to force fresh data with client info
        console.log('🧹 Clearing subloans lookup cache...')
        subLoansLookupService.clearCache()
        
        // ✅ FORCE REFRESH: Fetch fresh subloans with client info
        console.log('🔄 Fetching fresh subloans data with client names...')
        const freshSubLoans = await subLoansLookupService.getAllSubLoansWithClientInfo()
        subLoansStore.setAllSubLoansWithClient(freshSubLoans)
        console.log('✅ SubLoans refreshed with client data:', freshSubLoans.length)
      } catch (refreshError) {
        console.error('⚠️ Error refreshing data after loan creation:', refreshError)
        // Don't throw - loan was created successfully
      }

      return newLoan
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al crear préstamo: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [refreshData, subLoansStore])

  const deleteLoan = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      await loansService.deleteLoan(id)
      removeLoan(id)

      // Invalidate related caches to ensure other views refresh
      adminStore.invalidateCache()
      subadminStore.invalidateCache()
      await refreshData()

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al eliminar préstamo: ${errorMessage}`)
      return false
    } finally {
      setLoading(false)
    }
  }, [refreshData])

  const deleteLoanPermanently = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🗑️ Permanently deleting loan:', id)
      const result = await loansService.deleteLoanPermanently(id)
      removeLoan(id)

      console.log('✅ Loan deleted, refreshing all related data...')

      // Invalidate related caches to ensure other views refresh
      adminStore.invalidateCache()
      subadminStore.invalidateCache()
      
      // ✅ CRITICAL: Refresh BOTH loans AND subloans data
      try {
        await refreshData()
        
        // ✅ CRITICAL: Clear cache to force fresh data
        console.log('🧹 Clearing subloans lookup cache...')
        subLoansLookupService.clearCache()
        
        // ✅ FORCE REFRESH: Fetch fresh subloans with client info
        console.log('🔄 Fetching fresh subloans data with client names...')
        const freshSubLoans = await subLoansLookupService.getAllSubLoansWithClientInfo()
        subLoansStore.setAllSubLoansWithClient(freshSubLoans)
        console.log('✅ SubLoans refreshed with client data:', freshSubLoans.length)
      } catch (refreshError) {
        console.error('⚠️ Error refreshing data after loan deletion:', refreshError)
        // Don't throw - loan was deleted successfully
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al eliminar préstamo: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [refreshData, subLoansStore])

  return {
    loans,
    isLoading,
    error,
    fetchLoans,
    fetchLoanById,
    createLoan,
    deleteLoan,
    deleteLoanPermanently,
    reset,
    getTotalLoans,
    getActiveLoansByStatus,
    getLoanById,
    getLoansByClient,
    getLoanByTrack,
    getFilteredLoans,
  }
}