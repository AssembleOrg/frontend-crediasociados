// Base types para formularios
export interface BaseFormData {
  [key: string]: string | number | boolean | Date | undefined
}

// Para UserFormModal y otros formularios de usuario
export interface UserFormData extends BaseFormData {
  fullName: string
  email: string
  role: string
  password?: string
}

export interface UserFormCallbacks {
  createUser?: (data: UserFormData) => Promise<{ success: boolean; data?: any; error?: string }>
  updateUser?: (id: string, data: Partial<UserFormData>) => Promise<{ success: boolean; data?: any; error?: string }>
  onSuccess?: (data?: any) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export interface FormModalProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  user?: {
    id: string
    fullName: string
    email: string
    role: string
  }
  callbacks: UserFormCallbacks
}

// Para otros formularios
export interface ClientFormData extends BaseFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  documentNumber?: string
}

export interface LoanFormData extends BaseFormData {
  amount: number
  interestRate: number
  frequency: 'weekly' | 'biweekly' | 'monthly'
  installments: number
  clientId: string
}

// Props base para formularios modales
export interface BaseModalProps {
  open: boolean
  onClose: () => void
  title: string
}

// Props para formularios con validación
export interface FormWithValidationProps<T extends BaseFormData> {
  initialData?: Partial<T>
  onSubmit: (data: T) => Promise<void> | void
  onCancel?: () => void
  validationRules?: {
    [K in keyof T]?: {
      required?: boolean
      minLength?: number
      maxLength?: number
      pattern?: RegExp
      custom?: (value: T[K]) => boolean | string
    }
  }
}

// Estados de formularios
export interface FormState<T extends BaseFormData> {
  data: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  isValid: boolean
}

// Acciones de formulario
export type FormAction<T extends BaseFormData> =
  | { type: 'SET_FIELD'; field: keyof T; value: T[keyof T] }
  | { type: 'SET_ERROR'; field: keyof T; error: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'RESET'; data?: Partial<T> }