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
import { useUsers } from '@/hooks/useUsers'
import type { UserRole } from '@/types/auth'
import { getRoleDisplayName } from '@/types/transforms'

interface CreateUserModalProps {
  open: boolean
  onClose: () => void
  targetRole: UserRole
  title?: string
}

// Role is fixed by targetRole prop - no selection needed

export function CreateUserModal({ 
  open, 
  onClose, 
  targetRole,
  title = 'Crear Usuario'
}: CreateUserModalProps) {
  const { createUser, isLoading, error } = useUsers()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dni: '',
    cuit: '',
    role: targetRole as UserRole
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

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no tiene un formato válido'
    }

    if (!formData.password.trim()) {
      errors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
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

    const userData = {
      ...formData,
      phone: formData.phone || undefined,
      dni: formData.dni || undefined,
      cuit: formData.cuit || undefined,
    }

    const result = await createUser(userData)

    if (result) {
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      dni: '',
      cuit: '',
      role: targetRole
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
          {title} - {getRoleDisplayName(targetRole)}
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

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
              fullWidth
            />

            <TextField
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!formErrors.password}
              helperText={formErrors.password}
              required
              fullWidth
            />

            <TextField
              label="Rol"
              value={getRoleDisplayName(formData.role)}
              disabled
              fullWidth
              helperText="El rol está determinado por su nivel de acceso"
            />

            <TextField
              label="Teléfono"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="DNI"
                value={formData.dni}
                onChange={handleInputChange('dni')}
                error={!!formErrors.dni}
                helperText={formErrors.dni || 'Campo no disponible en esta versión'}
                disabled
                fullWidth
              />

              <TextField
                label="CUIT"
                value={formData.cuit}
                onChange={handleInputChange('cuit')}
                error={!!formErrors.cuit}
                helperText={formErrors.cuit || 'Campo no disponible en esta versión'}
                disabled
                fullWidth
              />
            </Box>
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
            {isLoading ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}