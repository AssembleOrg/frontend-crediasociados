import { useCallback, useMemo, useEffect, useState, useRef } from 'react'
import { useFiltersStore, type LoansFilters } from '@/stores/filters'
import { getFrequencyLabel } from '@/lib/formatters'
import { loansService } from '@/services/loans.service'
import { apiLoanToLoan } from '@/types/transforms'
import type { Loan, PaginatedResponse, LoanResponseDto } from '@/types/auth'

/**
 * THE CONDUCTOR - useLoansFilters Hook
 * 
 * Business logic controller that orchestrates:
 * - Server-side filtering via API calls
 * - State management for filter UI
 * - Data transformations and calculations
 * - Filter persistence and clearing
 */
export function useLoansFilters() {
  const { 
    loansFilters, 
    setLoansFilters, 
    clearLoansFilters 
  } = useFiltersStore()

  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  }>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  // Debounce timer for client name search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch filtered loans from backend
  const fetchFilteredLoans = useCallback(async (page: number = 1, limit: number = 50) => {
    setIsLoading(true)
    setError(null)

    try {
      const params: Parameters<typeof loansService.getLoansPaginated>[0] = {
        page,
        limit,
      }

      // Add filters
      if (loansFilters.clientName && loansFilters.clientName.length >= 2) {
        params.clientName = loansFilters.clientName
      }
      if (loansFilters.clientId) {
        params.clientId = loansFilters.clientId
      }
      if (loansFilters.loanStatus && loansFilters.loanStatus !== 'ALL') {
        params.loanStatus = loansFilters.loanStatus
      }
      if (loansFilters.paymentFrequency) {
        params.paymentFrequency = loansFilters.paymentFrequency as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
      }

      const response: PaginatedResponse<LoanResponseDto> = await loansService.getLoansPaginated(params)
      
      // Transform API loans to frontend loans
      const transformedLoans = response.data.map(apiLoanToLoan)
      
      setFilteredLoans(transformedLoans)
      setPagination({
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al filtrar préstamos'
      setError(errorMessage)
      setFilteredLoans([])
    } finally {
      setIsLoading(false)
    }
  }, [loansFilters])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(loansFilters).some(([key, value]) => {
      if (key === 'clientName') {
        return value !== undefined && value !== null && value !== '' && value.length >= 2
      }
      return value !== undefined && value !== null && value !== ''
    })
  }, [loansFilters])

  // Fetch filtered loans when filters change (with debounce for clientName)
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // If no filters are active, clear filtered loans
    if (!hasActiveFilters) {
      setFilteredLoans([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0, page: 1 }))
      return
    }

    // If clientName is being used and has less than 2 characters, don't fetch yet
    if (loansFilters.clientName && loansFilters.clientName.length < 2) {
      setFilteredLoans([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
      return
    }

    // Reset to page 1 when filters change (except when only clientName is being typed)
    const shouldResetPage = !loansFilters.clientName || loansFilters.clientName.length >= 2
    const pageToUse = shouldResetPage ? 1 : pagination.page

    // Debounce clientName search (300ms)
    if (loansFilters.clientName && loansFilters.clientName.length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchFilteredLoans(pageToUse, pagination.limit)
      }, 300)
    } else {
      // No debounce for other filters
      fetchFilteredLoans(pageToUse, pagination.limit)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [loansFilters, hasActiveFilters, fetchFilteredLoans, pagination.limit])

  // Filter statistics
  const filterStats = useMemo(() => {
    const total = filteredLoans.length
    const totalAmount = filteredLoans.reduce((sum, loan) => sum + loan.amount, 0)
    const avgAmount = total > 0 ? totalAmount / total : 0
    
    return {
      total,
      totalAmount,
      avgAmount,
      byStatus: {
        active: filteredLoans.filter(loan => loan.status === 'ACTIVE' || loan.status === 'APPROVED').length,
        completed: filteredLoans.filter(loan => loan.status === 'COMPLETED').length,
        pending: filteredLoans.filter(loan => loan.status === 'PENDING').length,
        approved: filteredLoans.filter(loan => loan.status === 'APPROVED').length,
        cancelled: filteredLoans.filter(loan => loan.status === 'REJECTED' || loan.status === 'DEFAULTED').length,
        overdue: filteredLoans.filter(loan => loan.status === 'DEFAULTED').length
      }
    }
  }, [filteredLoans])

  // Filter options for dropdowns
  const filterOptions = useMemo(() => {
    return {
      paymentFrequencies: [
        { value: 'DAILY', label: getFrequencyLabel('DAILY') },
        { value: 'WEEKLY', label: getFrequencyLabel('WEEKLY') },
        { value: 'BIWEEKLY', label: getFrequencyLabel('BIWEEKLY') },
        { value: 'MONTHLY', label: getFrequencyLabel('MONTHLY') }
      ],
      // Clients will be loaded asynchronously via search endpoint
      clients: [] as Array<{ value: string; label: string }>
    }
  }, [])

  // Update a specific filter
  const updateFilter = useCallback(<K extends keyof LoansFilters>(
    key: K, 
    value: LoansFilters[K]
  ) => {
    const newFilters = { ...loansFilters, [key]: value }
    // Reset page when filters change (except when typing clientName)
    if (key !== 'clientName' || (key === 'clientName' && (!value || (typeof value === 'string' && value.length < 2)))) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
    setLoansFilters(newFilters)
  }, [loansFilters, setLoansFilters])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    clearLoansFilters()
    setPagination(prev => ({ ...prev, page: 1, total: 0, totalPages: 0 }))
    setFilteredLoans([])
  }, [clearLoansFilters])

  return {
    // Filtered data
    filteredLoans,
    filterStats,
    isLoading,
    error,
    pagination,
    
    // Filter state
    filters: loansFilters,
    hasActiveFilters,
    
    // Filter options for UI
    filterOptions,
    
    // Actions
    updateFilter,
    clearAllFilters,
    setLoansFilters,
    refetch: fetchFilteredLoans
  }
}
