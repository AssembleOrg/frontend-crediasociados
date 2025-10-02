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

// Amount formatting with thousands separator and decimal support
// Argentine format: 1.234.567,89 (dots for thousands, comma for decimals)
export const formatAmount = (value: string): string => {
  // Handle empty string
  if (!value) return ''

  // Check if input contains comma (decimal separator)
  const hasDecimal = value.includes(',')

  if (hasDecimal) {
    // Split by comma to separate integer and decimal parts
    const parts = value.split(',')
    const integerPart = parts[0].replace(/\D/g, '') // Remove all non-numeric from integer
    const decimalPart = parts[1] ? parts[1].replace(/\D/g, '').slice(0, 2) : '' // Max 2 decimal places

    // Format integer part with thousands separator
    if (!integerPart) return decimalPart ? `,${decimalPart}` : ''

    const reversed = integerPart.split('').reverse()
    const formatted = []

    for (let i = 0; i < reversed.length; i++) {
      if (i > 0 && i % 3 === 0) {
        formatted.push('.')
      }
      formatted.push(reversed[i])
    }

    const formattedInteger = formatted.reverse().join('')

    // Return formatted with decimal part
    return decimalPart ? `${formattedInteger},${decimalPart}` : `${formattedInteger},`
  } else {
    // No decimal - format as integer only
    const numbers = value.replace(/\D/g, '')

    if (!numbers) return ''

    const reversed = numbers.split('').reverse()
    const formatted = []

    for (let i = 0; i < reversed.length; i++) {
      if (i > 0 && i % 3 === 0) {
        formatted.push('.')
      }
      formatted.push(reversed[i])
    }

    return formatted.reverse().join('')
  }
}

// Remove formatting from amounts and convert to parseFloat-compatible format
// Converts Argentine format (1.234.567,89) to JavaScript format (1234567.89)
export const unformatAmount = (value: string): string => {
  // Remove thousands separators (dots)
  let cleaned = value.replace(/\./g, '')
  // Convert decimal comma to dot for parseFloat
  cleaned = cleaned.replace(/,/g, '.')
  // Remove any other non-numeric characters except dot
  cleaned = cleaned.replace(/[^\d.]/g, '')
  return cleaned
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
