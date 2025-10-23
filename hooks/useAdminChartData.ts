'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { managerService } from '@/services/manager.service'
import { reportsService } from '@/services/reports.service'
import { useAuth } from '@/hooks/useAuth'
import type { LoanChartDataDto } from '@/services/manager.service'

export type TimeFilter = 'week' | 'month' | 'quarter' | 'custom'

interface DateRange {
  from: Date
  to: Date
}

interface AdminChartState {
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  allLoansData: LoanChartDataDto[]
  timeFilter: TimeFilter
  dateRange: DateRange
}

interface ChartData {
  loansEvolution: Array<{
    date: string
    active: number
    completed: number
    overdue: number
    cancelled: number
  }>
  statusDistribution: Array<{
    name: string
    value: number
    amount: number
  }>
  currencyDistribution: Array<{
    name: string
    value: number
    amount: number
  }>
  paymentFrequencyDistribution: Array<{
    name: string
    value: number
  }>
  upcomingDues: LoanChartDataDto[]
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

export const useAdminChartData = () => {
  const { user } = useAuth()
  const [state, setState] = useState<AdminChartState>({
    isLoading: false,
    isInitialized: false,
    error: null,
    allLoansData: [],
    timeFilter: 'month',
    dateRange: getDateRangeForFilter('month')
  })

  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchChartData = useCallback(async (timeFilter: TimeFilter, customDateRange?: DateRange): Promise<void> => {
    if (!user || user.role !== 'admin') {
      setState(prev => ({
        ...prev,
        error: 'Solo los administradores pueden acceder a estos datos',
        isInitialized: true
      }))
      return
    }

    const dateRange = customDateRange || getDateRangeForFilter(timeFilter)

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      timeFilter,
      dateRange
    }))

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      console.log('🔍 [DEBUG] Admin Chart Data - Starting fetch...', { timeFilter, dateRange })

      // Step 1: Get all subadmins created by this admin
      const subadmins = await reportsService.getCreatedUsers(user?.id || '')
      console.log('🔍 [DEBUG] Admin Chart Data - Subadmins found:', subadmins.length)

      // Step 2: For each subadmin, get their managers and collect loan data
      const allLoansData: LoanChartDataDto[] = []

      for (const subadmin of subadmins) {
        try {
          // Get managers for this subadmin
          const managers = await reportsService.getCreatedUsers(subadmin.id)

          // For each manager, get their loans chart data with date filters
          for (const manager of managers) {
            try {
              const managerLoans = await managerService.getManagerLoansChart(manager.id, {
                createdFrom: dateRange.from.toISOString(),
                createdTo: dateRange.to.toISOString()
              })

              allLoansData.push(...managerLoans)
            } catch (error) {
              console.warn(`Error fetching loans for manager ${manager.fullName}:`, error)
            }
          }
        } catch (error) {
          console.warn(`Error fetching managers for subadmin ${subadmin.fullName}:`, error)
        }
      }

      console.log('🔍 [DEBUG] Admin Chart Data - Total loans collected:', allLoansData.length)

      setState(prev => ({
        ...prev,
        allLoansData,
        isLoading: false,
        isInitialized: true
      }))

    } catch (error: unknown) {
      if ((error as Error).name !== 'AbortError') {
        const errorMessage = (error as Error).message || 'Error al cargar datos de gráficos'
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          isInitialized: true
        }))
      }
    }
  }, [user])

  const setTimeFilter = useCallback((filter: TimeFilter) => {
    fetchChartData(filter)
  }, [fetchChartData])

  const setCustomDateRange = useCallback((dateRange: DateRange) => {
    fetchChartData('custom', dateRange)
  }, [fetchChartData])

  const refreshData = useCallback(() => {
    fetchChartData(state.timeFilter, state.timeFilter === 'custom' ? state.dateRange : undefined)
  }, [fetchChartData, state.timeFilter, state.dateRange])

  // Process chart data from raw loans data
  const chartData: ChartData = useMemo(() => {
    if (!state.allLoansData.length) {
      return {
        loansEvolution: [],
        statusDistribution: [],
        currencyDistribution: [],
        paymentFrequencyDistribution: [],
        upcomingDues: []
      }
    }

    // Process status distribution
    const statusCount = state.allLoansData.reduce((acc, loan) => {
      const status = loan.status || 'UNKNOWN'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count,
      amount: state.allLoansData
        .filter(loan => loan.status === status)
        .reduce((sum, loan) => sum + (loan.amount || 0), 0)
    }))

    // Process currency distribution
    const currencyCount = state.allLoansData.reduce((acc, loan) => {
      const currency = loan.currency || 'ARS'
      acc[currency] = (acc[currency] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const currencyDistribution = Object.entries(currencyCount).map(([currency, count]) => ({
      name: currency,
      value: count,
      amount: state.allLoansData
        .filter(loan => loan.currency === currency)
        .reduce((sum, loan) => sum + (loan.amount || 0), 0)
    }))

    // Process payment frequency distribution
    const frequencyCount = state.allLoansData.reduce((acc, loan) => {
      const frequency = loan.paymentFrequency || 'MONTHLY'
      acc[frequency] = (acc[frequency] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const paymentFrequencyDistribution = Object.entries(frequencyCount).map(([frequency, count]) => ({
      name: frequency,
      value: count
    }))

    // Get upcoming dues (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const upcomingDues = state.allLoansData.filter(loan => {
      if (!loan.nextDueDate) return false
      const dueDate = new Date(loan.nextDueDate)
      return dueDate >= new Date() && dueDate <= nextWeek
    }).sort((a, b) => {
      const dateA = new Date(a.nextDueDate || 0)
      const dateB = new Date(b.nextDueDate || 0)
      return dateA.getTime() - dateB.getTime()
    })

    // TODO: Process loans evolution by date (grouping by week/month)
    const loansEvolution: any[] = [] // Implement date grouping logic

    return {
      loansEvolution,
      statusDistribution,
      currencyDistribution,
      paymentFrequencyDistribution,
      upcomingDues
    }
  }, [state.allLoansData])

  return {
    ...state,
    chartData,
    setTimeFilter,
    setCustomDateRange,
    refreshData,
    fetchChartData
  }
}