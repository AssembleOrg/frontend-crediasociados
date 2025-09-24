'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { managerService } from '@/services/manager.service'
import { reportsService } from '@/services/reports.service'
import { useAuth } from '@/hooks/useAuth'
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

interface DetailedSubadminData extends BasicSubadminData {
  totalAmount: number
  totalClients: number
  totalLoans: number
  managers: Array<{
    id: string
    name: string
    email: string
    clients: ClientChartDataDto[]
    loans: LoanChartDataDto[]
  }>
}

interface ProgressiveAdminState {
  // Loading states
  isBasicLoading: boolean
  isDetailedLoading: boolean
  isInitialized: boolean
  error: string | null

  // Data states
  basicData: BasicSubadminData[]
  detailedData: DetailedSubadminData[]

  // Filters
  timeFilter: TimeFilter
  dateRange: DateRange
}

interface ProcessedChartData {
  managersPerSubadmin: Array<{
    name: string
    value: number
    subadminId: string
  }>
  amountPerSubadmin: Array<{
    name: string
    amount: number
    subadminId: string
  }>
  clientsEvolution: Array<{
    date: string
    clients: number
  }>
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

export const useProgressiveAdminDashboard = () => {
  const { user } = useAuth()
  const [state, setState] = useState<ProgressiveAdminState>({
    isBasicLoading: false,
    isDetailedLoading: false,
    isInitialized: false,
    error: null,
    basicData: [],
    detailedData: [],
    timeFilter: 'month',
    dateRange: getDateRangeForFilter('month')
  })

  const basicLoadingRef = useRef(false)
  const detailedLoadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const detailedAbortControllerRef = useRef<AbortController | null>(null)

  // Phase 1: Load basic structure quickly (subadmins + manager counts)
  const loadBasicStructure = useCallback(async (): Promise<void> => {
    if (!user) {
      console.log('⏳ [PROGRESSIVE] User not loaded yet, waiting...')
      return
    }

    if (user.role !== 'admin') {
      setState(prev => ({
        ...prev,
        error: 'Solo los administradores pueden acceder a estos datos',
        isInitialized: true
      }))
      return
    }

    if (basicLoadingRef.current) return
    basicLoadingRef.current = true

    setState(prev => ({ ...prev, isBasicLoading: true, error: null }))

    try {
      console.log('🚀 [PROGRESSIVE] Phase 1: Loading basic structure...')

      // Get subadmins
      const subadmins = await reportsService.getCreatedUsers(user.id)

      // Get manager counts for each subadmin (quick parallel calls)
      const basicData = await Promise.all(
        subadmins.map(async (subadmin) => {
          try {
            const managers = await reportsService.getCreatedUsers(subadmin.id)
            return {
              id: subadmin.id,
              name: subadmin.fullName,
              email: subadmin.email,
              managersCount: managers.length
            }
          } catch (error) {
            console.warn(`Error loading managers count for ${subadmin.fullName}:`, error)
            return {
              id: subadmin.id,
              name: subadmin.fullName,
              email: subadmin.email,
              managersCount: 0
            }
          }
        })
      )

      console.log('✅ [PROGRESSIVE] Phase 1 complete: Basic structure loaded')

      setState(prev => ({
        ...prev,
        basicData,
        isBasicLoading: false,
        isInitialized: true
      }))

      // Auto-trigger phase 2
      setTimeout(() => loadDetailedData(), 100)

    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 'Error al cargar estructura básica'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isBasicLoading: false,
        isInitialized: true
      }))
    } finally {
      basicLoadingRef.current = false
    }
  }, [user])

  // Phase 2: Load detailed data in background
  const loadDetailedData = useCallback(async (): Promise<void> => {
    if (!user || user.role !== 'admin' || !state.basicData.length) return

    // Prevent race conditions - check if already loading
    if (detailedLoadingRef.current) {
      console.log('⏳ [PROGRESSIVE] Phase 2 already loading, skipping...')
      return
    }
    detailedLoadingRef.current = true

    setState(prev => ({ ...prev, isDetailedLoading: true }))

    // Cancel any existing detailed requests
    if (detailedAbortControllerRef.current) {
      detailedAbortControllerRef.current.abort()
    }
    detailedAbortControllerRef.current = new AbortController()

    try {
      console.log('🚀 [PROGRESSIVE] Phase 2: Loading detailed data...')

      const detailedData = await Promise.all(
        state.basicData.map(async (basicSubadmin) => {
          try {
            // Get managers for this subadmin
            const managers = await reportsService.getCreatedUsers(basicSubadmin.id)

            // For each manager, get their data in parallel
            const managersWithData = await Promise.all(
              managers.map(async (manager) => {
                try {
                  const [clientsData, loansData] = await Promise.all([
                    managerService.getManagerClientsChart(manager.id, {}),
                    managerService.getManagerLoansChart(manager.id, {})
                  ])

                  return {
                    id: manager.id,
                    name: manager.fullName,
                    email: manager.email,
                    clients: clientsData,
                    loans: loansData
                  }
                } catch (error) {
                  console.warn(`Error loading data for manager ${manager.fullName}:`, error)
                  return {
                    id: manager.id,
                    name: manager.fullName,
                    email: manager.email,
                    clients: [],
                    loans: []
                  }
                }
              })
            )

            // Calculate totals
            const totalAmount = managersWithData.reduce((sum, manager) =>
              sum + manager.loans.reduce((loanSum, loan) => loanSum + (loan.amount || 0), 0), 0
            )

            const totalClients = managersWithData.reduce((sum, manager) =>
              sum + manager.clients.length, 0
            )

            const totalLoans = managersWithData.reduce((sum, manager) =>
              sum + manager.loans.length, 0
            )

            return {
              ...basicSubadmin,
              totalAmount,
              totalClients,
              totalLoans,
              managers: managersWithData
            }

          } catch (error) {
            console.warn(`Error loading detailed data for ${basicSubadmin.name}:`, error)
            return {
              ...basicSubadmin,
              totalAmount: 0,
              totalClients: 0,
              totalLoans: 0,
              managers: []
            }
          }
        })
      )

      console.log('✅ [PROGRESSIVE] Phase 2 complete: Detailed data loaded')

      setState(prev => ({
        ...prev,
        detailedData,
        isDetailedLoading: false
      }))

    } catch (error: unknown) {
      if ((error as Error).name !== 'AbortError') {
        console.warn('Error loading detailed data:', error)
        setState(prev => ({ ...prev, isDetailedLoading: false }))
      }
    } finally {
      detailedLoadingRef.current = false
    }
  }, [user, state.basicData])

  // Local filtering (instant) - no API calls
  const setTimeFilter = useCallback((filter: TimeFilter) => {
    setState(prev => ({
      ...prev,
      timeFilter: filter,
      dateRange: getDateRangeForFilter(filter)
    }))
  }, [])

  const setCustomDateRange = useCallback((dateRange: DateRange) => {
    setState(prev => ({
      ...prev,
      timeFilter: 'custom',
      dateRange
    }))
  }, [])

  // Process chart data from available data (basic or detailed)
  const chartData: ProcessedChartData = useMemo(() => {
    const dataToUse = state.detailedData.length > 0 ? state.detailedData : state.basicData

    if (!dataToUse.length) {
      return {
        managersPerSubadmin: [],
        amountPerSubadmin: [],
        clientsEvolution: []
      }
    }

    // Managers per Subadmin (always available)
    const managersPerSubadmin = dataToUse.map(subadmin => ({
      name: subadmin.name,
      value: subadmin.managersCount,
      subadminId: subadmin.id
    }))

    // Amount per Subadmin (only if detailed data available)
    const amountPerSubadmin = state.detailedData.length > 0
      ? state.detailedData.map(subadmin => ({
          name: subadmin.name,
          amount: subadmin.totalAmount,
          subadminId: subadmin.id
        }))
      : []

    // Clients Evolution (only if detailed data available)
    const clientsEvolution = state.detailedData.length > 0
      ? (() => {
          const allClients = state.detailedData.flatMap(subadmin =>
            subadmin.managers.flatMap(manager => manager.clients)
          )

          const filteredClients = allClients.filter(client => {
            const clientDate = new Date(client.createdAt)
            return clientDate >= state.dateRange.from && clientDate <= state.dateRange.to
          })

          const clientsByDate = filteredClients.reduce((acc, client) => {
            const dateKey = new Date(client.createdAt).toISOString().split('T')[0]
            acc[dateKey] = (acc[dateKey] || 0) + 1
            return acc
          }, {} as Record<string, number>)

          return Object.entries(clientsByDate).map(([date, clients]) => ({
            date,
            clients
          })).sort((a, b) => a.date.localeCompare(b.date))
        })()
      : []

    return {
      managersPerSubadmin,
      amountPerSubadmin,
      clientsEvolution
    }
  }, [state.basicData, state.detailedData, state.dateRange])

  // Auto-initialize on mount
  useEffect(() => {
    if (!state.isInitialized && user) {
      loadBasicStructure()
    }
  }, [loadBasicStructure, state.isInitialized, user])

  // Cleanup function for components
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (detailedAbortControllerRef.current) {
      detailedAbortControllerRef.current.abort()
    }
  }, [])

  return {
    ...state,
    chartData,
    setTimeFilter,
    setCustomDateRange,
    refreshData: loadBasicStructure,
    hasDetailedData: state.detailedData.length > 0,
    cleanup
  }
}