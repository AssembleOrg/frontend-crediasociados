'use client'

import { useState, useCallback, useRef } from 'react'
import { analyticsService } from '@/services/analytics.service'
import { managerService } from '@/services/manager.service'
import { useAuth } from '@/hooks/useAuth'
import type { SubadminAnalytics, ManagerAnalytics } from '@/services/analytics.service'
import type { ClientChartDataDto, LoanChartDataDto } from '@/services/manager.service'

/**
 * Helper function to calculate manager analytics from chart data
 * Uses pre-calculated metrics from backend chart endpoints
 */
const calculateManagerAnalyticsFromChartData = (
  manager: { managerId: string; managerName: string; managerEmail: string; createdAt: string },
  clientsChart: ClientChartDataDto[],
  loansChart: LoanChartDataDto[]
): ManagerAnalytics => {
  // Total clients with active loans (from clients chart data)
  const totalClients = clientsChart.filter(client => client.activeLoans > 0).length

  // Total active loans (from loans chart data)
  const activeLoans = loansChart.filter(loan => loan.status === 'ACTIVE')
  const totalLoans = activeLoans.length

  // Total amounts from loans chart (pre-calculated by backend)
  const totalAmountLent = activeLoans.reduce((sum, loan) => sum + loan.originalAmount, 0)
  const totalAmountPending = activeLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0)

  // Collection rate calculation
  const totalPaid = activeLoans.reduce((sum, loan) => sum + loan.paidAmount, 0)
  const collectionRate = totalAmountLent > 0 ? (totalPaid / totalAmountLent) * 100 : 0

  return {
    managerId: manager.managerId,
    managerName: manager.managerName,
    managerEmail: manager.managerEmail,
    totalClients,
    totalLoans,
    totalAmountLent,
    totalAmountPending,
    collectionRate,
    createdAt: manager.createdAt
  }
}

interface AnalyticsState {
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  analytics: SubadminAnalytics | null
}

/**
 * Hook for Subadmin Analytics
 * Follows 4-layer architecture: auto-initialization + business logic orchestration
 */
export const useSubadminAnalytics = () => {
  const { user } = useAuth()
  const [state, setState] = useState<AnalyticsState>({
    isLoading: false,
    isInitialized: false,
    error: null,
    analytics: null
  })

  // Refs to prevent race conditions
  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const initializeAnalytics = useCallback(async (): Promise<void> => {
    // Only subadmins can access analytics
    if (!user || user.role !== 'subadmin') {
      setState(prev => ({
        ...prev,
        error: 'Solo los subadmins pueden acceder a analytics',
        isInitialized: true
      }))
      return
    }

    // Prevent double initialization
    if (initializationRef.current) return
    initializationRef.current = true

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Cancel previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      // Step 1: Get basic analytics structure (managers created by this subadmin)
      console.log('🔍 [DEBUG] Analytics - Fetching managers for subadmin:', user?.id || '')
      const basicAnalytics = await analyticsService.getSubadminAnalytics(user?.id || '')
      console.log('🔍 [DEBUG] Analytics - Basic analytics received:', basicAnalytics)

      if (!basicAnalytics.managers || basicAnalytics.managers.length === 0) {
        setState(prev => ({
          ...prev,
          analytics: {
            totalManagers: 0,
            totalClients: 0,
            totalLoans: 0,
            totalAmountLent: 0,
            totalAmountPending: 0,
            averageCollectionRate: 0,
            managers: []
          },
          isLoading: false,
          isInitialized: true
        }))
        return
      }

      // Step 2: Use new backend endpoints to get real manager analytics
      const managersWithAnalytics: ManagerAnalytics[] = []

      for (const manager of basicAnalytics.managers) {
        try {
          console.log('🔍 [DEBUG] Analytics - Fetching chart data for manager:', {
            managerId: manager.managerId,
            managerName: manager.managerName
          })

          // Use new chart endpoints for pre-calculated metrics
          const [clientsChart, loansChart] = await Promise.all([
            managerService.getManagerClientsChart(manager.managerId, {}),
            managerService.getManagerLoansChart(manager.managerId, {})
          ])

          // Calculate analytics from chart data
          const managerAnalytics = calculateManagerAnalyticsFromChartData(
            manager,
            clientsChart,
            loansChart
          )

          console.log('🔍 [DEBUG] Analytics - Manager analytics calculated:', {
            managerId: manager.managerId,
            totalClients: managerAnalytics.totalClients,
            totalLoans: managerAnalytics.totalLoans,
            totalAmountLent: managerAnalytics.totalAmountLent
          })

          managersWithAnalytics.push(managerAnalytics)
        } catch (error) {
          console.warn(`Error al obtener datos del manager ${manager.managerName}:`, error)
          // Include manager with zero values if there's an error
          managersWithAnalytics.push({
            managerId: manager.managerId,
            managerName: manager.managerName,
            managerEmail: manager.managerEmail,
            totalClients: 0,
            totalLoans: 0,
            totalAmountLent: 0,
            totalAmountPending: 0,
            collectionRate: 0,
            createdAt: manager.createdAt
          })
        }
      }

      // Step 3: Calculate totals from all managers
      const totals = analyticsService.calculateSubadminTotals(managersWithAnalytics)

      const completeAnalytics: SubadminAnalytics = {
        ...totals,
        managers: managersWithAnalytics
      }

      setState(prev => ({
        ...prev,
        analytics: completeAnalytics,
        isLoading: false,
        isInitialized: true
      }))

    } catch (error: unknown) {
      if ((error as Error).name !== 'AbortError') {
        const errorMessage = (error as Error).message || 'Error al cargar analytics'
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          isInitialized: true
        }))
      }
    } finally {
      initializationRef.current = false
    }
  }, [user])

  const refreshAnalytics = useCallback(async (): Promise<void> => {
    initializationRef.current = false
    await initializeAnalytics()
  }, [initializeAnalytics])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    initializeAnalytics,
    refreshAnalytics,
    clearError
  }
}