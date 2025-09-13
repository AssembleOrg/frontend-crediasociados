/**
 * Utility functions for formatting form inputs
 */

// DNI formatting: xx.xxx.xxx or x.xxx.xxx
export const formatDNI = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Apply formatting based on length
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, -3)}.${numbers.slice(-3)}`
  } else {
    return `${numbers.slice(0, -6)}.${numbers.slice(-6, -3)}.${numbers.slice(-3)}`
  }
}

// CUIT formatting: xx-xxxxxxxx-x or xx-xxxxxxx-x
export const formatCUIT = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Apply formatting based on length
  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
  } else {
    return `${numbers.slice(0, 2)}-${numbers.slice(2, -1)}-${numbers.slice(-1)}`
  }
}

// Phone number formatting with country code
export const formatPhoneNumber = (value: string, countryCode: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // If the number already starts with the country code, don't add it again
  if (numbers.startsWith(countryCode)) {
    return numbers
  }
  
  // Add country code if not present
  return `${countryCode}${numbers}`
}

// Remove formatting from values
export const unformatDNI = (value: string): string => {
  return value.replace(/\D/g, '')
}

export const unformatCUIT = (value: string): string => {
  return value.replace(/\D/g, '')
}

export const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '')
}

// Amount formatting with thousands separator: 1000000 -> 1.000.000
export const formatAmount = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Handle empty string
  if (!numbers) return ''
  
  // Apply thousands separator using reverse and manual placement
  // More reliable than complex regex for large numbers
  const reversed = numbers.split('').reverse()
  const formatted = []
  
  for (let i = 0; i < reversed.length; i++) {
    // Add dot every 3 digits (except at the beginning)
    if (i > 0 && i % 3 === 0) {
      formatted.push('.')
    }
    formatted.push(reversed[i])
  }
  
  return formatted.reverse().join('')
}

// Remove formatting from amounts
export const unformatAmount = (value: string): string => {
  return value.replace(/\D/g, '')
}

// Payment frequency localization - Centralizes all frequency translations
export const getFrequencyLabel = (frequency: string): string => {
  const labels: Record<string, string> = {
    'DAILY': 'Diario',
    'WEEKLY': 'Semanal', 
    'BIWEEKLY': 'Quincenal',
    'MONTHLY': 'Mensual'
  }
  
  return labels[frequency] || frequency
}

// Loan status localization - Centralizes all status translations
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'ACTIVE': 'Activo',
    'PENDING': 'Pendiente',
    'APPROVED': 'Aprobado',
    'COMPLETED': 'Completado',
    'DEFAULTED': 'En mora',
    'CANCELLED': 'Cancelado',
    'REJECTED': 'Rechazado',
    'OVERDUE': 'Vencido'
  }
  
  return labels[status] || status
}

// SubLoan payment status localization - For individual payment statuses
export const getPaymentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'PAID': 'Pagado',
    'PENDING': 'Pendiente',
    'OVERDUE': 'Vencido'
  }
  
  return labels[status] || status
}

// Interest rate formatting - Centralizes rate formatting logic
export const formatInterestRate = (rate: number | undefined): number => {
  if (!rate || rate <= 0) return 0;
  
  // Handle edge cases where rate might be already multiplied incorrectly
  // If rate is way too high (>100), it's likely been converted multiple times
  if (rate > 100) {
    // Try to find the original rate by dividing by 100 until reasonable
    let normalizedRate = rate;
    while (normalizedRate > 100) {
      normalizedRate = normalizedRate / 100;
    }
    return normalizedRate;
  }
  
  // If rate is already a reasonable percentage (1-100), use as-is
  // If it's a decimal (< 1), convert to percentage
  return rate >= 1 ? rate : rate * 100;
}
