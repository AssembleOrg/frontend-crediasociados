'use client'

import { useMemo } from 'react'
import type { Client, Loan } from '@/types/auth'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

export interface PrestamistaChartData {
  clientsEvolution: Array<{ date: string; clients: number }>
  loansEvolution: Array<{ date: string; loans: number }>
  paymentsDistribution: Array<{ name: string; value: number; color: string }>
}

export const usePrestamistaCharts = (
  clients: Client[],
  loans: Loan[],
  subLoans: SubLoanWithClientInfo[]
): PrestamistaChartData => {
  return useMemo(() => {
    const clientsEvolution = processClientsEvolution(clients)
    const loansEvolution = processLoansEvolution(loans)
    const paymentsDistribution = processPaymentsDistribution(subLoans)

    return {
      clientsEvolution,
      loansEvolution,
      paymentsDistribution
    }
  }, [clients, loans, subLoans])
}

function processClientsEvolution(clients: Client[]): Array<{ date: string; clients: number }> {
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

function processLoansEvolution(loans: Loan[]): Array<{ date: string; loans: number }> {
  const loansByWeek = loans.reduce((acc, loan) => {
    const loanDate = loan.createdAt ? new Date(loan.createdAt) : new Date()
    const weekStart = new Date(loanDate)
    weekStart.setDate(loanDate.getDate() - loanDate.getDay() + 1)
    const weekKey = weekStart.toISOString().split('T')[0]

    acc[weekKey] = (acc[weekKey] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(loansByWeek)
    .map(([date, loans]) => ({
      date: `${date} (Semana)`,
      loans: Number(loans)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8)
}

function processPaymentsDistribution(subLoans: SubLoanWithClientInfo[]): Array<{ name: string; value: number; color: string }> {
  const distribution = subLoans.reduce((acc, subloan) => {
    const status = subloan.status || 'PENDING'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusColors: Record<string, { label: string; color: string }> = {
    PAID: { label: 'Pagado', color: '#2e7d32' },
    PENDING: { label: 'Pendiente', color: '#1976d2' },
    OVERDUE: { label: 'Vencido', color: '#d32f2f' },
    PARTIAL: { label: 'Parcial', color: '#ff9800' },
    CANCELED: { label: 'Cancelado', color: '#757575' }
  }

  return Object.entries(distribution).map(([status, value]) => ({
    name: statusColors[status]?.label || status,
    value: Number(value),
    color: statusColors[status]?.color || '#9e9e9e'
  }))
}