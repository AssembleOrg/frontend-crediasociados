import { useCallback, useEffect, useRef, useState } from 'react'
import { useSubLoansStore } from '@/stores/sub-loans'
import { useAuth } from '@/hooks/useAuth'
import { subLoansService } from '@/services/sub-loans.service'
import { subLoansLookupService } from '@/services/subloans-lookup.service'
import type { PaginationParams } from '@/types/auth'

/**
 * THE CONDUCTOR - useSubLoans Hook
 * 
 * Business logic controller that orchestrates:
 * - Async operations (API calls via service)
 * - State management (simple commands to store)  
 * - Loading states and error handling
 */
export function useSubLoans() {
  const { user: currentUser } = useAuth()
  const {
    todayDueSubLoans,
    allSubLoans,
    allSubLoansWithClient,
    stats,
    isLoading,
    error,
    pagination,
    setTodayDueSubLoans,
    setAllSubLoans,
    setAllSubLoansWithClient,
    setStats,
    setLoading,
    setError,
    setPagination,
    reset,
    getTotalDueToday,
    getOverdueCount,
    getPendingCount,
    getPaidCount,
    getTotalAmount,
  } = useSubLoansStore()

  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const hasPermissions = currentUser && ['ADMIN', 'SUBADMIN', 'MANAGER', 'prestamista'].includes(currentUser.role)

  const initializeSubLoans = useCallback(async (): Promise<void> => {
    if (initializationRef.current) return
    initializationRef.current = true

    setLoading(true)
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const response = await subLoansService.getTodayDueSubLoans({
        page: 1,
        limit: 20
      })

      setTodayDueSubLoans(response.data)
      if (response.meta) {
        setPagination({
          page: response.meta.page,
          limit: response.meta.limit,
          total: response.meta.total,
          totalPages: response.meta.totalPages
        })
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        setError(`Error al cargar préstamos que vencen hoy: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }, [setTodayDueSubLoans, setPagination, setLoading, setError])

  useEffect(() => {
    if (currentUser && hasPermissions) {
      initializeSubLoans()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const fetchTodayDueSubLoans = useCallback(async (params?: PaginationParams) => {
    if (!hasPermissions) return

    try {
      setLoading(true)
      setError(null)

      const response = await subLoansService.getTodayDueSubLoans(params)
      setTodayDueSubLoans(response.data)
      
      if (response.meta) {
        setPagination({
          page: response.meta.page,
          limit: response.meta.limit,
          total: response.meta.total,
          totalPages: response.meta.totalPages
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al cargar préstamos que vencen hoy: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [hasPermissions, setLoading, setError, setTodayDueSubLoans, setPagination])

  const fetchStats = useCallback(async () => {
    if (!hasPermissions) return

    try {
      setLoading(true)
      setError(null)

      const statsResponse = await subLoansService.getTodayDueSubLoansStats()
      setStats(statsResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al cargar estadísticas: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [hasPermissions, setLoading, setError, setStats])

  const fetchAllSubLoans = useCallback(async (params?: PaginationParams) => {
    if (!hasPermissions) return

    try {
      setLoading(true)
      setError(null)

      const response = await subLoansService.getAllSubLoans(params)
      setAllSubLoans(response.data)
      
      if (response.meta) {
        setPagination({
          page: response.meta.page,
          limit: response.meta.limit,
          total: response.meta.total,
          totalPages: response.meta.totalPages
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al cargar todos los préstamos: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [hasPermissions, setLoading, setError, setAllSubLoans, setPagination])

  const fetchAllSubLoansWithClientInfo = useCallback(async (params?: PaginationParams) => {
    if (!hasPermissions) return

    try {
      setLoading(true)
      setError(null)

      const enrichedSubLoans = await subLoansLookupService.getAllSubLoansWithClientInfo(params)
      setAllSubLoansWithClient(enrichedSubLoans)
      
      // Set basic pagination info (we'll use the length as total for now)
      setPagination({
        page: 1,
        limit: enrichedSubLoans.length,
        total: enrichedSubLoans.length,
        totalPages: 1
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al cargar préstamos con información de cliente: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [hasPermissions, setLoading, setError, setAllSubLoansWithClient, setPagination])

  const activateOverdueSubLoans = useCallback(async () => {
    if (!currentUser || !['ADMIN', 'SUBADMIN', 'prestamista'].includes(currentUser.role)) {
      setError('No tienes permisos para activar préstamos vencidos')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      const result = await subLoansService.activateTodayDueSubLoans()
      
      // Refresh data after activation
      await fetchTodayDueSubLoans()
      await fetchStats()

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al activar préstamos vencidos: ${errorMessage}`)
      return false
    } finally {
      setLoading(false)
    }
  }, [currentUser, setLoading, setError, fetchTodayDueSubLoans, fetchStats])

  return {
    todayDueSubLoans,
    allSubLoans,
    allSubLoansWithClient,
    stats,
    isLoading,
    error,
    pagination,
    fetchTodayDueSubLoans,
    fetchAllSubLoans,
    fetchAllSubLoansWithClientInfo,
    fetchStats,
    activateOverdueSubLoans,
    reset,
    getTotalDueToday,
    getOverdueCount,
    getPendingCount,
    getPaidCount,
    getTotalAmount,
    hasPermissions
  }
}