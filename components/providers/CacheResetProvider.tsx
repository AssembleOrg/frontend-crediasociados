'use client'

import { useEffect, useRef } from 'react'
import { clearAllCaches } from '@/lib/cache-manager'
import { useAuthStore } from '@/stores/auth'

/**
 * CacheResetProvider
 * 
 * Automatically clears all application caches (except auth) when:
 * 1. User presses F5 (page refresh)
 * 2. User navigates back to the app after closing the tab
 * 3. User hard refreshes (Ctrl+F5)
 * 
 * This ensures that all data is fetched fresh from the backend
 * and no stale cached data is displayed.
 */
export function CacheResetProvider({ children }: { children: React.ReactNode }) {
  const hasCleared = useRef(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    // Only clear once per page load, and only if authenticated
    if (!hasCleared.current && isAuthenticated) {
      console.log('🧹 F5 DETECTED: Clearing all caches for fresh data...')
      clearAllCaches()
      hasCleared.current = true
      console.log('✅ F5 CLEANUP: All caches cleared, data will be fetched fresh from backend')
    }
  }, [isAuthenticated])

  // NOTE: visibilitychange listener DISABLED
  // It was clearing cache too aggressively (every 2 minutes when user switched tabs)
  // Only F5 refresh will clear cache now
  
  return <>{children}</>
}

