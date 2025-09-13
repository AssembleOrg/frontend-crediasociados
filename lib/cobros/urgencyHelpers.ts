import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

export type UrgencyLevel = 'OVERDUE' | 'TODAY' | 'SOON' | 'UPCOMING' | 'overdue' | 'today' | 'soon' | 'future'

export interface UrgencyColors {
  primary: string
  bg: string
  border: string
}

/**
 * Determines urgency level based on due date
 */
export const getUrgencyLevel = (dueDate: string): 'overdue' | 'today' | 'soon' | 'future' => {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'overdue' // Ya vencido
  if (diffDays === 0) return 'today' // Vence hoy
  if (diffDays <= 2) return 'soon' // Vence pronto (1-2 días)
  return 'future' // Futuro (más de 2 días)
}

/**
 * Get urgency color scheme for client summary cards
 */
export const getUrgencyColor = (urgencyLevel: UrgencyLevel): UrgencyColors => {
  switch (urgencyLevel) {
    case 'OVERDUE':
    case 'overdue':
      return { primary: '#f44336', bg: '#ffebee', border: '#f44336' }
    case 'TODAY':
    case 'today':
      return { primary: '#ff9800', bg: '#fff3e0', border: '#ff9800' }
    case 'SOON':
    case 'soon':
      return { primary: '#ffc107', bg: '#fff8e1', border: '#ffc107' }
    default:
      return { primary: '#9e9e9e', bg: '#f5f5f5', border: '#e0e0e0' }
  }
}

/**
 * Get row styling based on urgency for tables
 */
export const getRowStyling = (payment: SubLoanWithClientInfo) => {
  const urgency = getUrgencyLevel(payment.dueDate)
  switch (urgency) {
    case 'overdue':
      return { bgcolor: '#ffebee', borderLeft: '4px solid #f44336' } // Red
    case 'today':
      return { bgcolor: '#fff3e0', borderLeft: '4px solid #ff9800' } // Orange  
    case 'soon':
      return { bgcolor: '#fff8e1', borderLeft: '4px solid #ffc107' } // Yellow
    default:
      return { bgcolor: 'background.paper', borderLeft: '4px solid transparent' }
  }
}