import { useCallback, useMemo } from 'react'
import { useSubLoans } from '@/hooks/useSubLoans'
import { useClientsStore } from '@/stores/clients' 
import { useFiltersStore, type CobrosFilters } from '@/stores/filters'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

/**
 * THE CONDUCTOR - useCobrosFilters Hook
 * 
 * Business logic controller for cobros filtering:
 * - Filters subloans by status, client, amount, date
 * - Manages card visibility state
 * - Calculates filter statistics
 * - Provides urgency level classification
 */
export function useCobrosFilters() {
  const { allSubLoansWithClient } = useSubLoans()
  const { clients } = useClientsStore()
  const { 
    cobrosFilters, 
    setCobrosFilters, 
    clearCobrosFilters,
    notifiedClients,
    markClientAsNotified,
    markClientAsPending
  } = useFiltersStore()
  
  // Create reactive isClientNotified function
  const isClientNotified = useCallback((clientId: string) => {
    return notifiedClients.has(clientId)
  }, [notifiedClients])

  // Helper function to determine urgency based on due date
  const getUrgencyLevel = useCallback((dueDate: string): 'OVERDUE' | 'TODAY' | 'SOON' | 'UPCOMING' => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'OVERDUE' // Ya vencido
    if (diffDays === 0) return 'TODAY' // Vence hoy
    if (diffDays <= 2) return 'SOON' // Vence pronto (1-2 días)
    return 'UPCOMING' // Futuro (más de 2 días)
  }, [])

  // Filter subloans based on current filters
  const filteredSubLoans = useMemo(() => {
    let filtered = [...allSubLoansWithClient]

    // Status filter (urgency-based) - skip urgency filtering for NOTIFIED
    if (cobrosFilters.status && cobrosFilters.status !== 'ALL' && cobrosFilters.status !== 'NOTIFIED') {
      filtered = filtered.filter(subloan => getUrgencyLevel(subloan.dueDate) === cobrosFilters.status)
    }

    // Client filter by ID
    if (cobrosFilters.clientId) {
      filtered = filtered.filter(subloan => subloan.clientId === cobrosFilters.clientId)
    }

    return filtered
  }, [allSubLoansWithClient, cobrosFilters, getUrgencyLevel])

  // Group filtered subloans by client with summary stats and handle notification filtering
  const filteredClientsSummary = useMemo(() => {
    const clientsMap = new Map<string, SubLoanWithClientInfo[]>()
    
    // Group by client
    filteredSubLoans.forEach(subloan => {
      const clientKey = subloan.clientId || subloan.loanId
      if (!clientsMap.has(clientKey)) {
        clientsMap.set(clientKey, [])
      }
      clientsMap.get(clientKey)!.push(subloan)
    })

    // KISS Solution: By default exclude notified clients (even when showing "ALL")
    // Only show notified clients when explicitly filtering by "NOTIFIED"
    if (cobrosFilters.status === 'NOTIFIED') {
      // Show only notified clients
      for (const [clientKey, subLoans] of clientsMap.entries()) {
        if (!isClientNotified(clientKey)) {
          clientsMap.delete(clientKey)
        }
      }
    } else {
      // For ALL other cases (including 'ALL' and undefined/null), exclude notified clients
      for (const [clientKey, subLoans] of clientsMap.entries()) {
        if (isClientNotified(clientKey)) {
          clientsMap.delete(clientKey)
        }
      }
    }

    // Create summaries
    return Array.from(clientsMap.entries()).map(([clientKey, subLoans]) => {
      const firstSubloan = subLoans[0]
      const clientName = firstSubloan.clientName || `Cliente #${firstSubloan.loanId}`
      
      // Calculate stats
      const overdueCount = subLoans.filter(s => getUrgencyLevel(s.dueDate) === 'OVERDUE').length
      const todayCount = subLoans.filter(s => getUrgencyLevel(s.dueDate) === 'TODAY').length
      const soonCount = subLoans.filter(s => getUrgencyLevel(s.dueDate) === 'SOON').length
      const paidCount = subLoans.filter(s => s.status === 'PAID').length
      
      // Determine overall urgency level (worst case)
      let urgencyLevel: 'OVERDUE' | 'TODAY' | 'SOON' | 'UPCOMING' = 'UPCOMING'
      if (overdueCount > 0) urgencyLevel = 'OVERDUE'
      else if (todayCount > 0) urgencyLevel = 'TODAY'
      else if (soonCount > 0) urgencyLevel = 'SOON'
      
      return {
        clientId: firstSubloan.clientId || clientKey,
        clientName,
        subLoans: subLoans.sort((a, b) => a.paymentNumber - b.paymentNumber),
        urgencyLevel,
        stats: {
          total: subLoans.length,
          overdue: overdueCount,
          today: todayCount,
          soon: soonCount,
          paid: paidCount,
          totalAmount: subLoans.reduce((sum, s) => sum + s.totalAmount, 0),
          paidAmount: subLoans.reduce((sum, s) => sum + (s.paidAmount || 0), 0)
        }
      }
    }).sort((a, b) => {
      // Sort by urgency level first
      const urgencyOrder = { OVERDUE: 0, TODAY: 1, SOON: 2, UPCOMING: 3 }
      if (a.urgencyLevel !== b.urgencyLevel) {
        return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel]
      }
      // Then by client name
      return a.clientName.localeCompare(b.clientName)
    })
  }, [filteredSubLoans, cobrosFilters.status, getUrgencyLevel, notifiedClients, isClientNotified])

  // Global statistics (for filter buttons - shows all available data)
  const globalStats = useMemo(() => {
    // Count unique clients with active loans (not just subloans) excluding notified clients
    const uniqueClientsWithLoans = new Set(
      allSubLoansWithClient
        .filter(s => s.status !== 'PAID')  // Only active (unpaid) subloans
        .filter(s => s.clientId && !isClientNotified(s.clientId))  // Exclude notified clients from "Todos" count
        .map(s => s.clientId)
        .filter((id): id is string => id !== undefined)
    ).size;

    return {
      overdue: allSubLoansWithClient.filter(s => getUrgencyLevel(s.dueDate) === 'OVERDUE').length,
      today: allSubLoansWithClient.filter(s => getUrgencyLevel(s.dueDate) === 'TODAY').length,
      soon: allSubLoansWithClient.filter(s => getUrgencyLevel(s.dueDate) === 'SOON').length,
      upcoming: allSubLoansWithClient.filter(s => getUrgencyLevel(s.dueDate) === 'UPCOMING').length,
      paid: allSubLoansWithClient.filter(s => s.status === 'PAID').length,
      totalClients: uniqueClientsWithLoans  // Count of unique clients with pending payments (excluding notified)
    }
  }, [allSubLoansWithClient, getUrgencyLevel, isClientNotified, notifiedClients])

  // Filter statistics (for filtered results display)
  const filterStats = useMemo(() => {
    const stats = {
      total: filteredClientsSummary.length, // Count clients, not subloans
      totalAmount: filteredSubLoans.reduce((sum, s) => sum + s.totalAmount, 0),
      byStatus: {
        overdue: filteredSubLoans.filter(s => getUrgencyLevel(s.dueDate) === 'OVERDUE').length,
        today: filteredSubLoans.filter(s => getUrgencyLevel(s.dueDate) === 'TODAY').length,
        soon: filteredSubLoans.filter(s => getUrgencyLevel(s.dueDate) === 'SOON').length,
        upcoming: filteredSubLoans.filter(s => getUrgencyLevel(s.dueDate) === 'UPCOMING').length,
        paid: filteredSubLoans.filter(s => s.status === 'PAID').length
      },
      notifiedCount: notifiedClients.size
    }
    return stats
  }, [filteredClientsSummary, filteredSubLoans, getUrgencyLevel, notifiedClients])

  // Update a specific filter
  const updateFilter = useCallback(<K extends keyof CobrosFilters>(
    key: K, 
    value: CobrosFilters[K]
  ) => {
    const newFilters = { ...cobrosFilters, [key]: value }
    setCobrosFilters(newFilters)
  }, [cobrosFilters, setCobrosFilters])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    clearCobrosFilters()
  }, [clearCobrosFilters])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(cobrosFilters).some(value => 
      value !== undefined && value !== null && value !== ''
    )
  }, [cobrosFilters])

  // Quick status filter buttons (use global stats for counts)
  const statusFilterOptions = useMemo(() => [
    { 
      key: 'OVERDUE' as const, 
      label: 'Vencidos', 
      color: 'error' as const,
      count: globalStats.overdue 
    },
    { 
      key: 'TODAY' as const, 
      label: 'Hoy', 
      color: 'warning' as const,
      count: globalStats.today 
    },
    { 
      key: 'SOON' as const, 
      label: 'Pronto', 
      color: 'warning' as const,
      customColor: '#ffc107' as const, // Custom yellow to match legend
      count: globalStats.soon 
    },
    { 
      key: 'NOTIFIED' as const, 
      label: 'Notificados', 
      color: 'success' as const,
      count: notifiedClients.size 
    },
    { 
      key: 'ALL' as const, 
      label: 'Todos', 
      color: 'primary' as const,
      count: globalStats.totalClients  // Count of unique clients with pending payments
    }
  ] as const, [globalStats, notifiedClients])

  return {
    // Filtered data
    filteredSubLoans,
    filteredClientsSummary,
    filterStats,
    globalStats,
    
    // Filter state
    filters: cobrosFilters,
    hasActiveFilters,
    
    // Status filter options for buttons
    statusFilterOptions,
    
    // Actions
    updateFilter,
    clearAllFilters,
    setCobrosFilters,
    
    // Client notification status
    markClientAsNotified,
    markClientAsPending,
    isClientNotified,
    
    // Utilities
    getUrgencyLevel
  }
}