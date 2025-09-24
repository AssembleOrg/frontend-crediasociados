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

interface BasicManagerData {
  id: string
  name: string
  email: string
  clientsCount: number
}

interface DetailedManagerData extends BasicManagerData {
  totalAmount: number
  totalClients: number
  totalLoans: number
  clients: ClientChartDataDto[]
  loans: LoanChartDataDto[]
}

interface SubadminStore {
  // State - Session data that should persist
  managers: BasicManagerData[]
  detailedManagers: DetailedManagerData[]
  lastFetch: Date | null
  lastDetailedFetch: Date | null

  // Filters (persist during session)
  timeFilter: TimeFilter
  dateRange: DateRange
  selectedManager: string | null

  // Simple synchronous actions only (Layer 3 - "dumb" store)
  setManagers: (data: BasicManagerData[]) => void
  setDetailedManagers: (data: DetailedManagerData[]) => void
  setLastFetch: (date: Date) => void
  setLastDetailedFetch: (date: Date) => void

  // Filter setters
  setTimeFilter: (filter: TimeFilter) => void
  setDateRange: (range: DateRange) => void
  setSelectedManager: (id: string | null) => void

  // Simple calculations only (Layer 3)
  isBasicDataFresh: () => boolean
  isDetailedDataFresh: () => boolean
  hasDetailedData: () => boolean
  getAggregatedTotals: () => { totalClients: number; totalAmount: number; totalLoans: number }
  getManagerOptions: () => Array<{ id: string; name: string }>

  // Clear methods
  clearAllData: () => void
  clearDetailedData: () => void

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
      managers: [],
      detailedManagers: [],
      lastFetch: null,
      lastDetailedFetch: null,
      timeFilter: 'month',
      dateRange: getDateRangeForFilter('month'),
      selectedManager: null,

      // Simple synchronous setters (Layer 3 pattern)
      setManagers: (data) => {
        set((state) => {
          state.managers = data
          state.lastFetch = new Date()
        })
      },

      setDetailedManagers: (data) => {
        set((state) => {
          state.detailedManagers = data
          state.lastDetailedFetch = new Date()
        })
      },

      setLastFetch: (date) => {
        set((state) => {
          state.lastFetch = date
        })
      },

      setLastDetailedFetch: (date) => {
        set((state) => {
          state.lastDetailedFetch = date
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
      isBasicDataFresh: () => {
        const lastFetch = get().lastFetch
        if (!lastFetch) return false
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        return lastFetch > fiveMinutesAgo
      },

      isDetailedDataFresh: () => {
        const lastDetailedFetch = get().lastDetailedFetch
        if (!lastDetailedFetch) return false
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
        return lastDetailedFetch > tenMinutesAgo
      },

      hasDetailedData: () => {
        return get().detailedManagers.length > 0
      },

      getAggregatedTotals: () => {
        const { detailedManagers } = get()

        if (detailedManagers.length === 0) {
          return { totalClients: 0, totalAmount: 0, totalLoans: 0 }
        }

        return {
          totalClients: detailedManagers.reduce((sum, manager) => sum + (manager.totalClients || 0), 0),
          totalAmount: detailedManagers.reduce((sum, manager) => sum + (manager.totalAmount || 0), 0),
          totalLoans: detailedManagers.reduce((sum, manager) => sum + (manager.totalLoans || 0), 0)
        }
      },

      getManagerOptions: () => {
        const { detailedManagers, managers } = get()
        const data = detailedManagers.length > 0 ? detailedManagers : managers

        return data.map(manager => ({
          id: manager.id,
          name: manager.name
        }))
      },

      // Clear methods
      clearAllData: () => {
        set((state) => {
          state.managers = []
          state.detailedManagers = []
          state.lastFetch = null
          state.lastDetailedFetch = null
        })
      },

      clearDetailedData: () => {
        set((state) => {
          state.detailedManagers = []
          state.lastDetailedFetch = null
        })
      },

      // Cache invalidation method - provider will detect and refetch
      invalidateCache: () => {
        set((state) => {
          state.lastFetch = null
          state.lastDetailedFetch = null
          // Keep data but invalidate timestamps - provider will refetch
        })
      },
    })),
    {
      name: 'subadmin-session-storage',
      partialize: (state) => ({
        // Persist critical session data
        managers: state.managers,
        detailedManagers: state.detailedManagers,
        lastFetch: state.lastFetch,
        lastDetailedFetch: state.lastDetailedFetch,
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