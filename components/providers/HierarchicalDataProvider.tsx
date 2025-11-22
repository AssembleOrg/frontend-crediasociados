'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

export type UserRole = 'admin' | 'subadmin' | 'manager'

interface HierarchicalDataProviderConfig<TStore> {
  role: UserRole
  store: TStore
  initializeBasicData: (userId: string) => Promise<void>
  initializeDetailedData?: (userId: string) => Promise<void>
  initializeReports?: (userId: string) => Promise<void>
  isBasicDataFresh: (store: TStore) => boolean
  isDetailedDataFresh?: (store: TStore) => boolean
  hasBasicData: (store: TStore) => boolean
  clearAllData: (store: TStore) => void
}

interface HierarchicalDataProviderProps<TStore> {
  children: React.ReactNode
  config: HierarchicalDataProviderConfig<TStore>
}

/**
 * HierarchicalDataProvider - Reusable Provider Pattern
 *
 * Generic provider that can be used for:
 * - Admin → Subadmin → Manager hierarchy
 * - Subadmin → Manager → Client hierarchy
 * - Manager → Client → Loan hierarchy
 *
 * Follows ARCHITECTURE_PATTERNS.md:
 * - Layout level data initialization
 * - Single source of truth per role
 * - Race condition prevention
 * - Cache invalidation support
 * - 90% code reuse between roles
 */
export function createHierarchicalDataProvider<TStore>() {
  return function HierarchicalDataProvider({
    children,
    config
  }: HierarchicalDataProviderProps<TStore>) {
    const { user } = useAuth()
    const {
      role,
      store,
      initializeBasicData,
      initializeDetailedData,
      initializeReports,
      isBasicDataFresh,
      isDetailedDataFresh,
      hasBasicData
    } = config

    // Refs to prevent race conditions (reusable pattern)
    const basicInitRef = useRef(false)
    const detailedInitRef = useRef(false)
    const reportsInitRef = useRef(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const detailedAbortControllerRef = useRef<AbortController | null>(null)
    const reportsAbortControllerRef = useRef<AbortController | null>(null)

    /**
     * Initialize basic data for the role
     * Generic pattern that works for any hierarchy level
     */
    const initializeBasic = useCallback(async (): Promise<void> => {
      if (!user || user.role !== role) return

      // Check if we have fresh cached data
      if (isBasicDataFresh(store) && hasBasicData(store)) {
        return
      }

      // Prevent double initialization
      if (basicInitRef.current) {
        return
      }
      basicInitRef.current = true

      try {

        // Cancel any existing request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        await initializeBasicData(user?.id || '')


        if (initializeDetailedData) {
          initializeDetailed()
        }

      } catch (error: unknown) {
        if ((error as Error).name !== 'AbortError') {
          
        }
      } finally {
        basicInitRef.current = false
      }
    }, [user, role, store, initializeBasicData, isBasicDataFresh, hasBasicData])

    /**
     * Initialize detailed data (optional for some roles)
     */
    const initializeDetailed = useCallback(async (): Promise<void> => {
       
      if (!user || user.role !== role || !initializeDetailedData || !isDetailedDataFresh) return

      // Check if we have fresh detailed data
      if (isDetailedDataFresh(store)) {
        return
      }

      // Need basic data first
      if (!hasBasicData(store)) {
        return
      }

      // Prevent double initialization
      if (detailedInitRef.current) {
        return
      }
      detailedInitRef.current = true

      try {

        // Cancel any existing detailed request
        if (detailedAbortControllerRef.current) {
          detailedAbortControllerRef.current.abort()
        }
        detailedAbortControllerRef.current = new AbortController()

        await initializeDetailedData(user?.id || '')


      } catch (error: unknown) {
        if ((error as Error).name !== 'AbortError') {
          
        }
      } finally {
        detailedInitRef.current = false
      }
    }, [user, role, store, initializeDetailedData, isDetailedDataFresh, hasBasicData])

    /**
     * Initialize reports data (optional for some roles)
     */
    const initializeReportsData = useCallback(async (): Promise<void> => {
      if (!user || user.role !== role || !initializeReports) return

      // Prevent double initialization
      if (reportsInitRef.current) return
      reportsInitRef.current = true

      try {

        // Cancel any existing reports request
        if (reportsAbortControllerRef.current) {
          reportsAbortControllerRef.current.abort()
        }
        reportsAbortControllerRef.current = new AbortController()

        await initializeReports(user?.id || '')


      } catch (error: unknown) {
        if ((error as Error).name !== 'AbortError') {
          
        }
      } finally {
        reportsInitRef.current = false
      }
    }, [user, role, initializeReports])

    // Auto-initialize when user is available and has correct role
    useEffect(() => {
      if (user && user.role === role) {

        // Initialize basic data first (fast)
        initializeBasic()

        // Initialize reports data (if available)
        if (initializeReports) {
          initializeReportsData()
        }
      }

      // Cleanup on unmount
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        if (detailedAbortControllerRef.current) {
          detailedAbortControllerRef.current.abort()
        }
        if (reportsAbortControllerRef.current) {
          reportsAbortControllerRef.current.abort()
        }
      }
    }, [user, role, initializeBasic, initializeReportsData])

    // Auto-refresh when cache is invalidated (reusable pattern)
    useEffect(() => {
      // If cache is invalidated, automatically refetch data
      if (!isBasicDataFresh(store) && user && user.role === role) {
        // Only refetch if we had data before (avoid initial load double-fetch)
        if (hasBasicData(store)) {
          initializeBasic()
          if (initializeReports) {
            initializeReportsData()
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, role, store, initializeBasic, initializeReportsData, isBasicDataFresh, hasBasicData])

    return <>{children}</>
  }
}

/**
 * Utility function to create type-safe provider configs
 */
export function createProviderConfig<TStore>(
  config: HierarchicalDataProviderConfig<TStore>
): HierarchicalDataProviderConfig<TStore> {
  return config
}