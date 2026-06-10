'use client'

import { useMemo } from 'react'
import type { Client } from '@/types/auth'

export interface PrestamistaChartData {
  clientsEvolution: Array<{ date: string; clients: number }>
  loansEvolution: Array<{ date: string; loans: number }>
  paymentsDistribution: Array<{ name: string; value: number; color: string }>
}

const STATUS_COLORS: Record<string, { label: string; color: string }> = {
  PAID: { label: 'Pagado', color: '#2e7d32' },
  PENDING: { label: 'Pendiente', color: '#1976d2' },
  OVERDUE: { label: 'Vencido', color: '#d32f2f' },
  PARTIAL: { label: 'Parcial', color: '#ff9800' },
  CANCELED: { label: 'Cancelado', color: '#757575' }
}

export const usePrestamistaCharts = (
  clients: Client[],
  loansEvolution: Array<{ date: string; loans: number }>,
  paymentsDistribution: Array<{ status: string; count: number }>
): PrestamistaChartData => {
  return useMemo(() => {
    // Clients evolution - process from client data
    const clientsByWeek = clients.reduce((acc, client) => {
      const d = client.createdAt ? new Date(client.createdAt) : new Date()
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay() + 1)
      const weekKey = weekStart.toISOString().split('T')[0]
      acc[weekKey] = (acc[weekKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const clientsEvolutionData = Object.entries(clientsByWeek)
      .map(([date, count]) => ({ date: `${date} (Semana)`, clients: count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8)

    // Loans evolution - already computed by backend
    const loansEvolutionData = loansEvolution.map(l => ({
      date: `${l.date} (Semana)`,
      loans: l.loans
    }))

    // Payments distribution - map from backend counts
    const paymentsDistributionData = paymentsDistribution.map(d => ({
      name: STATUS_COLORS[d.status]?.label || d.status,
      value: d.count,
      color: STATUS_COLORS[d.status]?.color || '#9e9e9e'
    }))

    return {
      clientsEvolution: clientsEvolutionData,
      loansEvolution: loansEvolutionData,
      paymentsDistribution: paymentsDistributionData
    }
  }, [clients, loansEvolution, paymentsDistribution])
}
