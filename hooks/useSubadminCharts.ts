'use client'

import { useMemo } from 'react'
import { DateTime } from 'luxon'
import { ensureLuxonConfigured } from '@/lib/luxon-config'
import { useSubadminStore } from '@/stores/subadmin'
import type { ClientChartDataDto } from '@/services/manager.service'

export interface ProcessedSubadminChartData {
  clientesPerManager: Array<{
    name: string
    clientCount: number
    asociadoId: string
  }>
  clientsEvolution: Array<{
    date: string
    clients: number
  }>
}

interface DetailedManagerData {
  id: string
  name: string
  email: string
  clientsCount: number
  totalAmount: number
  totalClients: number
  totalLoans: number
  clients: ClientChartDataDto[]
  loans: any[]
}

/**
 * useSubadminCharts - Chart Processing Hook for Subadmin
 *
 * Equivalent to useAdminCharts but for managers data
 * - Processes detailedManagers from store
 * - Generates chart data with date range filters
 */
export const useSubadminCharts = (): ProcessedSubadminChartData => {
  // Ensure Luxon is configured (lazy loaded)
  ensureLuxonConfigured()

  const subadminStore = useSubadminStore()

  const {
    detailedManagers,
    dateRange
  } = subadminStore

  return useMemo((): ProcessedSubadminChartData => {
    if (!detailedManagers.length) {
      return {
        clientesPerManager: [],
        clientsEvolution: []
      }
    }

    const clientesPerManager = detailedManagers.map(manager => ({
      name: manager.name,
      clientCount: manager.totalClients,
      asociadoId: manager.id
    }))

    const clientsEvolution = processClientsEvolution(detailedManagers, dateRange)

    return {
      clientesPerManager,
      clientsEvolution
    }
  }, [detailedManagers, dateRange])
}

function processClientsEvolution(
  detailedManagers: DetailedManagerData[],
  dateRange: { from: Date; to: Date }
): Array<{ date: string; clients: number }> {
  const allClients = detailedManagers.flatMap(manager => manager.clients || [])

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