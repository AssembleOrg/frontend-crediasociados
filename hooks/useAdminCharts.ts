'use client'

import { useMemo } from 'react'
import { DateTime } from 'luxon'
import { ensureLuxonConfigured } from '@/lib/luxon-config'
import { useAdminStore } from '@/stores/admin'
import { useUsersStore } from '@/stores/users'
import type { ClientChartDataDto, LoanChartDataDto } from '@/services/manager.service'

export interface ProcessedChartData {
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

/**
 * useAdminCharts - Chart Processing Hook (Layer 4)
 *
 * Follows ARCHITECTURE_PATTERNS.md:
 * - Complex processing logic belongs in hooks (Layer 4)
 * - Store stays "dumb" with only simple getters (Layer 3)
 * - useMemo for expensive calculations
 * - Clear separation of aggregated vs individual data filtering
 *
 * REFACTORED: Now reads from usersStore + adminStore enrichments directly
 */
export const useAdminCharts = (): ProcessedChartData => {
  // Ensure Luxon is configured (lazy loaded)
  ensureLuxonConfigured()

  // Read from canonical + enrichment stores directly (avoid circular dependency)
  const usersStore = useUsersStore()
  const adminStore = useAdminStore()

  const subadmins = usersStore.users.filter(u => u.role === 'subadmin')

  // Process chart data (expensive operation) - memoized
  return useMemo((): ProcessedChartData => {
    if (!subadmins.length) {
      return {
        managersPerSubadmin: [],
        clientsEvolution: []
      }
    }

    // Combine subadmins with enrichments
    const detailedSubadmins = subadmins.map(subadmin => ({
      ...subadmin,
      ...(adminStore.subadminEnrichments[subadmin.id] || {
        totalClients: 0,
        totalLoans: 0,
        totalAmount: 0,
        managers: []
      })
    }))

    const managersPerSubadmin = detailedSubadmins.map(subadmin => ({
      name: subadmin.fullName,
      value: subadmin.managers?.length || 0,
      subadminId: subadmin.id
    }))

    // Cast to DetailedSubadminData for compatibility with processClientsEvolution
    const detailedSubadminsForProcessing = detailedSubadmins as any[] as DetailedSubadminData[]
    const clientsEvolution = processClientsEvolution(detailedSubadminsForProcessing, adminStore.dateRange)

    return {
      managersPerSubadmin,
      clientsEvolution
    }
  }, [subadmins, adminStore.subadminEnrichments, adminStore.dateRange])
}

interface DetailedSubadminData {
  id: string
  name: string
  email: string
  managersCount: number
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

function processClientsEvolution(
  detailedData: DetailedSubadminData[],
  dateRange: { from: Date; to: Date }
): Array<{ date: string; clients: number }> {
  const allClients = detailedData.flatMap(subadmin =>
    subadmin.managers.flatMap(manager => manager.clients || [])
  )

  const filteredClients = allClients.filter(client => {
    if (!client.createdAt) return true

    try {
      const clientDate = new Date(client.createdAt)
      return clientDate >= dateRange.from && clientDate <= dateRange.to
    } catch {
      return true
    }
  })

  if (filteredClients.length === 0) {
    return [{
      date: new Date().toISOString().split('T')[0],
      clients: allClients.length
    }]
  }

  const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 3600 * 24))

  if (daysDiff <= 30) {
    return groupClientsByDays(filteredClients)
  } else if (daysDiff <= 90) {
    return groupClientsByWeeks(filteredClients, dateRange)
  } else {
    return groupClientsByMonths(filteredClients, dateRange)
  }
}

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

function groupClientsByWeeks(clients: any[], dateRange: { from: Date; to: Date }): Array<{ date: string; clients: number }> {
  const clientsByWeek = clients.reduce((acc, client) => {
    const clientDate = client.createdAt ? new Date(client.createdAt) : new Date()

    const weekStart = new Date(clientDate)
    weekStart.setDate(clientDate.getDate() - clientDate.getDay() + 1)
    const weekKey = weekStart.toISOString().split('T')[0]

    acc[weekKey] = (acc[weekKey] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(clientsByWeek)
    .map(([date, clients]) => ({
      date: `${date} (Semana)`,
      clients: Number(clients)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8)
}

function groupClientsByMonths(clients: any[], dateRange: { from: Date; to: Date }): Array<{ date: string; clients: number }> {
  const clientsByMonth = clients.reduce((acc, client) => {
    const clientDate = client.createdAt
      ? DateTime.fromISO(client.createdAt)
      : DateTime.now()

    const monthKey = clientDate.startOf('month').toISODate()

    if (monthKey) {
      acc[monthKey] = (acc[monthKey] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return Object.entries(clientsByMonth)
    .map(([date, clients]) => ({
      date: DateTime.fromISO(date).toFormat('MMM yyyy', { locale: 'es' }),
      clients: Number(clients)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export const useAdminChartsWithMetadata = () => {
  const chartData = useAdminCharts()
  const adminStore = useAdminStore()
  const usersStore = useUsersStore()
  const subadmins = usersStore.users.filter(u => u.role === 'subadmin')

  return {
    chartData,
    hasDetailedData: adminStore.hasEnrichmentData(),
    aggregatedTotals: adminStore.getAggregatedTotals(subadmins),
    isLoading: !adminStore.isEnrichmentDataFresh() && !adminStore.hasEnrichmentData(),
  }
}