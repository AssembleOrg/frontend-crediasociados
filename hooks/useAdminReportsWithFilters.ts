'use client'

import { useState, useCallback, useMemo } from 'react'
import { useProgressiveAdminDashboard } from './useProgressiveAdminDashboard'
import { useAdminReports } from './useAdminReports'
import type { TimeFilter } from './useProgressiveAdminDashboard'

interface DateRange {
  from: Date
  to: Date
}

export const useAdminReportsWithFilters = () => {
  // Use existing hooks
  const progressiveDashboard = useProgressiveAdminDashboard()
  const adminReports = useAdminReports()

  // Local filter state
  const [selectedSubadmin, setSelectedSubadmin] = useState<string | null>(null)

  // Get subadmin options from the progressive dashboard
  const subadminOptions = useMemo(() => {
    const data = progressiveDashboard.detailedData.length > 0
      ? progressiveDashboard.detailedData
      : progressiveDashboard.basicData

    return data.map(subadmin => ({
      id: subadmin.id,
      name: subadmin.name
    }))
  }, [progressiveDashboard.basicData, progressiveDashboard.detailedData])

  // Enhanced export function that includes all detailed data
  const exportDetailedData = useCallback(() => {
    const detailedData = progressiveDashboard.detailedData

    if (!detailedData.length) {
      alert('No hay datos detallados disponibles para exportar')
      return
    }

    // Filter data if a subadmin is selected
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
    link.download = `admin-reportes-detallado-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [progressiveDashboard.detailedData, selectedSubadmin])

  return {
    // Progressive dashboard data (specific properties to avoid conflicts)
    basicData: progressiveDashboard.basicData,
    detailedData: progressiveDashboard.detailedData,
    isBasicLoading: progressiveDashboard.isBasicLoading,
    isDetailedLoading: progressiveDashboard.isDetailedLoading,
    isInitialized: progressiveDashboard.isInitialized,
    chartData: progressiveDashboard.chartData,
    timeFilter: progressiveDashboard.timeFilter,
    dateRange: progressiveDashboard.dateRange,
    setTimeFilter: progressiveDashboard.setTimeFilter,
    setCustomDateRange: progressiveDashboard.setCustomDateRange,
    refreshData: progressiveDashboard.refreshData,
    hasDetailedData: progressiveDashboard.hasDetailedData,
    cleanup: progressiveDashboard.cleanup,
    // Dashboard error renamed to avoid conflict
    dashboardError: progressiveDashboard.error,

    // Admin reports data
    reports: adminReports.reports,
    reportsLoading: adminReports.isLoading,
    reportsError: adminReports.error,
    initializeReports: adminReports.initializeReports,
    refreshReports: adminReports.refreshReports,
    clearReportsError: adminReports.clearError,

    // Filter state
    selectedSubadmin,
    setSelectedSubadmin,
    subadminOptions,

    // Enhanced export
    exportDetailedData,

    // Combined loading state
    isAnyLoading: progressiveDashboard.isBasicLoading || progressiveDashboard.isDetailedLoading || adminReports.isLoading
  }
}