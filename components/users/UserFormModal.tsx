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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { UserValidation } from '@/lib/validation-utils'
import { RoleUtils, type UserRole, ROLE_DISPLAY_NAMES } from '@/lib/role-utils'
import type { User } from '@/types/auth'
import type { SelectChangeEvent } from '@mui/material/Select'

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user?: User | null
  mode: 'create' | 'edit'
  targetRole?: UserRole // For create mode
  allowRoleChange?: boolean // For edit mode
  creatorAvailableQuota?: number // Available quota from creator (Subadmin)
  creatorTotalQuota?: number // Total quota from creator
  // Functions passed from parent to avoid duplicate useUsers hooks
  createUser?: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }) => Promise<boolean>
  updateUser?: (id: string, userData: Partial<User> & { password?: string }) => Promise<boolean>
  isLoading?: boolean
  error?: string | null
}

const INITIAL_FORM_DATA = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  dni: '',
  cuit: '',
  role: 'manager' as UserRole,
  clientQuota: 50  // ← NUEVO: Default 50 clientes
}

export function UserFormModal({
  open,
  onClose,
  user,
  mode,
  targetRole = 'manager',
  allowRoleChange = false,
  creatorAvailableQuota,
  creatorTotalQuota,
  createUser,
  updateUser,
  isLoading = false,
  error = null
}: UserFormModalProps) {

  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Initialize form data when user changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        password: '', // Never pre-fill password for security
        phone: user.phone || '',
        dni: user.dni || '',
        cuit: user.cuit || '',
        role: user.role as UserRole,
        clientQuota: user.clientQuota || 50  // ← NUEVO: Read from user
      })
    } else if (mode === 'create') {
      setFormData({
        ...INITIAL_FORM_DATA,
        role: targetRole
      })
    }
  }, [user, mode, targetRole])

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

  const handleRoleChange = (event: SelectChangeEvent) => {
    setFormData(prev => ({
      ...prev,
      role: event.target.value as UserRole
    }))
    
    if (formErrors.role) {
      setFormErrors(prev => ({
        ...prev,
        role: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = mode === 'create' 
      ? UserValidation.validateCreateUser(formData)
      : UserValidation.validateUpdateUser(formData)

    // Additional password validation for create mode
    if (mode === 'create' && !formData.password?.trim()) {
      errors.password = 'La contraseña es requerida'
    } else if (mode === 'create' && formData.password && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    // Validate clientQuota for SUBADMIN or MANAGER creation
    if (mode === 'create' && (targetRole === 'subadmin' || targetRole === 'manager')) {
      if (formData.clientQuota <= 0) {
        errors.clientQuota = 'La cuota de clientes debe ser mayor a 0'
      } else if (creatorAvailableQuota !== undefined && creatorAvailableQuota > 0 && formData.clientQuota > creatorAvailableQuota) {
        errors.clientQuota = `Solo tienes ${creatorAvailableQuota} clientes disponibles para asignar`
      }
    }
    
    // Validate clientQuota for SUBADMIN or MANAGER edit
    if (mode === 'edit' && user && (formData.role === 'subadmin' || formData.role === 'manager')) {
      const usedQuota = user.usedClientQuota ?? 0
      if (formData.clientQuota < usedQuota) {
        errors.clientQuota = `No puedes reducir la cuota por debajo de ${usedQuota} (clientes actualmente usados)`
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Prepare data for submission
    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { clientQuota?: number } = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || undefined,
      dni: formData.dni || undefined,
      cuit: formData.cuit || undefined,
      role: formData.role,
      clientQuota: (targetRole === 'subadmin' || targetRole === 'manager' || formData.role === 'subadmin' || formData.role === 'manager') ? formData.clientQuota : undefined
    }

    let result: boolean

    if (mode === 'create') {
      // For create mode, password is required
      const createData = { ...userData, password: formData.password }
      result = await createUser?.(createData) ?? false
    } else if (mode === 'edit' && user) {
      // For edit mode, password is optional
      const updateData = formData.password
        ? { ...userData, password: formData.password }
        : userData
      result = await updateUser?.(user.id, updateData) ?? false
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

  // Don't render if in edit mode but no user provided
  if (mode === 'edit' && !user) {
    return null
  }

  const title = mode === 'create' 
    ? `Crear ${RoleUtils.getRoleDisplayName(targetRole)}` 
    : `Editar Usuario`
  const submitText = mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'
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

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!formErrors.email}
              helperText={mode === 'edit' ? 'El email no puede ser modificado' : formErrors.email}
              required
              fullWidth
              disabled={mode === 'edit'}
            />

            <TextField
              label={mode === 'create' ? 'Contraseña' : 'Nueva Contraseña (dejar vacío para no cambiar)'}
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!formErrors.password}
              helperText={formErrors.password}
              required={mode === 'create'}
              fullWidth
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

            {(mode === 'create' || allowRoleChange) && (
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  onChange={handleRoleChange}
                  label="Rol"
                >
                  {(mode === 'create' ? [targetRole] : Object.keys(ROLE_DISPLAY_NAMES)).map((role) => (
                    <MenuItem key={role} value={role}>
                      {RoleUtils.getRoleDisplayName(role as UserRole)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Client Quota Field */}
            {(mode === 'create' && (targetRole === 'subadmin' || targetRole === 'manager')) || (mode === 'edit' && (formData.role === 'subadmin' || formData.role === 'manager')) ? (
              <>
                {mode === 'create' && (creatorAvailableQuota !== undefined) && (
                  <Alert
                    severity={creatorAvailableQuota > 0 ? 'info' : 'warning'}
                    sx={{ mb: 2, fontWeight: 'bold' }}
                  >
                    👥 <strong>Clientes Disponibles para Asignar:</strong> {creatorAvailableQuota} de {creatorTotalQuota}
                  </Alert>
                )}
                <TextField
                  label="Cuota de Clientes"
                  type="number"
                  value={formData.clientQuota}
                  onChange={(e) => {
                    const value = Math.max(1, parseInt(e.target.value) || 50)
                    setFormData(prev => ({
                      ...prev,
                      clientQuota: value
                    }))
                    // Clear error if exists
                    if (formErrors.clientQuota) {
                      setFormErrors(prev => ({
                        ...prev,
                        clientQuota: ''
                      }))
                    }
                  }}
                  error={!!formErrors.clientQuota}
                  helperText={formErrors.clientQuota || (targetRole === 'subadmin' ? "Número máximo de clientes que puede distribuir este asociado" : "Número máximo de clientes que puede crear este cobrador")}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 1, max: creatorAvailableQuota && creatorAvailableQuota > 0 ? creatorAvailableQuota : 500 }
                  }}
                />
              </>
            ) : null}
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