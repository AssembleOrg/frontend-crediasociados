'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import type { ClientChartDataDto, LoanChartDataDto } from '@/services/manager.service'

export type TimeFilter = 'week' | 'month' | 'quarter' | 'custom'

interface DateRange {
  from: Date
  to: Date
}

/**
 * Manager enrichment data - Contains data that's not in usersStore
 * (charts, metrics, derived calculations)
 */
interface ManagerEnrichment {
  totalClients: number
  totalLoans: number
  totalAmount: number
  clients: ClientChartDataDto[]
  loans: LoanChartDataDto[]
}

interface SubadminStore {
  // State - Session data that should persist
  // NOTE: We NO LONGER store managers/detailedManagers here
  // Those come from usersStore (single source of truth)
  // This store ONLY stores enrichment data that's not in usersStore
  managerEnrichments: Record<string, ManagerEnrichment>
  lastEnrichmentFetch: Date | null

  // Filters (persist during session)
  timeFilter: TimeFilter
  dateRange: DateRange
  selectedManager: string | null

  // Simple synchronous actions only (Layer 3 - "dumb" store)
  setManagerEnrichments: (data: Record<string, ManagerEnrichment>) => void
  setLastEnrichmentFetch: (date: Date) => void

  // Filter setters
  setTimeFilter: (filter: TimeFilter) => void
  setDateRange: (range: DateRange) => void
  setSelectedManager: (id: string | null) => void

  // Simple calculations only (Layer 3)
  isEnrichmentDataFresh: () => boolean
  hasEnrichmentData: () => boolean
  getAggregatedTotals: () => { totalClients: number; totalAmount: number; totalLoans: number }
  getManagerOptions: (managers: Array<{ id: string; fullName: string }>) => Array<{ id: string; name: string }>

  // Clear methods
  clearAllData: () => void
  clearEnrichmentData: () => void

  // Cache invalidation
  invalidateCache: () => void
}

const getDateRangeForFilter = (filter: TimeFilter): DateRange => {
  const now = new Date()
  const to = new Date(now)

  switch (filter) {
    case 'week':
      const from = new Date(now)
      from.setDate(from.getDate() - 7)
      return { from, to }

    case 'month':
      const monthFrom = new Date(now)
      monthFrom.setMonth(monthFrom.getMonth() - 1)
      return { from: monthFrom, to }

    case 'quarter':
      const quarterFrom = new Date(now)
      quarterFrom.setMonth(quarterFrom.getMonth() - 3)
      return { from: quarterFrom, to }

    default:
      return { from: new Date(now.getFullYear(), 0, 1), to }
  }
}

export const useSubadminStore = create<SubadminStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      managerEnrichments: {},
      lastEnrichmentFetch: null,
      timeFilter: 'month',
      dateRange: getDateRangeForFilter('month'),
      selectedManager: null,

      // Simple synchronous setters (Layer 3 pattern)
      setManagerEnrichments: (data) => {
        set((state) => {
          state.managerEnrichments = data
          state.lastEnrichmentFetch = new Date()
        })
      },

      setLastEnrichmentFetch: (date) => {
        set((state) => {
          state.lastEnrichmentFetch = date
        })
      },

      setTimeFilter: (filter) => {
        set((state) => {
          state.timeFilter = filter
          state.dateRange = getDateRangeForFilter(filter)
        })
      },

      setDateRange: (range) => {
        set((state) => {
          state.timeFilter = 'custom'
          state.dateRange = range
        })
      },

      setSelectedManager: (id) => {
        set((state) => {
          state.selectedManager = id
        })
      },

      // Simple calculations (Layer 3 - "dumb" store)
      isEnrichmentDataFresh: () => {
        const lastEnrichmentFetch = get().lastEnrichmentFetch
        if (!lastEnrichmentFetch) return false
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
        return lastEnrichmentFetch > tenMinutesAgo
      },

      hasEnrichmentData: () => {
        return Object.keys(get().managerEnrichments).length > 0
      },

      getAggregatedTotals: () => {
        const { managerEnrichments } = get()
        const enrichments = Object.values(managerEnrichments)

        if (enrichments.length === 0) {
          return { totalClients: 0, totalAmount: 0, totalLoans: 0 }
        }

        return {
          totalClients: enrichments.reduce((sum, enrichment) => sum + (enrichment.totalClients || 0), 0),
          totalAmount: enrichments.reduce((sum, enrichment) => sum + (enrichment.totalAmount || 0), 0),
          totalLoans: enrichments.reduce((sum, enrichment) => sum + (enrichment.totalLoans || 0), 0)
        }
      },

      getManagerOptions: (managers) => {
        return managers.map(manager => ({
          id: manager.id,
          name: manager.fullName
        }))
      },

      // Clear methods
      clearAllData: () => {
        set((state) => {
          state.managerEnrichments = {}
          state.lastEnrichmentFetch = null
        })
      },

      clearEnrichmentData: () => {
        set((state) => {
          state.managerEnrichments = {}
          state.lastEnrichmentFetch = null
        })
      },

      // Cache invalidation method - hook will detect and refetch
      invalidateCache: () => {
        set((state) => {
          state.lastEnrichmentFetch = null
          // Keep enrichment data but invalidate timestamp - hook will refetch if needed
        })
      },
    })),
    {
      name: 'subadmin-session-storage',
      partialize: (state) => ({
        // Persist critical session data
        managerEnrichments: state.managerEnrichments,
        lastEnrichmentFetch: state.lastEnrichmentFetch,
        timeFilter: state.timeFilter,
        dateRange: state.dateRange,
        selectedManager: state.selectedManager,
      }),
      // Handle hydration gracefully
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate subadmin store:', error)
          // Reset to safe defaults on error
          state?.clearAllData()
        }
      },
    }
  )
)