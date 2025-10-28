'use client'

import { useCallback } from 'react'
import { useAdminStore } from '@/stores/admin'
import { useUsersStore } from '@/stores/users'

/**
 * useAdminDashboard - Pure Consumer Hook (Layer 4)
 *
 * 100% identical pattern to useSubadminDashboard:
 * - NO auto-initialization (useAdminDashboardData handles that)
 * - NO useEffect with API calls
 * - Only consumes data from stores
 * - Manual methods available for specific operations
 * - useCallback with store dependencies (store methods are stable)
 *
 * NOTE: This is now a wrapper around useAdminDashboardData which
 * combines data from usersStore (canonical) + adminStore (enrichments)
 */
export const useAdminDashboard = () => {
  const adminStore = useAdminStore()
  const usersStore = useUsersStore()

  // Get subadmins from usersStore (canonical source of truth)
  const subadmins = usersStore.users.filter(u => u.role === 'subadmin')

  // Manual refresh method (for specific use cases)
  const refreshData = useCallback(() => {
    // Invalidate store cache - useAdminDashboardData will detect and refetch
    adminStore.invalidateCache()
  }, [adminStore])

  // Loading states - derived from store data
  const isDetailedLoading = !adminStore.isEnrichmentDataFresh() && !adminStore.hasEnrichmentData()
  const isInitialized = subadmins.length > 0

  // Combine subadmins from usersStore with enrichments from adminStore
  const detailedData = subadmins.map(subadmin => ({
    ...subadmin,
    ...(adminStore.subadminEnrichments[subadmin.id] || {
      totalClients: 0,
      totalLoans: 0,
      totalAmount: 0,
      managers: []
    })
  }))

  return {
    // Raw data access (detailedData combines usersStore + enrichments)
    detailedData,

    // Aggregated totals (unfiltered - true totals)
    aggregatedTotals: adminStore.getAggregatedTotals(subadmins),

    // Loading states
    isDetailedLoading,
    isInitialized,
    hasDetailedData: adminStore.hasEnrichmentData(),

    // Filter state
    timeFilter: adminStore.timeFilter,
    dateRange: adminStore.dateRange,

    // Filter methods
    setTimeFilter: adminStore.setTimeFilter,
    setCustomDateRange: adminStore.setDateRange,

    // Manual refresh
    refreshData,

    // No error state - handled by useAdminDashboardData
    error: null
  }
}

export const useAdminDashboardWithFilters = () => {
  const dashboardData = useAdminDashboard()
  const adminStore = useAdminStore()
  const usersStore = useUsersStore()

  const subadmins = usersStore.users.filter(u => u.role === 'subadmin')

  const exportDetailedData = useCallback(() => {
    const detailedData = dashboardData.detailedData

    if (!detailedData.length) {
      alert('No hay datos detallados disponibles para exportar')
      return
    }

    const selectedSubadmin = adminStore.selectedSubadmin
    const dataToExport = selectedSubadmin
      ? detailedData.filter(subadmin => subadmin.id === selectedSubadmin)
      : detailedData

    const csvRows = []

    csvRows.push('Subadmin,Email,Managers,Clientes,Préstamos,Manager,Manager Email,Clientes Manager,Préstamos Manager')

    dataToExport.forEach(subadmin => {
      if (subadmin.managers && subadmin.managers.length > 0) {
        subadmin.managers.forEach(manager => {
          const managerClients = manager.clients?.length || 0
          const managerLoans = manager.loans?.length || 0

          csvRows.push([
            subadmin.fullName,
            subadmin.email,
            subadmin.managers?.length || 0,
            subadmin.totalClients,
            subadmin.totalLoans,
            manager.name,
            manager.email,
            managerClients,
            managerLoans
          ].join(','))
        })
      } else {
        // Subadmin without managers
        csvRows.push([
          subadmin.fullName,
          subadmin.email,
          0,
          subadmin.totalClients || 0,
          subadmin.totalLoans || 0,
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
  }, [adminStore, dashboardData.detailedData])

  return {
    ...dashboardData,

    // Additional filter state
    selectedSubadmin: adminStore.selectedSubadmin,
    setSelectedSubadmin: adminStore.setSelectedSubadmin,
    subadminOptions: adminStore.getSubadminOptions(subadmins),

    // Export functionality
    exportDetailedData,

    // Combined loading state
    isAnyLoading: dashboardData.isDetailedLoading
  }
}

