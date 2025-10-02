'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/admin'
import { reportsService } from '@/services/reports.service'
import { managerService } from '@/services/manager.service'

interface AdminDataProviderProps {
  children: React.ReactNode
}

export default function AdminDataProvider({ children }: AdminDataProviderProps) {
  const { user } = useAuth()
  const adminStore = useAdminStore()

  const abortControllerRef = useRef<AbortController | null>(null)
  const detailedAbortControllerRef = useRef<AbortController | null>(null)


  const initializeCompleteData = useCallback(async (): Promise<void> => {
    if (!user || user.role !== 'admin') return

    if (adminStore.hasDetailedData() && adminStore.isDetailedDataFresh()) {
      console.log('📦 [ADMIN PROVIDER] Using fresh cached complete data')
      return
    }

    try {
      console.time('👑 Admin Init - Total Time')
      console.log('[ADMIN PROVIDER] Loading complete admin data...')

      console.time('👑 Step 1: Get Subadmins')
      const subadmins = await reportsService.getCreatedUsers(user.id)
      console.timeEnd('👑 Step 1: Get Subadmins')
      console.log(`👑 Found ${subadmins.length} subadmins`)

      console.time('👑 Step 2: Get All Managers + Charts (N+1)')
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
            console.warn(`Error loading complete data for ${subadmin.fullName}:`, error)
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
      console.timeEnd('👑 Step 2: Get All Managers + Charts (N+1)')

      const totalManagers = detailedSubadminsData.reduce((sum, s) => sum + s.managersCount, 0)
      console.log(`👑 Loaded ${totalManagers} managers across ${detailedSubadminsData.length} subadmins`)

      adminStore.setDetailedData(detailedSubadminsData)

      const totalUsers = detailedSubadminsData.length
      const totalClients = detailedSubadminsData.reduce((sum, s) => sum + s.totalClients, 0)
      const totalLoans = detailedSubadminsData.reduce((sum, s) => sum + s.totalLoans, 0)

      const reportsData = {
        totalUsers,
        totalClients,
        totalLoans,
        totalAmountLent: 0,
        totalAmountPending: 0,
        averageCollectionRate: 0,
        subadmins: detailedSubadminsData.map(s => ({
          userId: s.id,
          userName: s.name,
          userEmail: s.email,
          userRole: 'subadmin',
          totalClients: s.totalClients,
          totalLoans: s.totalLoans,
          totalAmountLent: 0,
          totalAmountPending: 0,
          collectionRate: 0,
          createdAt: new Date().toISOString()
        }))
      }

      adminStore.setReports(reportsData)

      console.timeEnd('👑 Admin Init - Total Time')
      console.log('[ADMIN PROVIDER] Complete data loaded and cached')

    } catch (error) {
      console.error('Error loading complete admin data:', error)
    }
  }, [user, adminStore])

  useEffect(() => {
    if (user && user.role === 'admin') {
      console.log('[ADMIN PROVIDER] Admin user detected, initializing data...')
      initializeCompleteData()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (detailedAbortControllerRef.current) {
        detailedAbortControllerRef.current.abort()
      }
    }
  }, [user, initializeCompleteData])

  useEffect(() => {
    if (!adminStore.isDetailedDataFresh() && user && user.role === 'admin') {
      if (adminStore.hasDetailedData()) {
        console.log('[ADMIN PROVIDER] Cache invalidated, refreshing data...')
        initializeCompleteData()
      }
    }
  }, [adminStore.lastDetailedFetch, user, adminStore, initializeCompleteData])

  return <>{children}</>
}