'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material'
import { useClients } from '@/hooks/useClients'
import { ClientValidation } from '@/lib/validation-utils'
import type { Client } from '@/types/auth'

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  client?: Client | null
  mode: 'create' | 'edit'
}

const INITIAL_FORM_DATA = {
  fullName: '',
  dni: '',
  cuit: '',
  phone: '',
  email: '',
  address: '',
  job: ''
}

export function ClientFormModal({ 
  open, 
  onClose, 
  client,
  mode
}: ClientFormModalProps) {
  const { createClient, updateClient, isLoading, error } = useClients()

  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Initialize form data when client changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && client) {
      setFormData({
        fullName: client.fullName || '',
        dni: client.dni || '',
        cuit: client.cuit || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        job: client.job || ''
      })
    } else if (mode === 'create') {
      setFormData(INITIAL_FORM_DATA)
    }
  }, [client, mode])

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = mode === 'create' 
      ? ClientValidation.validateCreateClient(formData)
      : ClientValidation.validateUpdateClient(formData)
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Prepare data for submission
    const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
      fullName: formData.fullName,
      dni: formData.dni || undefined,
      cuit: formData.cuit || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      job: formData.job || undefined,
    }

    let result: boolean

    if (mode === 'create') {
      result = await createClient(clientData)
    } else if (mode === 'edit' && client) {
      result = await updateClient(client.id, clientData)
    } else {
      return
    }

    if (result) {
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA)
    setFormErrors({})
    onClose()
  }

  // Don't render if in edit mode but no client provided
  if (mode === 'edit' && !client) {
    return null
  }

  const title = mode === 'create' ? 'Crear Cliente' : 'Editar Cliente'
  const submitText = mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'
  const loadingText = mode === 'create' ? 'Creando...' : 'Guardando...'

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
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
            <TextField
              label="Nombre Completo"
              value={formData.fullName}
              onChange={handleInputChange('fullName')}
              error={!!formErrors.fullName}
              helperText={formErrors.fullName}
              required
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="DNI"
                value={formData.dni}
                onChange={handleInputChange('dni')}
                error={!!formErrors.dni}
                helperText={formErrors.dni}
                fullWidth
              />

              <TextField
                label="CUIT"
                value={formData.cuit}
                onChange={handleInputChange('cuit')}
                error={!!formErrors.cuit}
                helperText={formErrors.cuit}
                fullWidth
              />
            </Box>

            <TextField
              label="Teléfono"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              fullWidth
            />

            <TextField
              label="Dirección"
              value={formData.address}
              onChange={handleInputChange('address')}
              error={!!formErrors.address}
              helperText={formErrors.address}
              fullWidth
            />

            <TextField
              label="Trabajo"
              value={formData.job}
              onChange={handleInputChange('job')}
              error={!!formErrors.job}
              helperText={formErrors.job}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? loadingText : submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}