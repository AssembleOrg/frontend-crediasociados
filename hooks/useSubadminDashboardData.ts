'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useSubadminStore } from '@/stores/subadmin'
import { useUsersStore } from '@/stores/users'
import { useAuth } from '@/hooks/useAuth'
import { managerService } from '@/services/manager.service'

export const useSubadminDashboardData = () => {
  const subadminStore = useSubadminStore()
  const usersStore = useUsersStore()
  const { user: currentUser } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Get managers from usersStore (single source of truth) - memoized to prevent infinite loops
  const managers = useMemo(() => 
    usersStore.users.filter(u => u.role === 'prestamista'),
    [usersStore.users]
  )

  // Memoize manager IDs to use as stable dependency
  const managerIds = useMemo(() => 
    managers.map(m => m.id).sort().join(','),
    [managers]
  )

  useEffect(() => {
    // Early returns for guard conditions
    if (!currentUser || currentUser.role !== 'subadmin') return
    if (managers.length === 0) return

    // Use cache if fresh
    if (subadminStore.hasEnrichmentData() && subadminStore.isEnrichmentDataFresh()) {
      
      return
    }

    // Prevent multiple simultaneous fetches
    if (initializationRef.current) return
    initializationRef.current = true

    const fetchDashboardData = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        // Cleanup previous request if any
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        

        // Fetch enrichment data (charts) for each manager
        const enrichments: Record<string, any> = {}

        await Promise.all(
          managers.map(async (manager) => {
            try {
              const [clientsData, loansData] = await Promise.all([
                managerService.getManagerClientsChart(manager.id, {}),
                managerService.getManagerLoansChart(manager.id, {})
              ])

              enrichments[manager.id] = {
                totalClients: clientsData.length,
                totalLoans: loansData.length,
                totalAmount: loansData.reduce((sum, loan) => sum + (loan.amount || 0), 0),
                clients: clientsData,
                loans: loansData
              }
            } catch (error) {
              
              // Fallback to empty enrichment
              enrichments[manager.id] = {
                totalClients: 0,
                totalLoans: 0,
                totalAmount: 0,
                clients: [],
                loans: []
              }
            }
          })
        )

        // Store enrichments in subadminStore
        subadminStore.setManagerEnrichments(enrichments)

        

      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
          setError(errorMessage)
          
        }
      } finally {
        setIsLoading(false)
        initializationRef.current = false
      }
    }

    fetchDashboardData()

    // Cleanup on unmount or user change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      initializationRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, managerIds, refreshTrigger]) // Re-run when managers change or on manual refresh

  const refreshData = useCallback(() => {
    // Invalidate cache and trigger re-fetch
    subadminStore.invalidateCache()
    initializationRef.current = false
    setRefreshTrigger(prev => prev + 1)
  }, [subadminStore])

  // Combine managers from usersStore with enrichments from subadminStore
  const detailedManagers = managers.map(manager => ({
    ...manager,
    ...(subadminStore.managerEnrichments[manager.id] || {
      totalClients: 0,
      totalLoans: 0,
      totalAmount: 0,
      clients: [],
      loans: []
    })
  }))

  return {
    detailedManagers,
    aggregatedTotals: subadminStore.getAggregatedTotals(),
    timeFilter: subadminStore.timeFilter,
    dateRange: subadminStore.dateRange,
    setTimeFilter: subadminStore.setTimeFilter,
    setCustomDateRange: subadminStore.setDateRange,
    isLoading,
    error,
    refreshData
  }
}