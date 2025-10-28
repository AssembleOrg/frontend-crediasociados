'use client'

import { useState, ReactNode } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material'

interface BaseFormModalProps<T> {
  open: boolean
  onClose: () => void
  title: string
  initialData?: T
  isLoading?: boolean
  error?: string | null
  onSubmit: (data: T) => Promise<boolean>
  children: ReactNode
}

interface UseFormModalResult<T> {
  formData: T
  formErrors: Record<string, string>
  handleInputChange: (field: keyof T) => (event: React.ChangeEvent<HTMLInputElement>) => void
  validateForm: () => boolean
  setFormData: React.Dispatch<React.SetStateAction<T>>
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  resetForm: () => void
}

export function useFormModal<T extends Record<string, unknown>>(
  initialData: T,
  validationRules?: (data: T) => Record<string, string>
): UseFormModalResult<T> {
  const [formData, setFormData] = useState<T>(initialData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof T) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    
    if (formErrors[field as string]) {
      setFormErrors(prev => ({
        ...prev,
        [field as string]: ''
      }))
    }
  }

  const validateForm = () => {
    if (!validationRules) return true

    const errors = validationRules(formData)
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData(initialData)
    setFormErrors({})
  }

  return {
    formData,
    formErrors,
    handleInputChange,
    validateForm,
    setFormData,
    setFormErrors,
    resetForm
  }
}

export function BaseFormModal<T extends Record<string, unknown>>({
  open,
  onClose,
  title,
  // initialData,
  isLoading = false,
  error,
  onSubmit,
  children
}: BaseFormModalProps<T>) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(formData.entries()) as T

    const success = await onSubmit(data)
    if (success) {
      onClose()
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            {children}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}