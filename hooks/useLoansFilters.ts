import { useCallback, useMemo } from 'react'
import { useLoansStore } from '@/stores/loans'
import { useClientsStore } from '@/stores/clients' 
import { useFiltersStore, type LoansFilters } from '@/stores/filters'
import { getFrequencyLabel } from '@/lib/formatters'
import type { Loan } from '@/types/auth'

/**
 * THE CONDUCTOR - useLoansFilters Hook
 * 
 * Business logic controller that orchestrates:
 * - Filtering logic for loans
 * - State management for filter UI
 * - Data transformations and calculations
 * - Filter persistence and clearing
 */
export function useLoansFilters() {
  const { loans } = useLoansStore()
  const { clients } = useClientsStore()
  const { 
    loansFilters, 
    setLoansFilters, 
    clearLoansFilters 
  } = useFiltersStore()

  // Filter loans based on current filters
  const filteredLoans = useMemo(() => {
    let filtered = [...loans]

    // Client filter
    if (loansFilters.clientId) {
      filtered = filtered.filter(loan => loan.clientId === loansFilters.clientId)
    }

    // Payment frequency filter
    if (loansFilters.paymentFrequency) {
      filtered = filtered.filter(loan => loan.paymentFrequency === loansFilters.paymentFrequency)
    }

    return filtered
  }, [loans, loansFilters])

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
      clients: clients.map(client => ({
        value: client.id,
        label: client.fullName
      }))
    }
  }, [clients])

  // Update a specific filter
  const updateFilter = useCallback(<K extends keyof LoansFilters>(
    key: K, 
    value: LoansFilters[K]
  ) => {
    const newFilters = { ...loansFilters, [key]: value }
    setLoansFilters(newFilters)
  }, [loansFilters, setLoansFilters])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    clearLoansFilters()
  }, [clearLoansFilters])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(loansFilters).some(value => 
      value !== undefined && value !== null && value !== ''
    )
  }, [loansFilters])

  return {
    // Filtered data
    filteredLoans,
    filterStats,
    
    // Filter state
    filters: loansFilters,
    hasActiveFilters,
    
    // Filter options for UI
    filterOptions,
    
    // Actions
    updateFilter,
    clearAllFilters,
    setLoansFilters
  }
}