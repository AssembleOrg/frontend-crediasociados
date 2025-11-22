/**
 * CACHE MANAGER
 * 
 * Centralizes cache clearing logic across the entire application.
 * Use this to ensure ALL cached data is properly cleared on F5 or login.
 */

import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useStatsStore } from '@/stores/stats'
import { useAppStore } from '@/stores/app'
import { useClientsStore } from '@/stores/clients'
import { useLoansStore } from '@/stores/loans'
import { useSubLoansStore } from '@/stores/sub-loans'
import { useWalletsStore } from '@/stores/wallets'
import { useAdminStore } from '@/stores/admin'
import { useSubadminStore } from '@/stores/subadmin'
import { useFiltersStore } from '@/stores/filters'
import { useFinanzasStore } from '@/stores/finanzas'
import { useOperativaStore } from '@/stores/operativa'
import { useDolarBlueStore } from '@/stores/dolar-blue'

/**
 * Clear ALL application caches EXCEPT auth data (user, token)
 * Use this on F5 refresh to ensure fresh data from backend
 */
export function clearAllCaches() {
  

  // Clear users store (stores handle their own cache invalidation)
  // Note: UsersStore, StatsStore, ClientsStore don't have clearCache methods
  // They will be refetched when needed

  // Clear loans store
  const loansStore = useLoansStore.getState()
  if (loansStore.setLoans) {
    loansStore.setLoans([])
  }

  // Clear sub-loans store
  const subLoansStore = useSubLoansStore.getState()
  if (subLoansStore.setAllSubLoansWithClient) {
    subLoansStore.setAllSubLoansWithClient([])
    subLoansStore.setTodayDueSubLoans([])
    subLoansStore.setAllSubLoans([])
  }

  // Clear wallets store (will be refetched)
  const walletsStore = useWalletsStore.getState()
  if (walletsStore.invalidateAll) {
    walletsStore.invalidateAll()
  }

  // Clear admin store enrichments and reports
  const adminStore = useAdminStore.getState()
  if (adminStore.clearAllData) {
    adminStore.clearAllData()
  }

  // Clear subadmin store enrichments
  const subadminStore = useSubadminStore.getState()
  if (subadminStore.clearAllData) {
    subadminStore.clearAllData()
  }

  // Clear filters store (FiltersStore doesn't have resetAllFilters method)
  // Filters will be reset when components remount

  // Clear finanzas store
  const finanzasStore = useFinanzasStore.getState()
  finanzasStore.setFinancialSummary(null)
  finanzasStore.setManagersFinancial([])
  finanzasStore.setActiveLoansFinancial([])
  finanzasStore.setPortfolioEvolution([])
  finanzasStore.setIncomeVsExpenses([])
  finanzasStore.setCapitalDistribution([])

  // Clear operativa store
  const operativaStore = useOperativaStore.getState()
  if (operativaStore.setTransacciones) {
    operativaStore.setTransacciones([])
  }

  // Clear dolar blue store - reset to initial state
  // Don't clear dolar blue - it auto-refetches and has its own cache logic
  // Just let it be, it will handle its own refresh cycle

  // Clear app store notifications/modals (keep preferences)
  const appStore = useAppStore.getState()
  if (appStore.clearNotifications) {
    appStore.clearNotifications()
  }

}

/**
 * Clear ALL data including auth (full logout)
 * Use this on explicit logout
 */
export function clearAllData() {
  

  // Clear all caches first
  clearAllCaches()

  // Clear auth store (logout)
  const authStore = useAuthStore.getState()
  if (authStore.clearAuth) {
    authStore.clearAuth()
  }

}

/**
 * Invalidate all caches (mark as stale) without clearing
 * Useful when you want hooks to refetch on next access
 */
export function invalidateAllCaches() {
  

  // Invalidate admin cache
  const adminStore = useAdminStore.getState()
  if (adminStore.invalidateCache) {
    adminStore.invalidateCache()
  }

  // Invalidate subadmin cache
  const subadminStore = useSubadminStore.getState()
  if (subadminStore.invalidateCache) {
    subadminStore.invalidateCache()
  }

  // Invalidate wallets
  const walletsStore = useWalletsStore.getState()
  if (walletsStore.invalidateAll) {
    walletsStore.invalidateAll()
  }

  
}

