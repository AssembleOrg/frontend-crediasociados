'use client'

import { useCallback } from 'react'
import { useAdminStore } from '@/stores/admin'
import { useAdminCharts } from '@/hooks/useAdminCharts'

export const useAdminDashboard = () => {
  const adminStore = useAdminStore()
  const chartData = useAdminCharts()

  const refreshData = useCallback(() => {
    adminStore.invalidateCache()
  }, [adminStore])

  // Loading states
  const isBasicLoading = !adminStore.isBasicDataFresh() && adminStore.basicData.length === 0
  const isDetailedLoading = adminStore.basicData.length > 0 && !adminStore.hasDetailedData() && !adminStore.isDetailedDataFresh()
  const isInitialized = adminStore.basicData.length > 0 || adminStore.isBasicDataFresh()

  return {
    chartData,
    aggregatedTotals: adminStore.getAggregatedTotals(),
    basicData: adminStore.basicData,
    detailedData: adminStore.detailedData,
    isBasicLoading,
    isDetailedLoading,
    isInitialized,
    hasDetailedData: adminStore.hasDetailedData(),
    timeFilter: adminStore.timeFilter,
    dateRange: adminStore.dateRange,
    setTimeFilter: adminStore.setTimeFilter,
    setCustomDateRange: adminStore.setDateRange,
    refreshData,
    error: null
  }
}

export const useAdminDashboardWithFilters = () => {
  const dashboardData = useAdminDashboard()
  const adminStore = useAdminStore()

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

