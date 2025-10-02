'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSubadminStore } from '@/stores/subadmin'
import { useSubadminAnalytics } from '@/hooks/useSubadminAnalytics'

export const useSubadminReportsWithFilters = () => {
  const subadminStore = useSubadminStore()
  const {
    analytics,
    isLoading,
    isInitialized,
    error,
    initializeAnalytics,
    refreshAnalytics,
    clearError
  } = useSubadminAnalytics()

  const [selectedManager, setSelectedManager] = useState<string | null>(null)

  useEffect(() => {
    if (!isInitialized) {
      initializeAnalytics()
    }
  }, [isInitialized, initializeAnalytics])

  const managerOptions = useMemo(() => {
    if (!analytics) return []
    return analytics.managers.map(manager => ({
      id: manager.managerId,
      name: manager.managerName
    }))
  }, [analytics])

  const filteredManagers = useMemo(() => {
    if (!analytics) return []
    if (!selectedManager) return analytics.managers

    return analytics.managers.filter(manager => manager.managerId === selectedManager)
  }, [analytics, selectedManager])

  const filteredTotals = useMemo(() => {
    if (!analytics) {
      return {
        totalManagers: 0,
        totalClients: 0,
        totalLoans: 0,
        totalAmountLent: 0
      }
    }

    if (!selectedManager) {
      return {
        totalManagers: analytics.totalManagers,
        totalClients: analytics.totalClients,
        totalLoans: analytics.totalLoans,
        totalAmountLent: analytics.totalAmountLent
      }
    }

    const manager = analytics.managers.find(m => m.managerId === selectedManager)
    return {
      totalManagers: 1,
      totalClients: manager?.totalClients || 0,
      totalLoans: manager?.totalLoans || 0,
      totalAmountLent: manager?.totalAmountLent || 0
    }
  }, [analytics, selectedManager])

  const exportDetailedData = useCallback(() => {
    if (!analytics) {
      alert('No hay datos disponibles para exportar')
      return
    }

    const managersToExport = selectedManager
      ? analytics.managers.filter(manager => manager.managerId === selectedManager)
      : analytics.managers

    if (!managersToExport.length) {
      alert('No hay datos disponibles para exportar')
      return
    }

    const csvRows = []
    csvRows.push('Manager,Email,Clientes,Préstamos,Monto Total,Monto Pendiente,Tasa Cobranza,Fecha Registro')

    managersToExport.forEach(manager => {
      csvRows.push([
        manager.managerName,
        manager.managerEmail,
        manager.totalClients,
        manager.totalLoans,
        manager.totalAmountLent,
        manager.totalAmountPending,
        `${manager.collectionRate.toFixed(1)}%`,
        new Date(manager.createdAt).toLocaleDateString('es-AR')
      ].join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `subadmin-reportes${selectedManager ? '-filtrado' : ''}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [analytics, selectedManager])

  return {
    // Original data
    analytics,
    isLoading,
    isInitialized,
    error,
    clearError,
    refreshAnalytics,

    // Filtered data
    filteredManagers,
    filteredTotals,

    // Filter state
    selectedManager,
    setSelectedManager,
    managerOptions,

    // Export
    exportDetailedData,

    // Time filters from store
    timeFilter: subadminStore.timeFilter,
    dateRange: subadminStore.dateRange,
    setTimeFilter: subadminStore.setTimeFilter,
    setCustomDateRange: subadminStore.setDateRange,

    // Status
    hasManagers: !!analytics && analytics.managers.length > 0
  }
}