import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import { DateTime } from 'luxon'

export type UrgencyLevel = 'OVERDUE' | 'TODAY' | 'SOON' | 'UPCOMING' | 'overdue' | 'today' | 'soon' | 'future'

export interface UrgencyColors {
  primary: string
  bg: string
  border: string
}

/**
 * Determines urgency level based on due date
 */
export const getUrgencyLevel = (dueDate?: string): 'overdue' | 'today' | 'soon' | 'future' => {
  if (!dueDate) return 'future'

  // Use explicit timezone boundaries to avoid Safari/iOS date drift.
  const timezone = 'America/Argentina/Buenos_Aires'
  const today = DateTime.now().setZone(timezone).startOf('day')
  const due = DateTime.fromISO(dueDate, { setZone: true })
    .setZone(timezone)
    .startOf('day')
  const diffDays = Math.round(due.diff(today, 'days').days)

  if (diffDays < 0) return 'overdue' // Ya vencido
  if (diffDays === 0) return 'today' // Vence hoy
  if (diffDays <= 2) return 'soon' // Vence pronto (1-2 días)
  return 'future' // Futuro (más de 2 días)
}

const normalizeStatus = (status?: string): string => (status || '').trim().toUpperCase()

export const isSubloanSettled = (
  subloan: Pick<SubLoanWithClientInfo, 'status'>
): boolean => {
  const status = normalizeStatus(subloan.status)
  return status === 'PAID' || status === 'COMPLETED' || status === 'CANCELLED'
}

/**
 * Determines urgency for a subloan considering payment status.
 * Paid subloans are never treated as overdue/today/soon.
 */
export const getSubloanUrgencyLevel = (
  subloan: Pick<SubLoanWithClientInfo, 'status' | 'dueDate'>
): 'overdue' | 'today' | 'soon' | 'future' => {
  if (isSubloanSettled(subloan)) return 'future'
  return getUrgencyLevel(subloan.dueDate)
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