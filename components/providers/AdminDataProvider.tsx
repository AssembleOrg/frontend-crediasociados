'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/admin'
import { reportsService } from '@/services/reports.service'
import { managerService } from '@/services/manager.service'

interface AdminDataProviderProps {
  children: React.ReactNode
}

/**
 * AdminDataProvider - Layout Level Data Provider
 *
 * Follows "Layout Provides, Pages Consume" pattern from ARCHITECTURE_PATTERNS.md
 *
 * Responsibilities:
 * - Single initialization source for all admin data
 * - Auto-refresh when cache expires (TTL-based)
 * - Prevent race conditions and duplicate requests
 * - Maintain data during navigation (session-level cache)
 *
 * Pages are pure consumers - they never trigger fetching
 */
export default function AdminDataProvider({ children }: AdminDataProviderProps) {
  const { user } = useAuth()
  const adminStore = useAdminStore()

  // Refs to prevent race conditions (following architecture patterns)
  const abortControllerRef = useRef<AbortController | null>(null)
  const detailedAbortControllerRef = useRef<AbortController | null>(null)


  /**
   * Initialize complete admin data (UNIFIED)
   * Single flow that populates BOTH detailed data AND reports
   * ✅ ARCHITECTURE FIX: One data source for everything
   */
  const initializeCompleteData = useCallback(async (): Promise<void> => {
    if (!user || user.role !== 'admin') return

    // Check if we have fresh complete data
    if (adminStore.hasDetailedData() && adminStore.isDetailedDataFresh()) {
      console.log('📦 [ADMIN PROVIDER] Using fresh cached complete data')
      return
    }

    try {
      console.log('🚀 [ADMIN PROVIDER] Loading complete admin data (UNIFIED)...')

      // Get subadmins created by this admin
      const subadmins = await reportsService.getCreatedUsers(user.id)

      // For each subadmin, get their complete data (managers + chart data)
      const detailedSubadminsData = await Promise.all(
        subadmins.map(async (subadmin) => {
          try {
            // Get managers for this subadmin
            const managers = await reportsService.getCreatedUsers(subadmin.id)

            // For each manager, get their chart data in parallel
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

            // Calculate aggregated totals for this subadmin
            const totalAmount = managersWithData.reduce((sum, manager) =>
              sum + manager.loans.reduce((loanSum, loan) => loanSum + (loan.amount || 0), 0), 0
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
              totalAmount,
              totalClients,
              totalLoans,
              managers: managersWithData
            }

          } catch (error) {
            console.warn(`Error loading complete data for ${subadmin.fullName}:`, error)
            return {
              id: subadmin.id,
              name: subadmin.fullName,
              email: subadmin.email,
              managersCount: 0,
              totalAmount: 0,
              totalClients: 0,
              totalLoans: 0,
              managers: []
            }
          }
        })
      )

      // ✅ UNIFIED: Update BOTH stores with same data
      adminStore.setDetailedData(detailedSubadminsData)

      // Calculate reports from the SAME data
      const totalUsers = detailedSubadminsData.length
      const totalClients = detailedSubadminsData.reduce((sum, s) => sum + s.totalClients, 0)
      const totalLoans = detailedSubadminsData.reduce((sum, s) => sum + s.totalLoans, 0)
      const totalAmountLent = detailedSubadminsData.reduce((sum, s) => sum + s.totalAmount, 0)

      const reportsData = {
        totalUsers,
        totalClients,
        totalLoans,
        totalAmountLent,
        totalAmountPending: 0, // Will be calculated from loan data
        averageCollectionRate: 0, // Will be calculated from loan data
        subadmins: detailedSubadminsData.map(s => ({
          userId: s.id,
          userName: s.name,
          userEmail: s.email,
          userRole: 'subadmin',
          totalClients: s.totalClients,
          totalLoans: s.totalLoans,
          totalAmountLent: s.totalAmount,
          totalAmountPending: 0,
          collectionRate: 0,
          createdAt: new Date().toISOString()
        }))
      }

      adminStore.setReports(reportsData)

      console.log('✅ [ADMIN PROVIDER] Complete unified data loaded and cached')

    } catch (error) {
      console.error('Error loading complete admin data:', error)
    }
  }, [user, adminStore]) // ✅ STABLE: user + store dependencies

  // Auto-initialize when user is available and is admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      console.log('👤 [ADMIN PROVIDER] Admin user detected, initializing unified data...')

      // ✅ UNIFIED: Single initialization flow for ALL data
      initializeCompleteData()
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (detailedAbortControllerRef.current) {
        detailedAbortControllerRef.current.abort()
      }
    }
  }, [user, initializeCompleteData]) // ✅ user + function dependencies

  // Auto-refresh when cache is invalidated (STABLE pattern)
  useEffect(() => {
    // If cache is invalidated, automatically refetch data
    if (!adminStore.isDetailedDataFresh() && user && user.role === 'admin') {
      // Only refetch if we had data before (avoid initial load double-fetch)
      if (adminStore.hasDetailedData()) {
        console.log('🔄 [ADMIN PROVIDER] Cache invalidated, refreshing unified data...')
        initializeCompleteData()
      }
    }
  }, [adminStore.lastDetailedFetch, user, adminStore, initializeCompleteData]) // ✅ STABLE dependencies

  return <>{children}</>
}