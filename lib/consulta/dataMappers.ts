import type { LoanTrackingResponseDto } from '@/types/auth'

interface LocalLoanDetails {
  id: string
  loanTrack: string
  amount: number
  baseInterestRate: number
  penaltyInterestRate: number
  paymentFrequency: string
  totalPayments: number
  remainingPayments: number
  nextDueDate: string
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE'
  client: {
    fullName: string
    dni: string
  }
  subLoans: Array<{
    paymentNumber: number
    amount: number
    dueDate: string
    status: 'PENDING' | 'PAID' | 'OVERDUE'
    paidDate?: string
  }>
}

export const mapLoanTrackingResponse = (
  apiData: LoanTrackingResponseDto
): LocalLoanDetails => {
  // Use subLoans directly from the tracking response (no separate lookup needed)
  // Note: The API types show subLoans as string[] but it actually contains subloan objects
  const apiSubLoans = Array.isArray(apiData.subLoans) ? (apiData.subLoans as unknown as Array<Record<string, unknown>>) : []
  const mappedSubLoans = apiSubLoans.map((subloan: Record<string, unknown>) => ({
    paymentNumber: (subloan.paymentNumber as number) || 0,
    amount: (subloan.amount as number) || 0,
    dueDate: (subloan.dueDate as string) || '',
    status: mapSubLoanStatus(subloan.status as string),
    paidDate: subloan.paidDate ? new Date(subloan.paidDate as string).toISOString() : undefined
  }))

  // Calculate real values from actual subLoans data
  const remainingPayments = mappedSubLoans.filter(s => s.status !== 'PAID').length

  // Find next due date from pending subLoans
  const pendingSubLoans = mappedSubLoans.filter(s => s.status === 'PENDING' || s.status === 'OVERDUE')
  const nextDueDate = pendingSubLoans.length > 0
    ? pendingSubLoans.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].dueDate
    : apiData.firstDueDate || new Date().toISOString()

  // Determine loan status based on real subLoans
  const hasOverdue = mappedSubLoans.some(s => s.status === 'OVERDUE')
  const allPaid = mappedSubLoans.length > 0 && mappedSubLoans.every(s => s.status === 'PAID')
  const loanStatus = allPaid ? 'COMPLETED' : hasOverdue ? 'OVERDUE' : 'ACTIVE'

  return {
    id: apiData.id || '',
    loanTrack: apiData.loanTrack || '',
    amount: apiData.amount || 0,
    baseInterestRate: 0.25, // Will be available when backend provides it
    penaltyInterestRate: 0.05, // Will be available when backend provides it
    paymentFrequency: apiData.paymentFrequency || 'WEEKLY',
    totalPayments: apiData.totalPayments || 0,
    remainingPayments,
    nextDueDate,
    status: loanStatus,
    client: {
      fullName: extractClientProperty(apiData.client, 'fullName'),
      dni: extractClientProperty(apiData.client, 'dni')
    },
    subLoans: mappedSubLoans
  }
}

// Helper function to safely extract client properties
const extractClientProperty = (client: unknown, property: string): string => {
  if (client && typeof client === 'object' && property in client) {
    return (client as Record<string, string>)[property] || ''
  }
  return ''
}

// Map SubLoan status from backend to local types
const mapSubLoanStatus = (status: string | undefined): 'PENDING' | 'PAID' | 'OVERDUE' => {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'PAID'
    case 'OVERDUE':
      return 'OVERDUE'
    case 'PENDING':
    default:
      return 'PENDING'
  }
}

// All mock data generation functions removed
// Now using only real backend data directly from /loans/tracking endpoint