'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { managerService } from '@/services/manager.service'
import { reportsService } from '@/services/reports.service'
import { useAuth } from '@/hooks/useAuth'
import type { ClientChartDataDto, LoanChartDataDto } from '@/services/manager.service'
import type { UserReportData } from '@/services/reports.service'

export type TimeFilter = 'week' | 'month' | 'quarter' | 'custom'

interface DateRange {
  from: Date
  to: Date
}

interface SubadminData {
  id: string
  name: string
  email: string
  managersCount: number
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

interface OptimizedAdminState {
  isInitialLoading: boolean
  isInitialized: boolean
  error: string | null
  allSubadmins: SubadminData[]
  selectedSubadmin: string | null
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

export const useOptimizedAdminDashboard = () => {
  const { user } = useAuth()
  const [state, setState] = useState<OptimizedAdminState>({
    isInitialLoading: false,
    isInitialized: false,
    error: null,
    allSubadmins: [],
    selectedSubadmin: null,
    timeFilter: 'month',
    dateRange: getDateRangeForFilter('month')
  })

  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Eager loading: Load ALL data once at startup
  const loadAllData = useCallback(async (): Promise<void> => {
    if (!user || user.role !== 'admin') {
      setState(prev => ({
        ...prev,
        error: 'Solo los administradores pueden acceder a estos datos',
        isInitialized: true
      }))
      return
    }

    if (initializationRef.current) return
    initializationRef.current = true

    setState(prev => ({ ...prev, isInitialLoading: true, error: null }))

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      console.log('🚀 [EAGER LOADING] Starting parallel data fetch...')

      // Step 1: Get all subadmins
      const subadmins = await reportsService.getCreatedUsers(user.id)
      console.log('📊 [EAGER LOADING] Subadmins found:', subadmins.length)

      // Step 2: For each subadmin, load ALL their data in parallel
      const allSubadminsData = await Promise.all(
        subadmins.map(async (subadmin) => {
          try {
            // Get managers for this subadmin
            const managers = await reportsService.getCreatedUsers(subadmin.id)

            // For each manager, get their clients and loans data in parallel
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

            // Calculate totals for this subadmin
            const totalAmount = managersWithData.reduce((sum, manager) =>
              sum + manager.loans.reduce((loanSum, loan) => loanSum + (loan.amount || 0), 0), 0
            )

            const totalClients = managersWithData.reduce((sum, manager) =>
              sum + manager.clients.length, 0
            )

            const totalLoans = managersWithData.reduce((sum, manager) =>
              sum + manager.loans.length, 0
            )

            const subadminData: SubadminData = {
              id: subadmin.id,
              name: subadmin.fullName,
              email: subadmin.email,
              managersCount: managers.length,
              totalAmount,
              totalClients,
              totalLoans,
              managers: managersWithData
            }

            console.log(`✅ [EAGER LOADING] Subadmin ${subadmin.fullName}: ${managers.length} managers, $${totalAmount.toLocaleString()}`)
            return subadminData

          } catch (error) {
            console.warn(`Error loading data for subadmin ${subadmin.fullName}:`, error)
            return {
              id: subadmin.id,
              name: subadmin.fullName,
              email: subadmin.email,
              managersCount: 0,
              totalAmount: 0,
              totalClients: 0,
              totalLoans: 0,
              managers: []
            }
          }
        })
      )

      console.log('🎉 [EAGER LOADING] All data loaded successfully!')

      setState(prev => ({
        ...prev,
        allSubadmins: allSubadminsData,
        isInitialLoading: false,
        isInitialized: true
      }))

    } catch (error: unknown) {
      if ((error as Error).name !== 'AbortError') {
        const errorMessage = (error as Error).message || 'Error al cargar datos del dashboard'
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isInitialLoading: false,
          isInitialized: true
        }))
      }
    } finally {
      initializationRef.current = false
    }
  }, [user])

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

  const setSelectedSubadmin = useCallback((subadminId: string | null) => {
    setState(prev => ({ ...prev, selectedSubadmin: subadminId }))
  }, [])

  // Process chart data from cached data (instant)
  const chartData: ProcessedChartData = useMemo(() => {
    if (!state.allSubadmins.length) {
      return {
        managersPerSubadmin: [],
        amountPerSubadmin: [],
        clientsEvolution: []
      }
    }

    // Filter by selected subadmin if any
    const dataToProcess = state.selectedSubadmin
      ? state.allSubadmins.filter(s => s.id === state.selectedSubadmin)
      : state.allSubadmins

    // Process Managers per Subadmin
    const managersPerSubadmin = dataToProcess.map(subadmin => ({
      name: subadmin.name,
      value: subadmin.managersCount,
      subadminId: subadmin.id
    }))

    // Process Amount per Subadmin
    const amountPerSubadmin = dataToProcess.map(subadmin => ({
      name: subadmin.name,
      amount: subadmin.totalAmount,
      subadminId: subadmin.id
    }))

    // Process Clients Evolution (filtered by date range)
    const allClients = dataToProcess.flatMap(subadmin =>
      subadmin.managers.flatMap(manager => manager.clients)
    )

    const filteredClients = allClients.filter(client => {
      const clientDate = new Date(client.createdAt)
      return clientDate >= state.dateRange.from && clientDate <= state.dateRange.to
    })

    // Group by date (simplified - by day for now)
    const clientsByDate = filteredClients.reduce((acc, client) => {
      const dateKey = new Date(client.createdAt).toISOString().split('T')[0]
      acc[dateKey] = (acc[dateKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const clientsEvolution = Object.entries(clientsByDate).map(([date, clients]) => ({
      date,
      clients
    })).sort((a, b) => a.date.localeCompare(b.date))

    return {
      managersPerSubadmin,
      amountPerSubadmin,
      clientsEvolution
    }
  }, [state.allSubadmins, state.selectedSubadmin, state.dateRange])

  // Auto-initialize on mount
  useEffect(() => {
    if (!state.isInitialized) {
      loadAllData()
    }
  }, [loadAllData, state.isInitialized])

  // Export functionality with filtered data
  const exportDetailedData = useCallback(() => {
    const dataToExport = state.selectedSubadmin
      ? state.allSubadmins.filter(s => s.id === state.selectedSubadmin)
      : state.allSubadmins

    const csvRows = ['Subadmin,Manager,Cliente,Email Cliente,Prestamos Activos,Monto Total']

    dataToExport.forEach(subadmin => {
      subadmin.managers.forEach(manager => {
        manager.clients.forEach(client => {
          const activeLoans = client.activeLoans || 0
          const totalAmount = client.totalAmount || 0
          csvRows.push(`${subadmin.name},${manager.name},${client.fullName},${(client as any).email || 'N/A'},${activeLoans},${totalAmount}`)
        })
      })
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admin-detallado-${state.selectedSubadmin || 'todos'}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [state.allSubadmins, state.selectedSubadmin])

  return {
    ...state,
    chartData,
    setTimeFilter,
    setCustomDateRange,
    setSelectedSubadmin,
    exportDetailedData,
    refreshData: loadAllData,
    subadminOptions: state.allSubadmins.map(s => ({ id: s.id, name: s.name }))
  }
}