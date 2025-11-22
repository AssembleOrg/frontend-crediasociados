'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAdminStore } from '@/stores/admin'
import { useUsersStore } from '@/stores/users'
import { useAuth } from '@/hooks/useAuth'
import { reportsService } from '@/services/reports.service'
import { managerService } from '@/services/manager.service'

/**
 * useAdminDashboardData - Data Loading Hook for Admin (Layer 3)
 *
 * REFACTORED - Single Source of Truth Pattern:
 * - Reads subadmins from usersStore (canonical source)
 * - Only fetches enrichment data (charts, metrics)
 * - Combines at return for consumers
 * - No duplicate API calls to reportsService.getCreatedUsers()
 */
export const useAdminDashboardData = () => {
  const adminStore = useAdminStore()
  const usersStore = useUsersStore()
  const { user: currentUser } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Get subadmins from usersStore (canonical source of truth)
  const subadmins = usersStore.users.filter(u => u.role === 'subadmin')

  const fetchEnrichmentData = useCallback(async (): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin' || subadmins.length === 0) return

    if (adminStore.hasEnrichmentData() && adminStore.isEnrichmentDataFresh()) {
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


      // Only fetch enrichment data, NOT User[] data
      const enrichmentPromises = subadmins.map(async (subadmin) => {
        try {
          // Read managers from usersStore, not from API
          // Note: Manager list is fetched per-subadmin via API, combined here
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
          
          adminStore.setSubadminEnrichments(subadmin.id, {
            totalClients: 0,
            totalLoans: 0,
            totalAmount: 0,
            managers: []
          })
        }
      })

      await Promise.all(enrichmentPromises)
      

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load enrichment data'
        setError(errorMessage)
        
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

  const refreshData = useCallback(() => {
    adminStore.invalidateCache()
    fetchEnrichmentData()
  }, [adminStore, fetchEnrichmentData])

  // Compute chart data on the fly (avoid circular dependency with useAdminCharts)
  const chartData = {
    managersPerSubadmin: detailedSubadmins.map(subadmin => ({
      name: subadmin.fullName,
      value: subadmin.managers?.length || 0,
      subadminId: subadmin.id
    })),
    clientsEvolution: [] as Array<{ date: string; clients: number }>
  }

  return {
    // Combined data (subadmins from usersStore + enrichments from adminStore)
    detailedSubadmins,

    // Aggregated totals from enrichments
    aggregatedTotals: adminStore.getAggregatedTotals(subadmins),

    // Chart data
    chartData,

    // Filter state
    timeFilter: adminStore.timeFilter,
    dateRange: adminStore.dateRange,
    setTimeFilter: adminStore.setTimeFilter,
    setCustomDateRange: adminStore.setDateRange,

    // Loading & error states
    isLoading,
    error,

    // Manual refresh
    refreshData
  }
}