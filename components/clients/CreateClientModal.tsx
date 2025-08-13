'use client'

import { useState } from 'react'
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
import type { Client } from '@/types/auth'

interface CreateClientModalProps {
  open: boolean
  onClose: () => void
  title?: string
}

export function CreateClientModal({ 
  open, 
  onClose, 
  title = "Crear Cliente"
}: CreateClientModalProps) {
  const { createClient, isLoading, error } = useClients()

  const [formData, setFormData] = useState({
    fullName: '',
    dni: '',
    cuit: '',
    phone: '',
    email: '',
    address: '',
    job: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      errors.fullName = 'El nombre completo es requerido'
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no tiene un formato válido'
    }

    if (formData.dni && !/^\d+$/.test(formData.dni)) {
      errors.dni = 'El DNI debe contener solo números'
    }

    if (formData.cuit && !/^\d{11}$/.test(formData.cuit.replace(/-/g, ''))) {
      errors.cuit = 'El CUIT debe tener 11 dígitos'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
      fullName: formData.fullName,
      dni: formData.dni || undefined,
      cuit: formData.cuit || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      job: formData.job || undefined,
    }

    const result = await createClient(clientData)

    if (result) {
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      fullName: '',
      dni: '',
      cuit: '',
      phone: '',
      email: '',
      address: '',
      job: ''
    })
    setFormErrors({})
    onClose()
  }

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
            {isLoading ? 'Creando...' : 'Crear Cliente'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}