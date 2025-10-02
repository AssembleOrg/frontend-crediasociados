'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useAdminStore } from '@/stores/admin'
import { useAuth } from '@/hooks/useAuth'
import { reportsService } from '@/services/reports.service'
import { managerService } from '@/services/manager.service'
import type { TimeFilter } from '@/stores/admin'

interface DateRange {
  from: Date
  to: Date
}

export const useAdminReportsWithFilters = () => {
  const adminStore = useAdminStore()
  const { user: currentUser } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubadmin, setSelectedSubadmin] = useState<string | null>(null)

  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchReportsData = useCallback(async (): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin') return

    if (adminStore.hasDetailedData() && adminStore.isDetailedDataFresh()) {
      console.log('📦 [REPORTS] Using fresh cached data')
      return
    }

    if (initializationRef.current) return
    initializationRef.current = true

    setIsLoading(true)
    setError(null)

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      console.log('[REPORTS] Loading reports data...')

      const subadmins = await reportsService.getCreatedUsers(currentUser.id)

      const detailedSubadminsData = await Promise.all(
        subadmins.map(async (subadmin) => {
          try {
            const managers = await reportsService.getCreatedUsers(subadmin.id)

            const managersWithData = await Promise.all(
              managers.map(async (manager) => {
                try {
                  const [clientsData, loansData] = await Promise.all([
                    managerService.getManagerClientsChart(manager.id, {}),
                    managerService.getManagerLoansChart(manager.id, {})
                  ])

                  return {
                    id: manager.id,
                    name: manager.fullName,
                    email: manager.email,
                    clients: clientsData,
                    loans: loansData
                  }
                } catch (error) {
                  console.warn(`Error loading data for manager ${manager.fullName}:`, error)
                  return {
                    id: manager.id,
                    name: manager.fullName,
                    email: manager.email,
                    clients: [],
                    loans: []
                  }
                }
              })
            )

            const totalClients = managersWithData.reduce((sum, manager) =>
              sum + manager.clients.length, 0
            )

            const totalLoans = managersWithData.reduce((sum, manager) =>
              sum + manager.loans.length, 0
            )

            return {
              id: subadmin.id,
              name: subadmin.fullName,
              email: subadmin.email,
              managersCount: managers.length,
              totalClients,
              totalLoans,
              managers: managersWithData
            }

          } catch (error) {
            console.warn(`Error loading data for ${subadmin.fullName}:`, error)
            return {
              id: subadmin.id,
              name: subadmin.fullName,
              email: subadmin.email,
              managersCount: 0,
              totalClients: 0,
              totalLoans: 0,
              managers: []
            }
          }
        })
      )

      adminStore.setDetailedData(detailedSubadminsData)

      console.log('[REPORTS] Reports data loaded successfully')

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load reports data'
        setError(errorMessage)
        console.error('Error loading reports data:', err)
      }
    } finally {
      setIsLoading(false)
      initializationRef.current = false
    }
  }, [currentUser, adminStore])

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchReportsData()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [currentUser, fetchReportsData])

  const reports = useMemo(() => {
    if (!adminStore.detailedData.length) return null

    const subadmins = adminStore.detailedData.map(subadmin => ({
      userId: subadmin.id,
      userName: subadmin.name,
      userEmail: subadmin.email,
      userRole: 'subadmin',
      totalClients: subadmin.totalClients,
      totalLoans: subadmin.totalLoans,
      totalAmountLent: 0,
      totalAmountPending: 0,
      collectionRate: 0,
      createdAt: new Date().toISOString()
    }))

    return {
      totalUsers: subadmins.length,
      totalClients: subadmins.reduce((sum, s) => sum + s.totalClients, 0),
      totalLoans: subadmins.reduce((sum, s) => sum + s.totalLoans, 0),
      totalAmountLent: 0,
      totalAmountPending: 0,
      averageCollectionRate: 0,
      subadmins
    }
  }, [adminStore.detailedData])

  const subadminOptions = useMemo(() => {
    return adminStore.detailedData.map(subadmin => ({
      id: subadmin.id,
      name: subadmin.name
    }))
  }, [adminStore.detailedData])

  const exportDetailedData = useCallback(() => {
    const detailedData = adminStore.detailedData

    if (!detailedData.length) {
      alert('No hay datos detallados disponibles para exportar')
      return
    }

    const dataToExport = selectedSubadmin
      ? detailedData.filter(subadmin => subadmin.id === selectedSubadmin)
      : detailedData

    const csvRows = []

    csvRows.push('Subadmin,Email,Managers,Clientes,Prestamos,Manager,Manager Email,Clientes Manager,Prestamos Manager')

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
  }, [adminStore.detailedData, selectedSubadmin])

  const refreshData = useCallback(() => {
    adminStore.invalidateCache()
    fetchReportsData()
  }, [adminStore, fetchReportsData])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const dataCount = useMemo(() => {
    const detailedData = adminStore.detailedData
    return {
      totalSubadmins: detailedData.length,
      totalManagers: detailedData.reduce((sum, s) => sum + s.managersCount, 0),
      totalClients: detailedData.reduce((sum, s) => sum + (s.totalClients || 0), 0)
    }
  }, [adminStore.detailedData])

  return {
    basicData: adminStore.basicData,
    detailedData: adminStore.detailedData,
    isBasicLoading: isLoading,
    isDetailedLoading: false,
    isInitialized: adminStore.detailedData.length > 0,
    timeFilter: adminStore.timeFilter,
    dateRange: adminStore.dateRange,
    setTimeFilter: adminStore.setTimeFilter,
    setCustomDateRange: adminStore.setDateRange,
    refreshData,
    reports,
    reportsLoading: isLoading,
    reportsError: error,
    clearReportsError: clearError,
    selectedSubadmin,
    setSelectedSubadmin,
    subadminOptions,
    exportDetailedData,
    isAnyLoading: isLoading,
    dataCount
  }
}