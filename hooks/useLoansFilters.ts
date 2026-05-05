import { useCallback, useMemo, useEffect, useRef } from 'react'
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
    clearLoansFilters,
    filteredLoans, setFilteredLoans,
    loansFilterPagination: pagination, setLoansFilterPagination: setPagination,
    loansFilterLoading: isLoading, setLoansFilterLoading: setIsLoading,
    loansFilterError: error, setLoansFilterError: setError,
  } = useFiltersStore()

  // Debounce timer for client name search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch filtered loans from backend
  // No dependencies on loansFilters - reads from store directly to avoid re-creation loops
  const fetchFilteredLoans = useCallback(async (page: number = 1, limit: number = 50) => {
    setIsLoading(true)
    setError(null)

    try {
      // Read filters from store at call time (not from closure)
      const currentFilters = useFiltersStore.getState().loansFilters

      const params: Parameters<typeof loansService.getLoansPaginated>[0] = {
        page,
        limit,
      }

      if (currentFilters.clientName && currentFilters.clientName.length >= 2) {
        params.clientName = currentFilters.clientName
      }
      if (currentFilters.clientId) {
        params.clientId = currentFilters.clientId
      }
      if (currentFilters.loanStatus && currentFilters.loanStatus !== 'ALL') {
        params.loanStatus = currentFilters.loanStatus
      }
      if (currentFilters.paymentFrequency) {
        params.paymentFrequency = currentFilters.paymentFrequency as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
      }

      const response: PaginatedResponse<LoanResponseDto> = await loansService.getLoansPaginated(params)

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
  }, []) // Stable reference - reads from store directly

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(loansFilters).some(([key, value]) => {
      if (key === 'clientName') {
        return value !== undefined && value !== null && value !== '' && value.length >= 2
      }
      return value !== undefined && value !== null && value !== ''
    })
  }, [loansFilters])

  // Stable key for filters - only changes when actual filter values change
  const filtersKey = useMemo(() => {
    return JSON.stringify({
      cn: loansFilters.clientName || '',
      ci: loansFilters.clientId || '',
      ls: loansFilters.loanStatus || '',
      pf: loansFilters.paymentFrequency || '',
    })
  }, [loansFilters.clientName, loansFilters.clientId, loansFilters.loanStatus, loansFilters.paymentFrequency])

  // Fetch filtered loans when filters change
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!hasActiveFilters) {
      setIsLoading(false)
      setFilteredLoans([])
      setPagination({ page: 1, limit: pagination.limit, total: 0, totalPages: 0 })
      return
    }

    if (loansFilters.clientName && loansFilters.clientName.length < 2) {
      setIsLoading(false)
      setFilteredLoans([])
      setPagination({ page: 1, limit: pagination.limit, total: 0, totalPages: 0 })
      return
    }

    if (loansFilters.clientName && loansFilters.clientName.length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchFilteredLoans(1, pagination.limit)
      }, 300)
    } else {
      fetchFilteredLoans(1, pagination.limit)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  // Filter statistics
  const filterStats = useMemo(() => {
    const total = pagination.total > 0 ? pagination.total : filteredLoans.length
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
  }, [filteredLoans, pagination])

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
    const current = useFiltersStore.getState().loansFilters
    const newFilters = { ...current, [key]: value }
    if (key !== 'clientName' || (key === 'clientName' && (!value || (typeof value === 'string' && value.length < 2)))) {
      setPagination({ ...useFiltersStore.getState().loansFilterPagination, page: 1 })
    }
    setLoansFilters(newFilters)
  }, [setLoansFilters, setPagination])

  // Batch update multiple filters at once (prevents multiple re-renders/fetches)
  const updateFilters = useCallback((updates: Partial<LoansFilters>) => {
    const current = useFiltersStore.getState().loansFilters
    const newFilters = { ...current, ...updates }
    setPagination({ ...useFiltersStore.getState().loansFilterPagination, page: 1 })
    setLoansFilters(newFilters)
  }, [setLoansFilters, setPagination])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    clearLoansFilters()
    setFilteredLoans([])
    setPagination({ page: 1, limit: 50, total: 0, totalPages: 0 })
    setIsLoading(false)
    setError(null)
  }, [clearLoansFilters, setFilteredLoans, setPagination, setIsLoading, setError])

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
    updateFilters,
    clearAllFilters,
    setLoansFilters,
    refetch: fetchFilteredLoans
  }
}
