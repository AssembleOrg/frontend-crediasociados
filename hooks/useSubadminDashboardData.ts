'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSubadminStore } from '@/stores/subadmin'
import { useAuth } from '@/hooks/useAuth'
import { reportsService } from '@/services/reports.service'
import { managerService } from '@/services/manager.service'

export const useSubadminDashboardData = () => {
  const subadminStore = useSubadminStore()
  const { user: currentUser } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Early returns for guard conditions
    if (!currentUser || currentUser.role !== 'subadmin') return

    // Use cache if fresh
    if (subadminStore.hasDetailedData() && subadminStore.isDetailedDataFresh()) {
      console.log('📦 [SUBADMIN DASHBOARD] Using fresh cached data')
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

        console.log('[SUBADMIN DASHBOARD] Loading dashboard data...')

        const managers = await reportsService.getCreatedUsers(currentUser.id)

        const detailedManagersData = await Promise.all(
          managers.map(async (manager) => {
            try {
              const [clientsData, loansData] = await Promise.all([
                managerService.getManagerClientsChart(manager.id, {}),
                managerService.getManagerLoansChart(manager.id, {})
              ])

              const totalClients = clientsData.length
              const totalLoans = loansData.length
              const totalAmount = loansData.reduce((sum, loan) => sum + (loan.amount || 0), 0)

              return {
                id: manager.id,
                name: manager.fullName,
                email: manager.email,
                clientsCount: totalClients,
                totalAmount,
                totalClients,
                totalLoans,
                clients: clientsData,
                loans: loansData
              }

            } catch (error) {
              console.warn(`Error loading data for manager ${manager.fullName}:`, error)
              return {
                id: manager.id,
                name: manager.fullName,
                email: manager.email,
                clientsCount: 0,
                totalAmount: 0,
                totalClients: 0,
                totalLoans: 0,
                clients: [],
                loans: []
              }
            }
          })
        )

        subadminStore.setDetailedManagers(detailedManagersData)

        console.log('[SUBADMIN DASHBOARD] Dashboard data loaded successfully')

      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
          setError(errorMessage)
          console.error('Error loading dashboard data:', err)
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
  }, [currentUser?.id, refreshTrigger]) // Re-run on user change or manual refresh

  const refreshData = useCallback(() => {
    // Invalidate cache and trigger re-fetch
    subadminStore.invalidateCache()
    initializationRef.current = false
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return {
    detailedManagers: subadminStore.detailedManagers,
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