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
import { requestDeduplicator } from '@/lib/request-deduplicator'

/**
 * Clear ALL application caches EXCEPT auth data (user, token)
 * Use this on F5 refresh to ensure fresh data from backend
 */
export function clearAllCaches() {
  
  // Clear request deduplicator cache
  requestDeduplicator.clearAll()

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
 * This function clears:
 * - All Zustand stores
 * - localStorage
 * - sessionStorage
 * - Cookies
 * - Browser cache (if possible)
 */
export function clearAllData() {
  // Clear all caches first
  clearAllCaches()

  // ============================================================================
  // CRITICAL: Clear all stores that contain user-specific data
  // This prevents data contamination between different user sessions
  // ============================================================================

  // Clear users store - CRITICAL: This prevents users from different sessions mixing
  const usersStore = useUsersStore.getState()
  usersStore.clearUsers()
  if ('clearCache' in usersStore && typeof (usersStore as any).clearCache === 'function') {
    (usersStore as any).clearCache()
  }

  // Clear clients store
  const clientsStore = useClientsStore.getState()
  clientsStore.clearClients()
  if ('clearCache' in clientsStore && typeof (clientsStore as any).clearCache === 'function') {
    (clientsStore as any).clearCache()
  }

  // Clear stats store
  const statsStore = useStatsStore.getState()
  statsStore.clearStats()
  if ('clearCache' in statsStore && typeof (statsStore as any).clearCache === 'function') {
    (statsStore as any).clearCache()
  }

  // Clear loans store
  const loansStore = useLoansStore.getState()
  if (loansStore.reset) {
    loansStore.reset()
  }

  // Clear sub-loans store
  const subLoansStore = useSubLoansStore.getState()
  if (subLoansStore.reset) {
    subLoansStore.reset()
  }

  // Clear filters store - including notifiedClients Set
  const filtersStore = useFiltersStore.getState()
  if (filtersStore.clearAllFilters) {
    filtersStore.clearAllFilters()
  } else {
    // Fallback: clear individually if clearAllFilters doesn't exist
    if (filtersStore.clearLoansFilters) {
      filtersStore.clearLoansFilters()
    }
    if (filtersStore.clearCobrosFilters) {
      filtersStore.clearCobrosFilters()
    }
    // Clear notifiedClients Set
    useFiltersStore.setState({
      notifiedClients: new Set<string>()
    })
  }

  // Clear finanzas store
  const finanzasStore = useFinanzasStore.getState()
  if (finanzasStore.clearFinancialData) {
    finanzasStore.clearFinancialData()
  }

  // Clear operativa store
  const operativaStore = useOperativaStore.getState()
  if (operativaStore.clearTransacciones) {
    operativaStore.clearTransacciones()
  }

  // Clear wallets store
  const walletsStore = useWalletsStore.getState()
  if (walletsStore.invalidateAll) {
    walletsStore.invalidateAll()
  }

  // Clear app store - close all modals and clear notifications
  const appStore = useAppStore.getState()
  if (appStore.clearNotifications) {
    appStore.clearNotifications()
  }
  if (appStore.closeAllModals) {
    appStore.closeAllModals()
  }
  if (appStore.clearGlobalLoading) {
    appStore.clearGlobalLoading()
  }

  // Clear auth store (logout) - MUST be last
  const authStore = useAuthStore.getState()
  if (authStore.clearAuth) {
    authStore.clearAuth()
  }

  // Clear all browser storage
  if (typeof window !== 'undefined') {
    // Clear all localStorage items related to the app
    const localStorageKeys = [
      'auth-storage',
      'app-storage',
      // Add any other localStorage keys used by the app
    ]
    
    localStorageKeys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (e) {
        // Ignore errors
      }
    })

    // Clear all sessionStorage items related to the app
    const sessionStorageKeys = [
      'admin-session-storage',
      'subadmin-session-storage',
      // Add any other sessionStorage keys used by the app
    ]
    
    sessionStorageKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key)
      } catch (e) {
        // Ignore errors
      }
    })

    // Clear all cookies related to the app
    const cookieKeys = [
      'auth-storage',
      'auth-storage-token',
      // Add any other cookie keys used by the app
    ]
    
    cookieKeys.forEach(key => {
      try {
        // Clear cookie for current path
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
        // Clear cookie for root path
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        // Clear cookie with domain (if set)
        const hostname = window.location.hostname
        const domain = hostname.includes('.') ? `.${hostname.split('.').slice(-2).join('.')}` : hostname
        document.cookie = `${key}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      } catch (e) {
        // Ignore errors
      }
    })

    // Clear browser cache using Cache API (if available)
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName).catch(() => {
            // Ignore errors
          })
        })
      }).catch(() => {
        // Ignore errors
      })
    }

    // Force clear all localStorage and sessionStorage as fallback
    // This is a more aggressive approach - clears everything
    try {
      localStorage.clear()
    } catch (e) {
      // Ignore errors
    }

    try {
      sessionStorage.clear()
    } catch (e) {
      // Ignore errors
    }
  }
}

/**
 * Invalidate all caches (mark as stale) without clearing
 * Useful when you want hooks to refetch on next access
 */
export function invalidateAllCaches() {
  
  // Invalidate request deduplicator cache
  requestDeduplicator.clearAll()

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

