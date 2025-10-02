'use client'

import { useCallback } from 'react'
import { useAdminStore } from '@/stores/admin'

/**
 * useAdminReportsConsumer - Pure Consumer Hook (Layer 4)
 *
 * Follows ARCHITECTURE_PATTERNS.md:
 * - NO auto-initialization (AdminDataProvider handles that)
 * - NO useEffect with API calls
 * - Only consumes data from store
 * - Manual methods for refresh operations
 */
export const useAdminReportsConsumer = () => {
  const adminStore = useAdminStore()

  const refreshReports = useCallback(() => {
    adminStore.invalidateCache()
  }, [adminStore])

  const clearError = useCallback(() => {
    console.log('Clear error called - provider handles errors gracefully')
  }, [])

  const initializeReports = useCallback(() => {
    refreshReports()
  }, [refreshReports])

  return {
    reports: adminStore.reports,
    isLoading: !adminStore.isBasicDataFresh() && !adminStore.reports,
    isInitialized: !!adminStore.reports || adminStore.isBasicDataFresh(),
    error: null,
    initializeReports,
    refreshReports,
    clearError
  }
}

export const useAdminReportsWithFilters = () => {
  const reportsData = useAdminReportsConsumer()
  const adminStore = useAdminStore()

  const dashboardData = {
    basicData: adminStore.basicData,
    detailedData: adminStore.detailedData,
    isInitialized: adminStore.basicData.length > 0,
    timeFilter: adminStore.timeFilter,
    dateRange: adminStore.dateRange,
    setTimeFilter: adminStore.setTimeFilter,
    setCustomDateRange: adminStore.setDateRange
  }

  const exportDetailedData = useCallback(() => {
    const detailedData = adminStore.detailedData

    if (!detailedData.length) {
      alert('No hay datos detallados disponibles para exportar')
      return
    }

    const selectedSubadmin = adminStore.selectedSubadmin
    const dataToExport = selectedSubadmin
      ? detailedData.filter(subadmin => subadmin.id === selectedSubadmin)
      : detailedData

    const csvRows = []

    csvRows.push('Subadmin,Email,Total Managers,Total Clientes,Total Préstamos')

    dataToExport.forEach(subadmin => {
      csvRows.push([
        subadmin.name,
        subadmin.email,
        subadmin.managersCount,
        subadmin.totalClients || 0,
        subadmin.totalLoans || 0
      ].join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admin-reportes-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [adminStore])

  return {
    ...reportsData,
    ...dashboardData,
    selectedSubadmin: adminStore.selectedSubadmin,
    setSelectedSubadmin: adminStore.setSelectedSubadmin,
    subadminOptions: adminStore.getSubadminOptions(),
    exportDetailedData,
    isAnyLoading: reportsData.isLoading || (!adminStore.basicData.length && !adminStore.isBasicDataFresh())
  }
}

export const useAdminReports = useAdminReportsConsumer