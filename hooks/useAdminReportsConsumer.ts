'use client'

import { useCallback } from 'react'
import { useAdminStore } from '@/stores/admin'
import { useUsersStore } from '@/stores/users'

/**
 * useAdminReportsConsumer - Pure Consumer Hook (Layer 4)
 *
 * REFACTORED - Single Source of Truth Pattern:
 * - NO auto-initialization (AdminDataProvider handles that)
 * - NO useEffect with API calls
 * - Only consumes data from stores (usersStore for users, adminStore for enrichments)
 * - Manual methods for refresh operations
 */
export const useAdminReportsConsumer = () => {
  const adminStore = useAdminStore()
  const usersStore = useUsersStore()

  const refreshReports = useCallback(() => {
    adminStore.invalidateCache()
  }, [adminStore])

  const clearError = useCallback(() => {
    console.log('Clear error called - provider handles errors gracefully')
  }, [])

  const initializeReports = useCallback(() => {
    refreshReports()
  }, [refreshReports])

  // Get subadmins from usersStore (canonical source of truth)
  const subadmins = usersStore.users.filter(u => u.role === 'subadmin')

  return {
    reports: adminStore.reports,
    isLoading: !adminStore.isEnrichmentDataFresh() && !adminStore.reports,
    isInitialized: !!adminStore.reports || adminStore.isEnrichmentDataFresh() || subadmins.length > 0,
    error: null,
    initializeReports,
    refreshReports,
    clearError
  }
}

export const useAdminReports = useAdminReportsConsumer