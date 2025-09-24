'use client'

import { createHierarchicalDataProvider, createProviderConfig } from './HierarchicalDataProvider'
import { useSubadminStore } from '@/stores/subadmin'
import { reportsService } from '@/services/reports.service'
import { managerService } from '@/services/manager.service'

/**
 * SubadminDataProvider - Specialized Provider using Generic Pattern
 *
 * 90% code reuse from admin provider pattern:
 * - Same caching strategy (5-10 min TTL)
 * - Same race condition prevention
 * - Same invalidation pattern
 * - Same progressive loading (basic → detailed)
 *
 * Only differences:
 * - Data types: Manager instead of Subadmin
 * - Endpoints: getCreatedUsers(subadminId) instead of getCreatedUsers(adminId)
 * - Hierarchy: subadmin → managers instead of admin → subadmins
 */

// Create the hierarchical provider for subadmin role
const SubadminHierarchicalProvider = createHierarchicalDataProvider<ReturnType<typeof useSubadminStore>>()

interface SubadminDataProviderProps {
  children: React.ReactNode
}

export default function SubadminDataProvider({ children }: SubadminDataProviderProps) {
  const subadminStore = useSubadminStore()

  // Initialize basic data (managers created by this subadmin)
  const initializeBasicData = async (subadminId: string): Promise<void> => {
    console.log('🚀 [SUBADMIN PROVIDER] Loading basic manager data...')

    try {
      // Get managers created by this subadmin
      const managers = await reportsService.getCreatedUsers(subadminId)

      // Transform to basic data format
      const basicManagerData = managers.map(manager => ({
        id: manager.id,
        name: manager.fullName,
        email: manager.email,
        clientsCount: 0 // Will be filled in detailed loading
      }))

      // Update store with basic data
      subadminStore.setManagers(basicManagerData)

      console.log('✅ [SUBADMIN PROVIDER] Basic manager data loaded')

    } catch (error) {
      console.error('Error loading basic subadmin data:', error)
      subadminStore.setManagers([]) // Fallback to empty
    }
  }

  // Initialize detailed data (full manager data with clients/loans)
  const initializeDetailedData = async (subadminId: string): Promise<void> => {
    console.log('🚀 [SUBADMIN PROVIDER] Loading detailed manager data...')

    try {
      const managers = await reportsService.getCreatedUsers(subadminId)

      // For each manager, get their detailed data in parallel
      const detailedManagerData = await Promise.all(
        managers.map(async (manager) => {
          try {
            // Get chart data for this manager (direct endpoints work for managers)
            const [clientsData, loansData] = await Promise.all([
              managerService.getManagerClientsChart(manager.id, {}),
              managerService.getManagerLoansChart(manager.id, {})
            ])

            // Calculate totals from chart data
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
            console.warn(`Error loading detailed data for manager ${manager.fullName}:`, error)
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

      // Update store with detailed data
      subadminStore.setDetailedManagers(detailedManagerData)

      console.log('✅ [SUBADMIN PROVIDER] Detailed manager data loaded')

    } catch (error) {
      console.error('Error loading detailed subadmin data:', error)
      subadminStore.setDetailedManagers([]) // Fallback to empty
    }
  }

  // Provider configuration using the reusable pattern
  const providerConfig = createProviderConfig({
    role: 'subadmin' as const,
    store: subadminStore,
    initializeBasicData,
    initializeDetailedData,
    // No reports initialization for subadmin (could be added later)
    isBasicDataFresh: (store) => store.isBasicDataFresh(),
    isDetailedDataFresh: (store) => store.isDetailedDataFresh(),
    hasBasicData: (store) => store.managers.length > 0,
    clearAllData: (store) => store.clearAllData()
  })

  return (
    <SubadminHierarchicalProvider config={providerConfig}>
      {children}
    </SubadminHierarchicalProvider>
  )
}