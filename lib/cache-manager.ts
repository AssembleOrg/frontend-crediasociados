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
  console.log('🧹 CACHE MANAGER: Clearing all application caches...')

  // Clear users store (except the data will be rehydrated from localStorage)
  // We keep the store structure but invalidate cached lists
  const usersStore = useUsersStore.getState()
  if (usersStore.clearCache) {
    usersStore.clearCache()
  }

  // Clear stats store
  const statsStore = useStatsStore.getState()
  if (statsStore.clearCache) {
    statsStore.clearCache()
  }

  // Clear clients store
  const clientsStore = useClientsStore.getState()
  if (clientsStore.clearCache) {
    clientsStore.clearCache()
  }

  // Clear loans store
  const loansStore = useLoansStore.getState()
  if (loansStore.clearAllData) {
    loansStore.clearAllData()
  }

  // Clear sub-loans store
  const subLoansStore = useSubLoansStore.getState()
  if (subLoansStore.clearAllData) {
    subLoansStore.clearAllData()
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

  // Clear filters store
  const filtersStore = useFiltersStore.getState()
  if (filtersStore.resetAllFilters) {
    filtersStore.resetAllFilters()
  }

  // Clear finanzas store
  const finanzasStore = useFinanzasStore.getState()
  if (finanzasStore.clearAllData) {
    finanzasStore.clearAllData()
  }

  // Clear operativa store
  const operativaStore = useOperativaStore.getState()
  if (operativaStore.clearData) {
    operativaStore.clearData()
  }

  // Clear dolar blue store - reset to initial state
  const dolarBlueStore = useDolarBlueStore.getState()
  if (dolarBlueStore.setCurrentRate) {
    // Don't clear dolar blue - it auto-refetches and has its own cache logic
    // Just let it be, it will handle its own refresh cycle
  }

  // Clear app store notifications/modals (keep preferences)
  const appStore = useAppStore.getState()
  if (appStore.clearAllNotifications) {
    appStore.clearAllNotifications()
  }

  console.log('✅ CACHE MANAGER: All caches cleared successfully')
}

/**
 * Clear ALL data including auth (full logout)
 * Use this on explicit logout
 */
export function clearAllData() {
  console.log('🧹 CACHE MANAGER: Clearing ALL data including auth...')

  // Clear all caches first
  clearAllCaches()

  // Clear auth store (logout)
  const authStore = useAuthStore.getState()
  if (authStore.clearAuth) {
    authStore.clearAuth()
  }

  console.log('✅ CACHE MANAGER: All data cleared (full logout)')
}

/**
 * Invalidate all caches (mark as stale) without clearing
 * Useful when you want hooks to refetch on next access
 */
export function invalidateAllCaches() {
  console.log('🔄 CACHE MANAGER: Invalidating all caches...')

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

  console.log('✅ CACHE MANAGER: All caches invalidated')
}

