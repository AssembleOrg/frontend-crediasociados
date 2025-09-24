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

  // Manual refresh method
  const refreshReports = useCallback(() => {
    // ✅ KISS: Direct store invalidation - provider will detect and refetch
    adminStore.invalidateCache()
  }, [adminStore]) // ✅ Store reference is stable

  const clearError = useCallback(() => {
    // No local error state since provider handles errors gracefully
    console.log('Clear error called - provider handles errors gracefully')
  }, [])

  // Initialize method (for compatibility with existing code)
  const initializeReports = useCallback(() => {
    // Provider auto-initializes, but allow manual trigger
    refreshReports()
  }, [refreshReports])

  return {
    // Reports data from store
    reports: adminStore.reports,

    // Loading state derived from data freshness
    isLoading: !adminStore.isBasicDataFresh() && !adminStore.reports,
    isInitialized: !!adminStore.reports || adminStore.isBasicDataFresh(),

    // No error state - provider handles errors gracefully
    error: null,

    // Methods
    initializeReports,
    refreshReports,
    clearError
  }
}

/**
 * Enhanced reports hook with filtering capabilities
 */
export const useAdminReportsWithFilters = () => {
  const reportsData = useAdminReportsConsumer()
  const adminStore = useAdminStore()

  // Also get dashboard data for filtering UI
  const dashboardData = {
    basicData: adminStore.basicData,
    detailedData: adminStore.detailedData,
    isInitialized: adminStore.basicData.length > 0,
    timeFilter: adminStore.timeFilter,
    dateRange: adminStore.dateRange,
    setTimeFilter: adminStore.setTimeFilter,
    setCustomDateRange: adminStore.setDateRange
  }

  // Enhanced export function
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

    // Create comprehensive CSV content for reports
    const csvRows = []

    // Headers for reports
    csvRows.push('Subadmin,Email,Total Managers,Total Clientes,Total Préstamos,Monto Total Gestionado,Monto Pendiente,Tasa Cobranza %')

    // Data rows - aggregated view
    dataToExport.forEach(subadmin => {
      // Calculate totals from managers
      const totalAmount = subadmin.totalAmount || 0
      const totalPending = subadmin.managers?.reduce((sum, manager) => {
        const pendingAmount = manager.loans?.reduce((loanSum, loan) => {
          return loanSum + (loan.remainingAmount || 0)
        }, 0) || 0
        return sum + pendingAmount
      }, 0) || 0

      const collectionRate = totalAmount > 0 ? ((totalAmount - totalPending) / totalAmount * 100).toFixed(2) : '0.00'

      csvRows.push([
        subadmin.name,
        subadmin.email,
        subadmin.managersCount,
        subadmin.totalClients || 0,
        subadmin.totalLoans || 0,
        totalAmount.toLocaleString(),
        totalPending.toLocaleString(),
        collectionRate
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
    // Reports data
    ...reportsData,

    // Dashboard data for filtering UI
    ...dashboardData,

    // Filter state
    selectedSubadmin: adminStore.selectedSubadmin,
    setSelectedSubadmin: adminStore.setSelectedSubadmin,
    subadminOptions: adminStore.getSubadminOptions(),

    // Export functionality
    exportDetailedData,

    // Combined loading state
    isAnyLoading: reportsData.isLoading || (!adminStore.basicData.length && !adminStore.isBasicDataFresh())
  }
}

// Backward compatibility exports
export const useAdminReports = useAdminReportsConsumer