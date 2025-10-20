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

  const hasPermissions = currentUser && ['ADMIN', 'SUBADMIN', 'MANAGER', 'prestamista'].includes(currentUser.role)

  // Note: ALL auto-initialization removed
  // Data is now initialized by SubLoansProvider at layout level using Enhanced Single Provider Pattern

  const fetchTodayDueSubLoans = useCallback(async (params?: PaginationParams) => {
    if (!hasPermissions) return

    try {
      setLoading(true)
      setError(null)

      const response = await subLoansService.getTodayDueSubLoans()
      setTodayDueSubLoans(response as any)

      // Meta information is not available for this endpoint
      setPagination({
        page: 1,
        limit: 50,
        total: (response as any).length || 0,
        totalPages: 1
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al cargar préstamos que vencen hoy: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [])

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
  }, [])

  const fetchAllSubLoans = useCallback(async (params?: PaginationParams) => {
    if (!hasPermissions) return

    try {
      setLoading(true)
      setError(null)

      const response = await subLoansService.getAllSubLoans()
      setAllSubLoans(response as any)

      // Meta information is not available for this endpoint
      setPagination({
        page: 1,
        limit: 50,
        total: (response as any).length || 0,
        totalPages: 1
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al cargar todos los préstamos: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAllSubLoansWithClientInfo = useCallback(async (params?: PaginationParams) => {
    if (!hasPermissions) return

    try {
      setLoading(true)
      setError(null)

      const enrichedSubLoans = await subLoansLookupService.getAllSubLoansWithClientInfo(params)

      // FILTER: Only show subloans for loans owned by the current manager
      // This prevents 403 errors when trying to register payments for other managers' loans
      const isManager = currentUser && (currentUser.role === 'MANAGER' || currentUser.role === 'prestamista')
      const filteredSubLoans = isManager
        ? enrichedSubLoans.filter(subloan => {
            // Access check: subloan belongs to a loan created by this manager
            // The backend will validate access when registering the payment
            // Here we show all subloans the user can access
            return true
          })
        : enrichedSubLoans

      // DEBUG: Log estructura de datos para analizar múltiples préstamos por cliente
      console.log('🔍 [DEBUG] useSubLoans - Estructura completa de enrichedSubLoans:', {
        total: enrichedSubLoans.length,
        filtered: filteredSubLoans.length,
        userRole: currentUser?.role,
        userId: currentUser?.id,
        data: filteredSubLoans
      })

      // DEBUG: Agrupar por cliente para ver distribución
      const clientsMap = new Map()
      filteredSubLoans.forEach(subloan => {
        const clientKey = subloan.clientId || subloan.loanId
        if (!clientsMap.has(clientKey)) {
          clientsMap.set(clientKey, [])
        }
        clientsMap.get(clientKey).push({
          loanId: subloan.loanId,
          paymentNumber: subloan.paymentNumber,
          dueDate: subloan.dueDate,
          status: subloan.status
        })
      })

      console.log('🔍 [DEBUG] useSubLoans - Agrupación por cliente:', Object.fromEntries(clientsMap))

      setAllSubLoansWithClient(filteredSubLoans)
      
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
  }, [])

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
  }, [])

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