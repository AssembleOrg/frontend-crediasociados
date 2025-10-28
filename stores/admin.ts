'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { DateTime } from 'luxon'
import { ensureLuxonConfigured } from '@/lib/luxon-config'
import type { AdminReportData } from '@/services/reports.service'
import type { ClientChartDataDto, LoanChartDataDto } from '@/services/manager.service'
import type { User } from '@/types/auth'

export type TimeFilter = 'week' | 'month' | 'quarter' | 'custom'

interface DateRange {
  from: Date
  to: Date
}

/**
 * SubadminEnrichment - Derived data for a subadmin
 * NOT the User object itself - that lives in usersStore
 * Only contains enrichment data (charts, metrics, analytics)
 */
interface SubadminEnrichment {
  totalClients: number
  totalLoans: number
  totalAmount: number
  managers: Array<{
    id: string
    name: string
    email: string
    clients: ClientChartDataDto[]
    loans: LoanChartDataDto[]
  }>
}

interface AdminStore {
  // State - Only enrichment data (NOT User[] duplicates!)
  reports: AdminReportData | null
  subadminEnrichments: Record<string, SubadminEnrichment>
  lastEnrichmentFetch: Date | null

  // Filters (persist during session)
  timeFilter: TimeFilter
  dateRange: DateRange
  selectedSubadmin: string | null

  // Simple synchronous actions only
  setReports: (reports: AdminReportData | null) => void
  setSubadminEnrichments: (subadminId: string, enrichment: SubadminEnrichment) => void
  setLastEnrichmentFetch: (date: Date) => void

  // Filter setters
  setTimeFilter: (filter: TimeFilter) => void
  setDateRange: (range: DateRange) => void
  setSelectedSubadmin: (id: string | null) => void

  isEnrichmentDataFresh: () => boolean
  hasEnrichmentData: () => boolean
  getAggregatedTotals: (subadmins: User[]) => { totalClients: number; totalLoans: number; totalAmount: number }
  getSubadminOptions: (subadmins: User[]) => Array<{ id: string; name: string }>

  clearAllData: () => void
  clearEnrichmentData: () => void

  invalidateCache: () => void
}

const getDateRangeForFilter = (filter: TimeFilter): DateRange => {
  // Ensure Luxon is configured (lazy loaded)
  ensureLuxonConfigured()

  const now = DateTime.now()
  const to = now.toJSDate()

  switch (filter) {
    case 'week':
      const from = now.minus({ days: 7 }).toJSDate()
      return { from, to }

    case 'month':
      const monthFrom = now.minus({ months: 1 }).toJSDate()
      return { from: monthFrom, to }

    case 'quarter':
      const quarterFrom = now.minus({ months: 3 }).toJSDate()
      return { from: quarterFrom, to }

    default:
      const yearStart = now.startOf('year').toJSDate()
      return { from: yearStart, to }
  }
}

export const useAdminStore = create<AdminStore>()(
  persist(
    immer((set, get) => ({
      reports: null,
      subadminEnrichments: {},
      lastEnrichmentFetch: null,
      timeFilter: 'month',
      dateRange: getDateRangeForFilter('month'),
      selectedSubadmin: null,

      setReports: (reports) => {
        set((state) => {
          state.reports = reports
        })
      },

      setSubadminEnrichments: (subadminId, enrichment) => {
        set((state) => {
          state.subadminEnrichments[subadminId] = enrichment
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

      setSelectedSubadmin: (id) => {
        set((state) => {
          state.selectedSubadmin = id
        })
      },

      isEnrichmentDataFresh: () => {
        const lastEnrichmentFetch = get().lastEnrichmentFetch
        if (!lastEnrichmentFetch) return false
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
        return lastEnrichmentFetch > tenMinutesAgo
      },

      hasEnrichmentData: () => {
        return Object.keys(get().subadminEnrichments).length > 0
      },

      getAggregatedTotals: (subadmins: User[]) => {
        const { subadminEnrichments } = get()

        if (subadmins.length === 0) {
          return { totalClients: 0, totalLoans: 0, totalAmount: 0 }
        }

        return {
          totalClients: subadmins.reduce((sum, subadmin) => sum + (subadminEnrichments[subadmin.id]?.totalClients || 0), 0),
          totalLoans: subadmins.reduce((sum, subadmin) => sum + (subadminEnrichments[subadmin.id]?.totalLoans || 0), 0),
          totalAmount: subadmins.reduce((sum, subadmin) => sum + (subadminEnrichments[subadmin.id]?.totalAmount || 0), 0)
        }
      },

      getSubadminOptions: (subadmins: User[]) => {
        return subadmins.map(subadmin => ({
          id: subadmin.id,
          name: subadmin.fullName
        }))
      },

      clearAllData: () => {
        set((state) => {
          state.reports = null
          state.subadminEnrichments = {}
          state.lastEnrichmentFetch = null
        })
      },

      clearEnrichmentData: () => {
        set((state) => {
          state.subadminEnrichments = {}
          state.lastEnrichmentFetch = null
        })
      },

      invalidateCache: () => {
        set((state) => {
          state.lastEnrichmentFetch = null
        })
      },
    })),
    {
      name: 'admin-session-storage',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          const str = sessionStorage.getItem(name)
          if (!str) return null
          const { state } = JSON.parse(str)
          if (state.dateRange) {
            state.dateRange.from = new Date(state.dateRange.from)
            state.dateRange.to = new Date(state.dateRange.to)
          }
          if (state.lastEnrichmentFetch) {
            state.lastEnrichmentFetch = new Date(state.lastEnrichmentFetch)
          }
          return { state }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return
          sessionStorage.removeItem(name)
        },
      },
      partialize: (state) => ({
        reports: state.reports,
        subadminEnrichments: state.subadminEnrichments,
        lastEnrichmentFetch: state.lastEnrichmentFetch,
        timeFilter: state.timeFilter,
        dateRange: state.dateRange,
        selectedSubadmin: state.selectedSubadmin,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate admin store:', error)
          state?.clearAllData()
        }
      },
    }
  )
)