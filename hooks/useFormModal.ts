import { useState, useCallback } from 'react'

export interface UseFormModalResult<T> {
  formData: T
  formErrors: Record<string, string>
  isFormValid: boolean
  handleInputChange: (field: keyof T) => (event: React.ChangeEvent<HTMLInputElement>) => void
  handleSelectChange: (field: keyof T) => (event: any) => void
  setFormData: React.Dispatch<React.SetStateAction<T>>
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  validateForm: (validationFn?: (data: T) => Record<string, string>) => boolean
  resetForm: (initialData?: T) => void
  updateFormField: (field: keyof T, value: any) => void
}

export function useFormModal<T extends Record<string, any>>(
  initialData: T
): UseFormModalResult<T> {
  const [formData, setFormData] = useState<T>(initialData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleInputChange = useCallback((field: keyof T) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear field error when user starts typing
    if (formErrors[field as string]) {
      setFormErrors(prev => ({
        ...prev,
        [field as string]: ''
      }))
    }
  }, [formErrors])

  const handleSelectChange = useCallback((field: keyof T) => (
    event: any
  ) => {
    const value = event.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (formErrors[field as string]) {
      setFormErrors(prev => ({
        ...prev,
        [field as string]: ''
      }))
    }
  }, [formErrors])

  const validateForm = useCallback((
    validationFn?: (data: T) => Record<string, string>
  ) => {
    if (!validationFn) return true

    const errors = validationFn(formData)
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  const resetForm = useCallback((newInitialData?: T) => {
    setFormData(newInitialData || initialData)
    setFormErrors({})
  }, [initialData])

  const updateFormField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const isFormValid = Object.keys(formErrors).length === 0

  return {
    formData,
    formErrors,
    isFormValid,
    handleInputChange,
    handleSelectChange,
    setFormData,
    setFormErrors,
    validateForm,
    resetForm,
    updateFormField
  }
}