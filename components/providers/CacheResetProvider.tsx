'use client'

import { useEffect, useRef } from 'react'
import { clearAllCaches, clearAllStoragesOnRefresh } from '@/lib/cache-manager'
import { useAuthStore } from '@/stores/auth'

/**
 * CacheResetProvider
 * 
 * Automatically clears all application caches and storages (except auth) when:
 * 1. User presses F5 (page refresh)
 * 2. User navigates back to the app after closing the tab
 * 3. User hard refreshes (Ctrl+F5)
 * 
 * This ensures that all data is fetched fresh from the backend
 * and no stale or corrupted cached data is displayed.
 * 
 * CRITICAL: This prevents "Application error: a client-side exception" 
 * caused by corrupted cached modules or data.
 */
export function CacheResetProvider({ children }: { children: React.ReactNode }) {
  const hasCleared = useRef(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    // Only clear once per page load, and only if authenticated
    if (!hasCleared.current && isAuthenticated) {
      // Clear all browser storages (localStorage, sessionStorage, cookies) except auth
      clearAllStoragesOnRefresh()
      
      // Clear all application caches (Zustand stores, request cache, etc.)
      clearAllCaches()
      
      hasCleared.current = true
    }
  }, [isAuthenticated])

  // Listen for page unload (F5, refresh, navigation away)
  // This ensures storages are cleared BEFORE the page reloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Mark that we're about to refresh so next load knows to clear
      if (typeof window !== 'undefined' && isAuthenticated) {
        // Set a flag in sessionStorage (which will be cleared on next load)
        // This helps identify refresh vs first load
        try {
          sessionStorage.setItem('_refresh_flag', Date.now().toString())
        } catch (e) {
          // Ignore errors
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, [isAuthenticated])

  // NOTE: visibilitychange listener DISABLED
  // It was clearing cache too aggressively (every 2 minutes when user switched tabs)
  // Only F5 refresh will clear cache now
  
  return <>{children}</>
}

