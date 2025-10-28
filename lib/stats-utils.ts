import type { Client, Loan } from '@/types/auth'

export interface DashboardStats {
  totalClients: number
  totalActiveLoans: number
  totalLoanAmount: number
  averagePaymentRate: number
  monthlyGrowth: number
  pendingApprovals: number
  completedLoans: number
  overdueLoans: number
  collectionEfficiency: number
  averageApprovalTime: number
}

export interface ClientsStats {
  totalClients: number
  newClientsThisMonth: number
  activeClients: number
  clientsWithLoans: number
  averageClientAge: number
  clientDistribution: {
    withEmail: number
    withPhone: number
    withDNI: number
    withCUIT: number
  }
}

export interface LoansStats {
  totalLoans: number
  activeLoans: number
  completedLoans: number
  totalAmount: number
  averageLoanAmount: number
  totalInterestEarned: number
  overdueAmount: number
  collectionRate: number
  loansByStatus: {
    active: number
    completed: number
    overdue: number
    pending: number
  }
  loansByFrequency: {
    daily: number
    weekly: number
    biweekly: number
    monthly: number
  }
}

export class StatsUtils {
  static calculateClientStats(clients: Client[]): ClientsStats {
    if (!clients.length) {
      return {
        totalClients: 0,
        newClientsThisMonth: 0,
        activeClients: 0,
        clientsWithLoans: 0,
        averageClientAge: 0,
        clientDistribution: {
          withEmail: 0,
          withPhone: 0,
          withDNI: 0,
          withCUIT: 0
        }
      }
    }

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const newClientsThisMonth = clients.filter(client => 
      client.createdAt && new Date(client.createdAt) >= thisMonth
    ).length

    const clientDistribution = {
      withEmail: clients.filter(c => c.email).length,
      withPhone: clients.filter(c => c.phone).length,
      withDNI: clients.filter(c => c.dni).length,
      withCUIT: clients.filter(c => c.cuit).length
    }

    return {
      totalClients: clients.length,
      newClientsThisMonth,
      activeClients: clients.length, // All clients are considered active for now
      clientsWithLoans: 0, // TODO: Calculate based on loans data
      averageClientAge: 0, // TODO: Calculate based on birthdate if available
      clientDistribution
    }
  }

  static calculateLoanStats(loans: Loan[]): LoansStats {
    if (!loans.length) {
      return {
        totalLoans: 0,
        activeLoans: 0,
        completedLoans: 0,
        totalAmount: 0,
        averageLoanAmount: 0,
        totalInterestEarned: 0,
        overdueAmount: 0,
        collectionRate: 0,
        loansByStatus: {
          active: 0,
          completed: 0,
          overdue: 0,
          pending: 0
        },
        loansByFrequency: {
          daily: 0,
          weekly: 0,
          biweekly: 0,
          monthly: 0
        }
      }
    }

    const totalAmount = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0)
    const averageLoanAmount = totalAmount / loans.length

    // Group by status (mock for now - real implementation would use loan.status)
    const loansByStatus = {
      active: Math.floor(loans.length * 0.6),
      completed: Math.floor(loans.length * 0.3),
      overdue: Math.floor(loans.length * 0.08),
      pending: Math.floor(loans.length * 0.02)
    }

    // Group by frequency (mock for now)
    const loansByFrequency = {
      daily: Math.floor(loans.length * 0.1),
      weekly: Math.floor(loans.length * 0.6),
      biweekly: Math.floor(loans.length * 0.2),
      monthly: Math.floor(loans.length * 0.1)
    }

    const totalInterestEarned = totalAmount * 0.15 // Mock 15% average interest

    return {
      totalLoans: loans.length,
      activeLoans: loansByStatus.active,
      completedLoans: loansByStatus.completed,
      totalAmount,
      averageLoanAmount,
      totalInterestEarned,
      overdueAmount: totalAmount * 0.08, // Mock 8% overdue
      collectionRate: 92, // Mock 92% collection rate
      loansByStatus,
      loansByFrequency
    }
  }

  static calculateDashboardStats(clients: Client[], loans: Loan[]): DashboardStats {
    const clientStats = this.calculateClientStats(clients)
    const loanStats = this.calculateLoanStats(loans)

    return {
      totalClients: clientStats.totalClients,
      totalActiveLoans: loanStats.activeLoans,
      totalLoanAmount: loanStats.totalAmount,
      averagePaymentRate: loanStats.collectionRate,
      monthlyGrowth: clientStats.newClientsThisMonth > 0 ? 
        (clientStats.newClientsThisMonth / Math.max(clientStats.totalClients - clientStats.newClientsThisMonth, 1)) * 100 : 0,
      pendingApprovals: loanStats.loansByStatus.pending,
      completedLoans: loanStats.completedLoans,
      overdueLoans: loanStats.loansByStatus.overdue,
      collectionEfficiency: loanStats.collectionRate,
      averageApprovalTime: 2.3 // Mock data - 2.3 days average
    }
  }

  static formatCurrency(amount: number, currency: string = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`
  }

  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  static getTrendDirection(growthRate: number): 'up' | 'down' | 'stable' {
    if (growthRate > 1) return 'up'
    if (growthRate < -1) return 'down'
    return 'stable'
  }
}