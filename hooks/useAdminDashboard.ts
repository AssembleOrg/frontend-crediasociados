'use client'

import { useCallback } from 'react'
import { useAdminStore } from '@/stores/admin'
import { useAdminCharts } from '@/hooks/useAdminCharts'

/**
 * useAdminDashboard - Pure Consumer Hook (Layer 4)
 *
 * Follows ARCHITECTURE_PATTERNS.md:
 * - NO auto-initialization (Provider handles that)
 * - NO useEffect with API calls
 * - Only consumes data from store
 * - Manual methods available for specific operations
 * - useCallback with empty dependencies (store methods are stable)
 */
export const useAdminDashboard = () => {
  const adminStore = useAdminStore()
  const chartData = useAdminCharts() // ✅ Layer 4: Complex processing in hook

  // Manual refresh method (for specific use cases)
  const refreshData = useCallback(() => {
    // ✅ KISS: Direct store invalidation - provider will detect and refetch
    adminStore.invalidateCache()
  }, [adminStore]) // ✅ Store reference is stable

  // Loading states - derived from store data
  const isBasicLoading = !adminStore.isBasicDataFresh() && adminStore.basicData.length === 0
  const isDetailedLoading = adminStore.basicData.length > 0 && !adminStore.hasDetailedData() && !adminStore.isDetailedDataFresh()
  const isInitialized = adminStore.basicData.length > 0 || adminStore.isBasicDataFresh()

  return {
    // Chart data (processed by Layer 4 hook)
    chartData,

    // Aggregated totals (unfiltered - true totals)
    aggregatedTotals: adminStore.getAggregatedTotals(),

    // Raw data access
    basicData: adminStore.basicData,
    detailedData: adminStore.detailedData,

    // Loading states
    isBasicLoading,
    isDetailedLoading,
    isInitialized,
    hasDetailedData: adminStore.hasDetailedData(),

    // Filter state
    timeFilter: adminStore.timeFilter,
    dateRange: adminStore.dateRange,

    // Filter methods
    setTimeFilter: adminStore.setTimeFilter,
    setCustomDateRange: adminStore.setDateRange,

    // Manual refresh (rarely needed since provider auto-manages)
    refreshData,

    // No error state - provider handles errors gracefully with fallbacks
    error: null
  }
}

/**
 * Enhanced hook for components that need filter capabilities
 */
export const useAdminDashboardWithFilters = () => {
  const dashboardData = useAdminDashboard()
  const adminStore = useAdminStore()

  // Export detailed data as CSV
  const exportDetailedData = useCallback(() => {
    const detailedData = adminStore.detailedData

    if (!detailedData.length) {
      alert('No hay datos detallados disponibles para exportar')
      return
    }

    // Filter data if a subadmin is selected
    const selectedSubadmin = adminStore.selectedSubadmin
    const dataToExport = selectedSubadmin
      ? detailedData.filter(subadmin => subadmin.id === selectedSubadmin)
      : detailedData

    // Create comprehensive CSV content
    const csvRows = []

    // Headers
    csvRows.push('Subadmin,Email,Managers,Clientes,Préstamos,Monto Total,Manager,Manager Email,Clientes Manager,Préstamos Manager')

    // Data rows
    dataToExport.forEach(subadmin => {
      if (subadmin.managers && subadmin.managers.length > 0) {
        subadmin.managers.forEach(manager => {
          const managerClients = manager.clients?.length || 0
          const managerLoans = manager.loans?.length || 0

          csvRows.push([
            subadmin.name,
            subadmin.email,
            subadmin.managersCount,
            subadmin.totalClients,
            subadmin.totalLoans,
            subadmin.totalAmount,
            manager.name,
            manager.email,
            managerClients,
            managerLoans
          ].join(','))
        })
      } else {
        // Subadmin without managers
        csvRows.push([
          subadmin.name,
          subadmin.email,
          subadmin.managersCount,
          subadmin.totalClients || 0,
          subadmin.totalLoans || 0,
          subadmin.totalAmount || 0,
          '',
          '',
          '',
          ''
        ].join(','))
      }
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admin-dashboard-detallado-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [adminStore]) // ✅ Store reference is stable

  return {
    ...dashboardData,

    // Additional filter state
    selectedSubadmin: adminStore.selectedSubadmin,
    setSelectedSubadmin: adminStore.setSelectedSubadmin,
    subadminOptions: adminStore.getSubadminOptions(),

    // Export functionality
    exportDetailedData,

    // Combined loading state
    isAnyLoading: dashboardData.isBasicLoading || dashboardData.isDetailedLoading
  }
}

// Re-export for backward compatibility
export const useProgressiveAdminDashboard = useAdminDashboard