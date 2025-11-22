import type { Loan } from '@/types/auth'

/**
 * Calculate the interest rate as a percentage for display
 */
export const calculateInterestRatePercentage = (loan: Loan): number => {
  if (!loan.baseInterestRate || loan.baseInterestRate <= 0) {
    return 0
  }
  
  // If rate is already a percentage (> 1), return as is
  // If rate is a decimal (< 1), convert to percentage
  return loan.baseInterestRate > 1 ? loan.baseInterestRate : loan.baseInterestRate * 100
}

/**
 * Calculate the interest rate as a decimal for calculations
 */
export const calculateInterestRateDecimal = (loan: Loan): number => {
  if (!loan.baseInterestRate || loan.baseInterestRate <= 0) {
    return 0
  }
  
  // If rate is a percentage (> 1), convert to decimal
  // If rate is already a decimal (< 1), return as is
  return loan.baseInterestRate > 1 ? loan.baseInterestRate / 100 : loan.baseInterestRate
}

/**
 * Calculate the total amount to be repaid (principal + interest)
 * If originalAmount is available, amount is already the total to repay
 * Otherwise, calculate it from the original amount and interest rate
 */
export const calculateTotalRepaymentAmount = (loan: Loan): number => {
  // If originalAmount exists, then amount is already the total to repay (with interest)
  if (loan.originalAmount !== undefined) {
    return loan.amount
  }
  // Otherwise, calculate from original amount and interest rate
  const rate = calculateInterestRateDecimal(loan)
  return loan.amount * (1 + rate)
}

/**
 * Calculate the interest amount only
 * If originalAmount is available, calculate as: amount - originalAmount
 * Otherwise, calculate from amount and interest rate
 */
export const calculateInterestAmount = (loan: Loan): number => {
  // If originalAmount exists, calculate interest as the difference
  if (loan.originalAmount !== undefined) {
    return loan.amount - loan.originalAmount
  }
  // Otherwise, calculate from amount and interest rate
  const rate = calculateInterestRateDecimal(loan)
  return loan.amount * rate
}

/**
 * Calculate monthly payment amount (total / number of payments)
 */
export const calculateMonthlyPayment = (loan: Loan): number => {
  if (!loan.totalPayments || loan.totalPayments <= 0) {
    return calculateTotalRepaymentAmount(loan)
  }
  
  return calculateTotalRepaymentAmount(loan) / loan.totalPayments
}

/**
 * Format interest rate for display with percentage sign
 */
export const formatInterestRate = (loan: Loan): string => {
  const rate = calculateInterestRatePercentage(loan)
  return `${rate.toFixed(1)}%`
}

/**
 * Get loan status display information
 */
export const getLoanStatusInfo = (status: string) => {
  const statusMap = {
    'PENDING': { label: 'Pendiente', color: 'warning' as const },
    'APPROVED': { label: 'Aprobado', color: 'success' as const },
    'ACTIVE': { label: 'Activo', color: 'primary' as const },
    'COMPLETED': { label: 'Completado', color: 'success' as const },
    'CANCELLED': { label: 'Cancelado', color: 'error' as const },
    'OVERDUE': { label: 'Vencido', color: 'error' as const }
  }
  
  return statusMap[status as keyof typeof statusMap] || { label: status, color: 'default' as const }
}

/**
 * Calculate loan statistics from array of loans
 */
export const calculateLoanStats = (loans: Loan[]) => {
  const total = loans.length
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0)
  const avgAmount = total > 0 ? totalAmount / total : 0
  
  const byStatus = {
    active: loans.filter(loan => loan.status === 'ACTIVE' || loan.status === 'APPROVED').length,
    completed: loans.filter(loan => loan.status === 'COMPLETED').length,
    pending: loans.filter(loan => loan.status === 'PENDING').length,
    approved: loans.filter(loan => loan.status === 'APPROVED').length,
    cancelled: loans.filter(loan => loan.status === 'REJECTED' || loan.status === 'DEFAULTED').length,
    overdue: loans.filter(loan => loan.status === 'DEFAULTED').length
  }

  return {
    total,
    totalAmount,
    avgAmount,
    byStatus
  }
}