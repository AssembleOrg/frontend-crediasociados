'use client'

import { useMemo } from 'react'
import { useAdminStore } from '@/stores/admin'
import type { ClientChartDataDto, LoanChartDataDto } from '@/services/manager.service'

export interface ProcessedChartData {
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

/**
 * useAdminCharts - Chart Processing Hook (Layer 4)
 *
 * Follows ARCHITECTURE_PATTERNS.md:
 * - Complex processing logic belongs in hooks (Layer 4)
 * - Store stays "dumb" with only simple getters (Layer 3)
 * - useMemo for expensive calculations
 * - Clear separation of aggregated vs individual data filtering
 */
export const useAdminCharts = (): ProcessedChartData => {
  const adminStore = useAdminStore()

  // Get raw data from store
  const {
    basicData,
    detailedData,
    dateRange
  } = adminStore

  // Process chart data (expensive operation) - memoized
  return useMemo((): ProcessedChartData => {
    const dataToUse = detailedData.length > 0 ? detailedData : basicData

    if (!dataToUse.length) {
      return {
        managersPerSubadmin: [],
        amountPerSubadmin: [],
        clientsEvolution: []
      }
    }

    // 1. Managers per Subadmin (always available from basic data)
    const managersPerSubadmin = dataToUse.map(subadmin => ({
      name: subadmin.name,
      value: subadmin.managersCount,
      subadminId: subadmin.id
    }))

    // 2. Amount per Subadmin (only if detailed data available)
    // NOTE: This is AGGREGATED data - no temporal filtering applied
    // Shows total amounts managed by each subadmin regardless of time period
    const amountPerSubadmin = detailedData.length > 0
      ? detailedData.map(subadmin => ({
          name: subadmin.name,
          amount: subadmin.totalAmount, // Total amount - not filtered by date
          subadminId: subadmin.id
        }))
      : []

    // 3. Clients Evolution (only if detailed data available)
    // NOTE: Temporal filters applied to INDIVIDUAL clients, not aggregated totals
    const clientsEvolution = detailedData.length > 0
      ? processClientsEvolution(detailedData, dateRange)
      : []

    return {
      managersPerSubadmin,
      amountPerSubadmin,
      clientsEvolution
    }
  }, [basicData, detailedData, dateRange]) // Safe dependencies - store values
}

interface DetailedSubadminData {
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

/**
 * Process clients evolution data with intelligent temporal grouping
 * - Daily: periods ≤ 30 days
 * - Weekly: periods > 30 days and ≤ 90 days
 * - Monthly: periods > 90 days
 */
function processClientsEvolution(
  detailedData: DetailedSubadminData[],
  dateRange: { from: Date; to: Date }
): Array<{ date: string; clients: number }> {
  // Get all individual clients from all managers
  const allClients = detailedData.flatMap(subadmin =>
    subadmin.managers.flatMap(manager => manager.clients || [])
  )

  // Only filter individual clients by date (not aggregated data)
  const filteredClients = allClients.filter(client => {
    // If no createdAt, include in current period for visualization
    if (!client.createdAt) return true

    try {
      const clientDate = new Date(client.createdAt)
      return clientDate >= dateRange.from && clientDate <= dateRange.to
    } catch {
      return true // Include clients with invalid dates
    }
  })

  // If no clients in the time period, return current totals (not empty)
  if (filteredClients.length === 0) {
    return [{
      date: new Date().toISOString().split('T')[0],
      clients: allClients.length // Show total clients available
    }]
  }

  // Determine grouping strategy based on date range
  const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 3600 * 24))

  if (daysDiff <= 30) {
    // DAILY: Group by individual days
    return groupClientsByDays(filteredClients)
  } else if (daysDiff <= 90) {
    // WEEKLY: Group by weeks
    return groupClientsByWeeks(filteredClients, dateRange)
  } else {
    // MONTHLY: Group by months
    return groupClientsByMonths(filteredClients, dateRange)
  }
}

/**
 * Group clients by individual days
 */
function groupClientsByDays(clients: any[]): Array<{ date: string; clients: number }> {
  const clientsByDate = clients.reduce((acc, client) => {
    const dateKey = client.createdAt
      ? new Date(client.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    acc[dateKey] = (acc[dateKey] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(clientsByDate)
    .map(([date, clients]) => ({ date, clients: Number(clients) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Group clients by weeks (Monday to Sunday)
 */
function groupClientsByWeeks(clients: any[], dateRange: { from: Date; to: Date }): Array<{ date: string; clients: number }> {
  const clientsByWeek = clients.reduce((acc, client) => {
    const clientDate = client.createdAt ? new Date(client.createdAt) : new Date()

    // Get Monday of the week
    const weekStart = new Date(clientDate)
    weekStart.setDate(clientDate.getDate() - clientDate.getDay() + 1) // Monday = 1
    const weekKey = weekStart.toISOString().split('T')[0]

    acc[weekKey] = (acc[weekKey] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(clientsByWeek)
    .map(([date, clients]) => ({
      date: `${date} (Semana)`, // Show it's a week grouping
      clients: Number(clients)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Group clients by months
 */
function groupClientsByMonths(clients: any[], dateRange: { from: Date; to: Date }): Array<{ date: string; clients: number }> {
  const clientsByMonth = clients.reduce((acc, client) => {
    const clientDate = client.createdAt ? new Date(client.createdAt) : new Date()

    // Get first day of month
    const monthStart = new Date(clientDate.getFullYear(), clientDate.getMonth(), 1)
    const monthKey = monthStart.toISOString().split('T')[0]

    acc[monthKey] = (acc[monthKey] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(clientsByMonth)
    .map(([date, clients]) => ({
      date: `${date.substring(0, 7)} (Mes)`, // YYYY-MM format with label
      clients: Number(clients)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Hook for components that need both chart data and metadata
 */
export const useAdminChartsWithMetadata = () => {
  const chartData = useAdminCharts()
  const adminStore = useAdminStore()

  return {
    chartData,
    hasDetailedData: adminStore.hasDetailedData(),
    aggregatedTotals: adminStore.getAggregatedTotals(),
    isDataFresh: adminStore.isBasicDataFresh(),
  }
}