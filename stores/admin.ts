'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { DateTime } from 'luxon'
import { ensureLuxonConfigured } from '@/lib/luxon-config'
import type { AdminReportData } from '@/services/reports.service'
import type { ClientChartDataDto, LoanChartDataDto } from '@/services/manager.service'

export type TimeFilter = 'week' | 'month' | 'quarter' | 'custom'

interface DateRange {
  from: Date
  to: Date
}

interface BasicSubadminData {
  id: string
  name: string
  email: string
  managersCount: number
}

interface ManagerData {
  id: string
  name: string
  email: string
  clients: ClientChartDataDto[]
  loans: LoanChartDataDto[]
}

interface DetailedSubadminData extends BasicSubadminData {
  totalClients: number
  totalLoans: number
  managers: ManagerData[]
}

interface ProcessedChartData {
  managersPerSubadmin: Array<{
    name: string
    value: number
    subadminId: string
  }>
  clientsEvolution: Array<{
    date: string
    clients: number
  }>
}

interface AdminStore {
  // State - Session data that should persist
  reports: AdminReportData | null
  basicData: BasicSubadminData[]
  detailedData: DetailedSubadminData[]
  lastFetch: Date | null
  lastDetailedFetch: Date | null

  // Filters (persist during session)
  timeFilter: TimeFilter
  dateRange: DateRange
  selectedSubadmin: string | null

  // Simple synchronous actions only
  setReports: (reports: AdminReportData | null) => void
  setBasicData: (data: BasicSubadminData[]) => void
  setDetailedData: (data: DetailedSubadminData[]) => void
  setLastFetch: (date: Date) => void
  setLastDetailedFetch: (date: Date) => void

  // Filter setters
  setTimeFilter: (filter: TimeFilter) => void
  setDateRange: (range: DateRange) => void
  setSelectedSubadmin: (id: string | null) => void

  isBasicDataFresh: () => boolean
  isDetailedDataFresh: () => boolean
  hasDetailedData: () => boolean
  getAggregatedTotals: () => { totalClients: number; totalLoans: number }
  getSubadminOptions: () => Array<{ id: string; name: string }>

  clearAllData: () => void
  clearDetailedData: () => void

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
      basicData: [],
      detailedData: [],
      lastFetch: null,
      lastDetailedFetch: null,
      timeFilter: 'month',
      dateRange: getDateRangeForFilter('month'),
      selectedSubadmin: null,

      setReports: (reports) => {
        set((state) => {
          state.reports = reports
          state.lastFetch = new Date()
        })
      },

      setBasicData: (data) => {
        set((state) => {
          state.basicData = data
          state.lastFetch = new Date()
        })
      },

      setDetailedData: (data) => {
        set((state) => {
          state.detailedData = data
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

      setSelectedSubadmin: (id) => {
        set((state) => {
          state.selectedSubadmin = id
        })
      },

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
        return get().detailedData.length > 0
      },

      getAggregatedTotals: () => {
        const { detailedData } = get()

        if (detailedData.length === 0) {
          return { totalClients: 0, totalLoans: 0 }
        }

        return {
          totalClients: detailedData.reduce((sum, subadmin) => sum + (subadmin.totalClients || 0), 0),
          totalLoans: detailedData.reduce((sum, subadmin) => sum + (subadmin.totalLoans || 0), 0)
        }
      },

      getSubadminOptions: () => {
        const { detailedData, basicData } = get()
        const data = detailedData.length > 0 ? detailedData : basicData

        return data.map(subadmin => ({
          id: subadmin.id,
          name: subadmin.name
        }))
      },

      clearAllData: () => {
        set((state) => {
          state.reports = null
          state.basicData = []
          state.detailedData = []
          state.lastFetch = null
          state.lastDetailedFetch = null
        })
      },

      clearDetailedData: () => {
        set((state) => {
          state.detailedData = []
          state.lastDetailedFetch = null
        })
      },

      invalidateCache: () => {
        set((state) => {
          state.lastFetch = null
          state.lastDetailedFetch = null
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
          if (state.lastFetch) {
            state.lastFetch = new Date(state.lastFetch)
          }
          if (state.lastDetailedFetch) {
            state.lastDetailedFetch = new Date(state.lastDetailedFetch)
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
        basicData: state.basicData,
        detailedData: state.detailedData,
        lastFetch: state.lastFetch,
        lastDetailedFetch: state.lastDetailedFetch,
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