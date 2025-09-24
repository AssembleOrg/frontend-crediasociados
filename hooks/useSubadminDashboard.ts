'use client'

import { useCallback } from 'react'
import { useSubadminStore } from '@/stores/subadmin'

/**
 * useSubadminDashboard - Pure Consumer Hook (Layer 4)
 *
 * 100% identical pattern to useAdminDashboard:
 * - NO auto-initialization (Provider handles that)
 * - NO useEffect with API calls
 * - Only consumes data from store
 * - Manual methods available for specific operations
 * - useCallback with store dependencies (store methods are stable)
 */
export const useSubadminDashboard = () => {
  const subadminStore = useSubadminStore()

  // Manual refresh method (for specific use cases)
  const refreshData = useCallback(() => {
    // ✅ KISS: Direct store invalidation - provider will detect and refetch
    subadminStore.invalidateCache()
  }, [subadminStore]) // ✅ Store reference is stable

  // Loading states - derived from store data
  const isBasicLoading = !subadminStore.isBasicDataFresh() && subadminStore.managers.length === 0
  const isDetailedLoading = subadminStore.managers.length > 0 && !subadminStore.hasDetailedData() && !subadminStore.isDetailedDataFresh()
  const isInitialized = subadminStore.managers.length > 0 || subadminStore.isBasicDataFresh()

  return {
    // Raw data access
    basicData: subadminStore.managers,
    detailedData: subadminStore.detailedManagers,

    // Aggregated totals (unfiltered - true totals)
    aggregatedTotals: subadminStore.getAggregatedTotals(),

    // Loading states
    isBasicLoading,
    isDetailedLoading,
    isInitialized,
    hasDetailedData: subadminStore.hasDetailedData(),

    // Filter state
    timeFilter: subadminStore.timeFilter,
    dateRange: subadminStore.dateRange,

    // Filter methods
    setTimeFilter: subadminStore.setTimeFilter,
    setCustomDateRange: subadminStore.setDateRange,

    // Manual refresh (rarely needed since provider auto-manages)
    refreshData,

    // No error state - provider handles errors gracefully with fallbacks
    error: null
  }
}

/**
 * Enhanced hook for components that need filter capabilities
 */
export const useSubadminDashboardWithFilters = () => {
  const dashboardData = useSubadminDashboard()
  const subadminStore = useSubadminStore()

  // Export detailed data as CSV
  const exportDetailedData = useCallback(() => {
    const detailedData = subadminStore.detailedManagers

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
    dataToExport.forEach(manager => {
      csvRows.push([
        manager.name,
        manager.email,
        manager.totalClients,
        manager.totalLoans,
        manager.totalAmount
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
  }, [subadminStore]) // ✅ Store reference is stable

  return {
    ...dashboardData,

    // Additional filter state
    selectedManager: subadminStore.selectedManager,
    setSelectedManager: subadminStore.setSelectedManager,
    managerOptions: subadminStore.getManagerOptions(),

    // Export functionality
    exportDetailedData,

    // Combined loading state
    isAnyLoading: dashboardData.isBasicLoading || dashboardData.isDetailedLoading
  }
}