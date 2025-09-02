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
