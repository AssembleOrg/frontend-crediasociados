import type { Client, User } from '@/types/auth'

export const ValidationRules = {
  email: /\S+@\S+\.\S+/,
  dni: /^\d+$/,
  cuit: /^\d{11}$/,
  phone: /^[\d\s\-\+\(\)]+$/
} as const

export type ValidationResult = Record<string, string>

export const ValidationMessages = {
  required: 'Este campo es requerido',
  email: 'El email no tiene un formato válido',
  dni: 'El DNI debe contener solo números',
  cuit: 'El CUIT debe tener 11 dígitos',
  phone: 'El teléfono no tiene un formato válido',
  minLength: (min: number) => `Debe tener al menos ${min} caracteres`,
  maxLength: (max: number) => `No puede tener más de ${max} caracteres`
} as const

export class ValidationUtils {
  static validateRequired(value: string, fieldName?: string): string | null {
    if (!value?.trim()) {
      return fieldName ? `${fieldName} es requerido` : ValidationMessages.required
    }
    return null
  }

  static validateEmail(email: string): string | null {
    if (!email) return null // Email is optional in most forms
    if (!ValidationRules.email.test(email)) {
      return ValidationMessages.email
    }
    return null
  }

  static validateDNI(dni: string): string | null {
    if (!dni) return null // DNI is optional
    if (!ValidationRules.dni.test(dni)) {
      return ValidationMessages.dni
    }
    return null
  }

  static validateCUIT(cuit: string): string | null {
    if (!cuit) return null // CUIT is optional
    const cleanCuit = cuit.replace(/-/g, '')
    if (!ValidationRules.cuit.test(cleanCuit)) {
      return ValidationMessages.cuit
    }
    return null
  }

  static validatePhone(phone: string): string | null {
    if (!phone) return null // Phone is optional
    if (!ValidationRules.phone.test(phone)) {
      return ValidationMessages.phone
    }
    return null
  }

  static validateMinLength(value: string, min: number): string | null {
    if (value && value.length < min) {
      return ValidationMessages.minLength(min)
    }
    return null
  }
}

export const ClientValidation = {
  validateCreateClient: (data: Partial<Client>): ValidationResult => {
    const errors: ValidationResult = {}

    const fullNameError = ValidationUtils.validateRequired(data.fullName || '', 'Nombre completo')
    if (fullNameError) errors.fullName = fullNameError

    const emailError = ValidationUtils.validateEmail(data.email || '')
    if (emailError) errors.email = emailError

    const dniError = ValidationUtils.validateDNI(data.dni || '')
    if (dniError) errors.dni = dniError

    const cuitError = ValidationUtils.validateCUIT(data.cuit || '')
    if (cuitError) errors.cuit = cuitError

    const phoneError = ValidationUtils.validatePhone(data.phone || '')
    if (phoneError) errors.phone = phoneError

    return errors
  },

  validateUpdateClient: (data: Partial<Client>): ValidationResult => {
    return ClientValidation.validateCreateClient(data)
  }
}

export const UserValidation = {
  validateCreateUser: (data: Partial<User>): ValidationResult => {
    const errors: ValidationResult = {}

    const fullNameError = ValidationUtils.validateRequired(data.fullName || '', 'Nombre completo')
    if (fullNameError) errors.fullName = fullNameError

    const emailError = ValidationUtils.validateRequired(data.email || '', 'Email')
    if (emailError) {
      errors.email = emailError
    } else {
      const formatError = ValidationUtils.validateEmail(data.email || '')
      if (formatError) errors.email = formatError
    }

    const phoneError = ValidationUtils.validatePhone(data.phone || '')
    if (phoneError) errors.phone = phoneError

    return errors
  },

  validateUpdateUser: (data: Partial<User>): ValidationResult => {
    const errors: ValidationResult = {}

    if (data.fullName !== undefined) {
      const fullNameError = ValidationUtils.validateRequired(data.fullName, 'Nombre completo')
      if (fullNameError) errors.fullName = fullNameError
    }

    if (data.email !== undefined) {
      const emailError = ValidationUtils.validateRequired(data.email, 'Email')
      if (emailError) {
        errors.email = emailError
      } else {
        const formatError = ValidationUtils.validateEmail(data.email)
        if (formatError) errors.email = formatError
      }
    }

    if (data.phone !== undefined) {
      const phoneError = ValidationUtils.validatePhone(data.phone)
      if (phoneError) errors.phone = phoneError
    }

    return errors
  }
}