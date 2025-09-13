import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import { getUrgencyLevel } from './urgencyHelpers'

export interface ClientSummary {
  clientId: string
  clientName: string
  subLoans: SubLoanWithClientInfo[]
  urgencyLevel: 'overdue' | 'today' | 'soon' | 'future' | 'OVERDUE' | 'TODAY' | 'SOON' | 'UPCOMING'
  stats: {
    total: number
    overdue: number
    today: number
    soon: number
    paid: number
    totalAmount: number
    paidAmount: number
  }
}

/**
 * Groups subloans by client with summary stats
 */
export const getClientsSummary = (allSubLoansWithClient: SubLoanWithClientInfo[]): ClientSummary[] => {
  const clientsMap = new Map<string, SubLoanWithClientInfo[]>()
  
  // Group by client
  allSubLoansWithClient.forEach(subloan => {
    const clientKey = subloan.clientId || subloan.loanId
    if (!clientsMap.has(clientKey)) {
      clientsMap.set(clientKey, [])
    }
    clientsMap.get(clientKey)!.push(subloan)
  })

  // Create summaries
  return Array.from(clientsMap.entries()).map(([clientKey, subLoans]) => {
    const firstSubloan = subLoans[0]
    const clientName = firstSubloan.clientName || `Cliente #${firstSubloan.loanId}`
    
    // Calculate stats
    const overdueCount = subLoans.filter(s => getUrgencyLevel(s.dueDate) === 'overdue').length
    const todayCount = subLoans.filter(s => getUrgencyLevel(s.dueDate) === 'today').length
    const soonCount = subLoans.filter(s => getUrgencyLevel(s.dueDate) === 'soon').length
    const paidCount = subLoans.filter(s => s.status === 'PAID').length
    
    // Determine overall urgency level (worst case)
    let urgencyLevel: 'overdue' | 'today' | 'soon' | 'future' = 'future'
    if (overdueCount > 0) urgencyLevel = 'overdue'
    else if (todayCount > 0) urgencyLevel = 'today'
    else if (soonCount > 0) urgencyLevel = 'soon'
    
    return {
      clientId: firstSubloan.clientId || clientKey,
      clientName,
      subLoans: subLoans.sort((a, b) => a.paymentNumber - b.paymentNumber),
      urgencyLevel,
      stats: {
        total: subLoans.length,
        overdue: overdueCount,
        today: todayCount,
        soon: soonCount,
        paid: paidCount,
        totalAmount: subLoans.reduce((sum, s) => sum + s.totalAmount, 0),
        paidAmount: subLoans.reduce((sum, s) => sum + (s.paidAmount || 0), 0)
      }
    }
  }).sort((a, b) => {
    // Sort by urgency level first
    const urgencyOrder = { overdue: 0, today: 1, soon: 2, future: 3 }
    if (a.urgencyLevel !== b.urgencyLevel) {
      return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel]
    }
    // Then by client name
    return a.clientName.localeCompare(b.clientName)
  })
}

/**
 * Calculates legacy status statistics for backward compatibility
 */
export const getStatusStats = (allSubLoansWithClient: SubLoanWithClientInfo[]) => {
  const stats = {
    total: allSubLoansWithClient.length,
    completed: allSubLoansWithClient.filter(p => p.status === 'PAID').length,
    partial: 0, // TODO: backend no diferencia parcial aún
    pending: allSubLoansWithClient.filter(p => p.status === 'PENDING').length,
    overdue: allSubLoansWithClient.filter(p => p.status === 'OVERDUE').length,
    canceled: 0, // TODO: backend no maneja cancelados aún
    totalExpected: allSubLoansWithClient.reduce((sum, p) => sum + p.totalAmount, 0),
    totalCollected: allSubLoansWithClient.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
  }
  return stats
}