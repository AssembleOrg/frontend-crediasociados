'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAdminDashboard } from './useAdminDashboard'
import type { TimeFilter } from '@/stores/admin'

interface DateRange {
  from: Date
  to: Date
}

export const useAdminReportsWithFilters = () => {
  // Use only unified dashboard - no separate reports hook needed
  const adminDashboard = useAdminDashboard()

  // Transform detailed data into reports format
  const reports = useMemo(() => {
    if (!adminDashboard.detailedData.length) return null

    const subadmins = adminDashboard.detailedData.map(subadmin => ({
      userId: subadmin.id,
      userName: subadmin.name,
      userEmail: subadmin.email,
      userRole: 'subadmin',
      totalClients: subadmin.totalClients,
      totalLoans: subadmin.totalLoans,
      totalAmountLent: subadmin.totalAmount,
      totalAmountPending: 0, // This would need to be calculated if needed
      collectionRate: 0, // This would need to be calculated if needed
      createdAt: new Date().toISOString() // Placeholder
    }))

    return {
      totalUsers: subadmins.length,
      totalClients: subadmins.reduce((sum, s) => sum + s.totalClients, 0),
      totalLoans: subadmins.reduce((sum, s) => sum + s.totalLoans, 0),
      totalAmountLent: subadmins.reduce((sum, s) => sum + s.totalAmountLent, 0),
      totalAmountPending: 0,
      averageCollectionRate: 0,
      subadmins
    }
  }, [adminDashboard.detailedData])

  // Local filter state
  const [selectedSubadmin, setSelectedSubadmin] = useState<string | null>(null)

  // Get subadmin options from the unified dashboard
  const subadminOptions = useMemo(() => {
    const data = adminDashboard.detailedData.length > 0
      ? adminDashboard.detailedData
      : adminDashboard.basicData

    return data.map(subadmin => ({
      id: subadmin.id,
      name: subadmin.name
    }))
  }, [adminDashboard.basicData, adminDashboard.detailedData])

  // Enhanced export function that includes all detailed data
  const exportDetailedData = useCallback(() => {
    const detailedData = adminDashboard.detailedData

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
    csvRows.push('Subadmin,Email,Managers,Clientes,Prestamos,Monto Total,Manager,Manager Email,Clientes Manager,Prestamos Manager')

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
  }, [adminDashboard.detailedData, selectedSubadmin])

  return {
    // Unified dashboard data
    basicData: adminDashboard.basicData,
    detailedData: adminDashboard.detailedData,
    isBasicLoading: adminDashboard.isBasicLoading,
    isDetailedLoading: adminDashboard.isDetailedLoading,
    isInitialized: adminDashboard.isInitialized,
    chartData: adminDashboard.chartData,
    timeFilter: adminDashboard.timeFilter,
    dateRange: adminDashboard.dateRange,
    setTimeFilter: adminDashboard.setTimeFilter,
    setCustomDateRange: adminDashboard.setCustomDateRange,
    refreshData: adminDashboard.refreshData,
    hasDetailedData: adminDashboard.hasDetailedData,
    aggregatedTotals: adminDashboard.aggregatedTotals,

    // Admin reports data (transformed from unified data)
    reports,
    reportsLoading: adminDashboard.isDetailedLoading,
    reportsError: null, // Provider handles errors gracefully
    initializeReports: () => {}, // No-op, provider auto-initializes
    refreshReports: adminDashboard.refreshData,
    clearReportsError: () => {}, // No-op, no error state

    // Filter state
    selectedSubadmin,
    setSelectedSubadmin,
    subadminOptions,

    // Enhanced export
    exportDetailedData,

    // Combined loading state
    isAnyLoading: adminDashboard.isBasicLoading || adminDashboard.isDetailedLoading
  }
}