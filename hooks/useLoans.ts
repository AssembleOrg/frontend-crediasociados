import { useCallback, useEffect } from 'react'
import { useLoansStore } from '@/stores/loans'
import { useAuth } from '@/hooks/useAuth'
import { loansService } from '@/services/loans.service'
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

  useEffect(() => {
    if (currentUser) {
      fetchLoans()
    }
  }, [currentUser])

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
  }, [currentUser, setLoading, setError, setLoans])

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
  }, [setLoading, setError, getLoanById, updateLoan, addLoan])

  const createLoan = useCallback(async (loanData: CreateLoanDto) => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Fix loanToCreateDto transform to accept CreateLoanDto directly
      // const createDto = loanToCreateDto(loanData)
      const apiLoan = await loansService.createLoan(loanData)
      const newLoan = apiLoanToLoan(apiLoan)
      
      addLoan(newLoan)
      return newLoan
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al crear préstamo: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, addLoan])

  const deleteLoan = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      await loansService.deleteLoan(id)
      removeLoan(id)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al eliminar préstamo: ${errorMessage}`)
      return false
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, removeLoan])

  return {
    loans,
    isLoading,
    error,
    fetchLoans,
    fetchLoanById,
    createLoan,
    deleteLoan,
    reset,
    getTotalLoans,
    getActiveLoansByStatus,
    getLoanById,
    getLoansByClient,
    getLoanByTrack,
    getFilteredLoans,
  }
}