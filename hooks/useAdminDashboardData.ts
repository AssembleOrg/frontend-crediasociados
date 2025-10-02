'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAdminStore } from '@/stores/admin'
import { useAuth } from '@/hooks/useAuth'
import { reportsService } from '@/services/reports.service'
import { managerService } from '@/services/manager.service'
import { useAdminCharts } from '@/hooks/useAdminCharts'

export const useAdminDashboardData = () => {
  const adminStore = useAdminStore()
  const { user: currentUser } = useAuth()
  const chartData = useAdminCharts()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchDashboardData = useCallback(async (): Promise<void> => {
    if (!currentUser || currentUser.role !== 'admin') return

    if (adminStore.hasDetailedData() && adminStore.isDetailedDataFresh()) {
      console.log('📦 [DASHBOARD] Using fresh cached data')
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

      console.log('[DASHBOARD] Loading admin dashboard data...')

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

      console.log('[DASHBOARD] Dashboard data loaded successfully')

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
  }, [currentUser, adminStore])

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchDashboardData()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [currentUser, fetchDashboardData])

  const refreshData = useCallback(() => {
    adminStore.invalidateCache()
    fetchDashboardData()
  }, [adminStore, fetchDashboardData])

  return {
    chartData,
    aggregatedTotals: adminStore.getAggregatedTotals(),
    detailedData: adminStore.detailedData,
    timeFilter: adminStore.timeFilter,
    dateRange: adminStore.dateRange,
    setTimeFilter: adminStore.setTimeFilter,
    setCustomDateRange: adminStore.setDateRange,
    isLoading,
    error,
    refreshData
  }
}