'use client'

import { useState, useCallback, useRef } from 'react'
import { reportsService } from '@/services/reports.service'
import { loansService } from '@/services/loans.service'
import { useAuth } from '@/hooks/useAuth'
import type { AdminReportData, UserReportData } from '@/services/reports.service'

interface AdminReportsState {
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  reports: AdminReportData | null
}

/**
 * Hook for Admin Reports
 * Follows 4-layer architecture: auto-initialization + business logic orchestration
 */
export const useAdminReports = () => {
  const { user } = useAuth()
  const [state, setState] = useState<AdminReportsState>({
    isLoading: false,
    isInitialized: false,
    error: null,
    reports: null
  })

  // Refs to prevent race conditions
  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const initializeReports = useCallback(async (): Promise<void> => {
    // Only admins can access reports
    if (!user || user.role !== 'admin') {
      setState(prev => ({
        ...prev,
        error: 'Solo los administradores pueden acceder a reportes',
        isInitialized: true
      }))
      return
    }

    // Prevent double initialization
    if (initializationRef.current) return
    initializationRef.current = true

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      console.log('🔍 [DEBUG] Admin Reports - Starting data fetch...')

      // Step 1: Get subadmins created by this admin
      const subadmins = await reportsService.getCreatedUsers(user?.id || '')
      console.log('🔍 [DEBUG] Admin Reports - Subadmins found:', subadmins.length)

      // Step 2: For each subadmin, get their basic info (no loan data since admins don't typically manage loans)
      const subadminsWithReports: UserReportData[] = []

      for (const subadmin of subadmins) {
        try {
          console.log('🔍 [DEBUG] Admin Reports - Processing subadmin:', subadmin.fullName, subadmin.id)

          // Use hierarchical aggregation: subadmin → managers → chart endpoints
          const subadminReportData = await reportsService.getSubadminAggregatedMetrics(subadmin)

          console.log('🔍 [DEBUG] Admin Reports - Subadmin aggregated metrics:', {
            userId: subadminReportData.userId,
            totalClients: subadminReportData.totalClients,
            totalLoans: subadminReportData.totalLoans,
            totalAmountLent: subadminReportData.totalAmountLent
          })

          subadminsWithReports.push(subadminReportData)
        } catch (error) {
          console.warn(`Error al obtener datos del subadmin ${subadmin.fullName}:`, error)
          // Include subadmin with zero values if there's an error
          subadminsWithReports.push({
            userId: subadmin.id,
            userName: subadmin.fullName,
            userEmail: subadmin.email,
            userRole: subadmin.role,
            totalClients: 0,
            totalLoans: 0,
            totalAmountLent: 0,
            totalAmountPending: 0,
            collectionRate: 0,
            createdAt: subadmin.createdAt
          })
        }
      }

      // Step 3: Get admin's own data (since they might also be a prestamista)
      let adminOwnData: UserReportData | null = null
      try {
        console.log('🔍 [DEBUG] Admin Reports - Fetching admin own loan data...')
        const adminLoans = await loansService.getAllLoans()

        if (adminLoans && adminLoans.length > 0) {
          adminOwnData = reportsService.calculateUserMetrics(
            {
              id: user?.id || '',
              fullName: 'Admin',
              email: user?.email || '',
              role: 'ADMIN',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              clientQuota: 0,
              usedClientQuota: 0,
              availableClientQuota: 0
            },
            adminLoans as any
          )
          console.log('🔍 [DEBUG] Admin Reports - Admin own data:', {
            totalLoans: adminOwnData.totalLoans,
            totalClients: adminOwnData.totalClients,
            totalAmountLent: adminOwnData.totalAmountLent
          })
        }
      } catch (error) {
        console.warn('Error fetching admin own data:', error)
      }

      // Step 4: Calculate totals (including admin's own data if available)
      const allUsersData = adminOwnData
        ? [...subadminsWithReports, adminOwnData]
        : subadminsWithReports

      const totals = reportsService.calculateTotalMetrics(allUsersData)

      const completeReports: AdminReportData = {
        ...totals,
        totalUsers: subadminsWithReports.length, // Only count subadmins, not admin
        subadmins: allUsersData
      }

      console.log('🔍 [DEBUG] Admin Reports - Final reports:', {
        totalSubadmins: completeReports.totalUsers,
        totalClients: completeReports.totalClients,
        totalLoans: completeReports.totalLoans,
        includesAdminOwnData: !!adminOwnData
      })

      setState(prev => ({
        ...prev,
        reports: completeReports,
        isLoading: false,
        isInitialized: true
      }))

    } catch (error: unknown) {
      if ((error as Error).name !== 'AbortError') {
        const errorMessage = (error as Error).message || 'Error al cargar reportes'
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

  const refreshReports = useCallback(async (): Promise<void> => {
    initializationRef.current = false
    await initializeReports()
  }, [initializeReports])

  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    reports: state.reports,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
    initializeReports,
    refreshReports,
    clearError
  }
}