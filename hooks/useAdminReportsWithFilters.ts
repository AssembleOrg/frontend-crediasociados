'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useAdminStore } from '@/stores/admin'
import { useUsersStore } from '@/stores/users'
import { useAuth } from '@/hooks/useAuth'
import { managerService } from '@/services/manager.service'

/**
 * useAdminReportsWithFilters - Data Loading Hook for Admin Reports (Layer 3)
 *
 * REFACTORED - Single Source of Truth Pattern:
 * - Reads subadmins from usersStore (canonical source)
 * - Only fetches enrichment data (charts, metrics)
 * - Combines at return for consumers
 * - No duplicate API calls to reportsService.getCreatedUsers()
 */
export const useAdminReportsWithFilters = () => {
  const adminStore = useAdminStore()
  const usersStore = useUsersStore()
  const { user: currentUser } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubadmin, setSelectedSubadmin] = useState<string | null>(null)

  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Get subadmins from usersStore (canonical source of truth)
  const subadmins = usersStore.users.filter(u => u.role === 'subadmin')

  const fetchEnrichmentData = useCallback(async (): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin' || subadmins.length === 0) return

    if (adminStore.hasEnrichmentData() && adminStore.isEnrichmentDataFresh()) {
      console.log('📦 [ADMIN REPORTS] Using fresh cached enrichments')
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

      console.log('[ADMIN REPORTS] Loading enrichment data (charts/metrics)...')

      // Only fetch enrichment data, NOT User[] data
      const enrichmentPromises = subadmins.map(async (subadmin) => {
        try {
          // Read managers from usersStore, not from API
          const managers = usersStore.users.filter(u => u.role === 'prestamista')

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

          const totalAmount = managersWithData.reduce((sum, manager) =>
            sum + (manager.loans?.reduce((s: number, loan: any) => s + (loan.amount || 0), 0) || 0), 0
          )

          // Store enrichment data (NOT the User object)
          adminStore.setSubadminEnrichments(subadmin.id, {
            totalClients,
            totalLoans,
            totalAmount,
            managers: managersWithData
          })

        } catch (error) {
          console.warn(`Error loading enrichments for ${subadmin.fullName}:`, error)
          adminStore.setSubadminEnrichments(subadmin.id, {
            totalClients: 0,
            totalLoans: 0,
            totalAmount: 0,
            managers: []
          })
        }
      })

      await Promise.all(enrichmentPromises)
      console.log('[ADMIN REPORTS] Enrichment data loaded successfully')

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load enrichment data'
        setError(errorMessage)
        console.error('Error loading enrichment data:', err)
      }
    } finally {
      setIsLoading(false)
      initializationRef.current = false
    }
  }, [currentUser, adminStore, subadmins, usersStore])

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin' && subadmins.length > 0) {
      fetchEnrichmentData()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [currentUser, subadmins.length, fetchEnrichmentData])

  // Combine subadmins from usersStore with enrichments from adminStore
  const detailedSubadmins = subadmins.map(subadmin => ({
    ...subadmin,
    ...(adminStore.subadminEnrichments[subadmin.id] || {
      totalClients: 0,
      totalLoans: 0,
      totalAmount: 0,
      managers: []
    })
  }))

  const reports = useMemo(() => {
    if (detailedSubadmins.length === 0) return null

    const subadminsReport = detailedSubadmins.map(subadmin => ({
      userId: subadmin.id,
      userName: subadmin.fullName,
      userEmail: subadmin.email,
      userRole: 'subadmin' as const,
      totalClients: subadmin.totalClients || 0,
      totalLoans: subadmin.totalLoans || 0,
      totalAmountLent: subadmin.totalAmount || 0,
      totalAmountPending: 0,
      collectionRate: 0,
      createdAt: subadmin.createdAt.toISOString()
    }))

    return {
      totalUsers: subadminsReport.length,
      totalClients: subadminsReport.reduce((sum, s) => sum + s.totalClients, 0),
      totalLoans: subadminsReport.reduce((sum, s) => sum + s.totalLoans, 0),
      totalAmountLent: subadminsReport.reduce((sum, s) => sum + s.totalAmountLent, 0),
      totalAmountPending: 0,
      averageCollectionRate: 0,
      subadmins: subadminsReport
    }
  }, [detailedSubadmins])

  const subadminOptions = useMemo(() => {
    return adminStore.getSubadminOptions(subadmins)
  }, [adminStore, subadmins])

  const exportDetailedData = useCallback(() => {
    if (detailedSubadmins.length === 0) {
      alert('No hay datos detallados disponibles para exportar')
      return
    }

    const dataToExport = selectedSubadmin
      ? detailedSubadmins.filter(subadmin => subadmin.id === selectedSubadmin)
      : detailedSubadmins

    const csvRows = []

    csvRows.push('Subadmin,Email,Managers,Clientes,Prestamos,Manager,Manager Email,Clientes Manager,Prestamos Manager')

    dataToExport.forEach(subadmin => {
      if (subadmin.managers && subadmin.managers.length > 0) {
        subadmin.managers.forEach(manager => {
          const managerClients = manager.clients?.length || 0
          const managerLoans = manager.loans?.length || 0

          csvRows.push([
            subadmin.fullName,
            subadmin.email,
            subadmin.managers.length,
            subadmin.totalClients,
            subadmin.totalLoans,
            manager.name,
            manager.email,
            managerClients,
            managerLoans
          ].join(','))
        })
      } else {
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
    link.download = `admin-reportes-detallado-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [detailedSubadmins, selectedSubadmin])

  const refreshData = useCallback(() => {
    adminStore.invalidateCache()
    fetchEnrichmentData()
  }, [adminStore, fetchEnrichmentData])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const dataCount = useMemo(() => {
    return {
      totalSubadmins: detailedSubadmins.length,
      totalManagers: detailedSubadmins.reduce((sum, s) => sum + (s.managers?.length || 0), 0),
      totalClients: detailedSubadmins.reduce((sum, s) => sum + (s.totalClients || 0), 0)
    }
  }, [detailedSubadmins])

  return {
    // Combined data (subadmins from usersStore + enrichments from adminStore)
    detailedData: detailedSubadmins,

    // Aggregated totals from enrichments
    aggregatedTotals: adminStore.getAggregatedTotals(subadmins),

    // Filter state
    timeFilter: adminStore.timeFilter,
    dateRange: adminStore.dateRange,
    setTimeFilter: adminStore.setTimeFilter,
    setCustomDateRange: adminStore.setDateRange,

    // Loading & error states
    isLoading,
    error,
    reportsLoading: isLoading,
    reportsError: error,
    clearReportsError: clearError,
    isInitialized: detailedSubadmins.length > 0,
    isAnyLoading: isLoading,

    // Reports data
    reports,

    // Subadmin selection
    selectedSubadmin,
    setSelectedSubadmin,
    subadminOptions,

    // Export functionality
    exportDetailedData,

    // Data count
    dataCount,

    // Manual refresh
    refreshData
  }
}