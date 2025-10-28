'use client'

import { useCallback } from 'react'
import { useSubadminStore } from '@/stores/subadmin'
import { useUsersStore } from '@/stores/users'

/**
 * useSubadminDashboard - Pure Consumer Hook (Layer 4)
 *
 * 100% identical pattern to useAdminDashboard:
 * - NO auto-initialization (useSubadminDashboardData handles that)
 * - NO useEffect with API calls
 * - Only consumes data from stores
 * - Manual methods available for specific operations
 * - useCallback with store dependencies (store methods are stable)
 *
 * NOTE: This is now a wrapper around useSubadminDashboardData which
 * combines data from usersStore (canonical) + subadminStore (enrichments)
 */
export const useSubadminDashboard = () => {
  const subadminStore = useSubadminStore()
  const usersStore = useUsersStore()

  // Get managers from usersStore (canonical source of truth)
  const managers = usersStore.users.filter(u => u.role === 'prestamista')

  // Manual refresh method (for specific use cases)
  const refreshData = useCallback(() => {
    // Invalidate store cache - useSubadminDashboardData will detect and refetch
    subadminStore.invalidateCache()
  }, [subadminStore])

  // Loading states - derived from store data
  const isDetailedLoading = !subadminStore.isEnrichmentDataFresh() && !subadminStore.hasEnrichmentData()
  const isInitialized = managers.length > 0

  // Combine managers from usersStore with enrichments from subadminStore
  const detailedData = managers.map(manager => ({
    ...manager,
    ...(subadminStore.managerEnrichments[manager.id] || {
      totalClients: 0,
      totalLoans: 0,
      totalAmount: 0,
      clients: [],
      loans: []
    })
  }))

  return {
    // Raw data access (detailedData combines usersStore + enrichments)
    detailedData,

    // Aggregated totals (unfiltered - true totals)
    aggregatedTotals: subadminStore.getAggregatedTotals(),

    // Loading states
    isDetailedLoading,
    isInitialized,
    hasDetailedData: subadminStore.hasEnrichmentData(),

    // Filter state
    timeFilter: subadminStore.timeFilter,
    dateRange: subadminStore.dateRange,

    // Filter methods
    setTimeFilter: subadminStore.setTimeFilter,
    setCustomDateRange: subadminStore.setDateRange,

    // Manual refresh
    refreshData,

    // No error state - handled by useSubadminDashboardData
    error: null
  }
}

/**
 * Enhanced hook for components that need filter capabilities
 */
export const useSubadminDashboardWithFilters = () => {
  const dashboardData = useSubadminDashboard()
  const subadminStore = useSubadminStore()
  const usersStore = useUsersStore()

  const managers = usersStore.users.filter(u => u.role === 'prestamista')

  // Export detailed data as CSV
  const exportDetailedData = useCallback(() => {
    const detailedData = dashboardData.detailedData

    if (!detailedData.length) {
      alert('No hay datos detallados disponibles para exportar')
      return
    }

    // Filter data if a manager is selected
    const selectedManager = subadminStore.selectedManager
    const dataToExport = selectedManager
      ? detailedData.filter(manager => manager.id === selectedManager)
      : detailedData

    // Create comprehensive CSV content
    const csvRows = []

    // Headers
    csvRows.push('Manager,Email,Clientes,Préstamos,Monto Total')

    // Data rows
    dataToExport.forEach((manager: any) => {
      csvRows.push([
        manager.fullName,
        manager.email,
        manager.totalClients || 0,
        manager.totalLoans || 0,
        manager.totalAmount || 0
      ].join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `subadmin-managers-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [subadminStore, dashboardData.detailedData])

  return {
    ...dashboardData,

    // Additional filter state
    selectedManager: subadminStore.selectedManager,
    setSelectedManager: subadminStore.setSelectedManager,
    managerOptions: subadminStore.getManagerOptions(managers),

    // Export functionality
    exportDetailedData,

    // Combined loading state
    isAnyLoading: dashboardData.isDetailedLoading
  }
}