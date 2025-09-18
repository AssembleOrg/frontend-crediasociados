'use client'

import { useState, useCallback, useRef } from 'react'
import { analyticsService } from '@/services/analytics.service'
import { loansService } from '@/services/loans.service'
import { clientsService } from '@/services/clients.service'
import { useAuth } from '@/hooks/useAuth'
import type { SubadminAnalytics, ManagerAnalytics } from '@/services/analytics.service'

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
      console.log('🔍 [DEBUG] Analytics - Fetching data for subadmin:', user.id)
      const basicAnalytics = await analyticsService.getSubadminAnalytics(user.id)
      console.log('🔍 [DEBUG] Analytics - Basic analytics received:', basicAnalytics)

      if (!basicAnalytics.managers) {
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

      // Step 2: For each manager, get their detailed analytics
      const managersWithAnalytics: ManagerAnalytics[] = []

      for (const manager of basicAnalytics.managers) {
        try {
          console.log('🔍 [DEBUG] Analytics - Processing manager:', manager.managerName, manager.managerId)

          // Note: For now we only show basic manager info since we can't access manager-specific data
          // The /clients endpoint only returns clients for the authenticated user (subadmin)
          // We need a backend endpoint like /users/{managerId}/clients to get accurate data

          console.log('🔍 [DEBUG] Analytics - Processing manager with basic info:', {
            managerId: manager.managerId,
            managerName: manager.managerName,
            note: 'Cannot fetch manager-specific clients/loans with current endpoints'
          })

          const managerAnalytics: ManagerAnalytics = {
            managerId: manager.managerId,
            managerName: manager.managerName,
            managerEmail: manager.managerEmail,
            totalClients: 0, // Cannot fetch - need /users/{managerId}/clients endpoint
            totalLoans: 0, // Cannot fetch - need /users/{managerId}/loans endpoint
            totalAmountLent: 0, // Cannot calculate without loans data
            totalAmountPending: 0, // Cannot calculate without loans data
            collectionRate: 0, // Cannot calculate without loans data
            createdAt: manager.createdAt
          }

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

      // Step 3: Calculate totals
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