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
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Chip,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  PeopleAlt,
  CheckCircle,
  Warning,
} from '@mui/icons-material'
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
  role: 'manager' as UserRole,
  clientQuota: '50',  // ← String to allow empty input
  commission: ''  // Commission percentage for managers
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
  const [showPassword, setShowPassword] = useState(false)

  // Initialize form data when user changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        password: '', // Never pre-fill password for security
        phone: user.phone || '',
        role: user.role as UserRole,
        clientQuota: user.clientQuota ? user.clientQuota.toString() : '50',
        commission: user.commission !== undefined && user.commission !== null ? user.commission.toString() : ''
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
    // Convert formData to match User type for validation
    const dataToValidate = {
      ...formData,
      clientQuota: parseInt(formData.clientQuota) || 0,
      commission: formData.commission ? parseFloat(formData.commission) : undefined
    }
    
    const errors = mode === 'create' 
      ? UserValidation.validateCreateUser(dataToValidate)
      : UserValidation.validateUpdateUser(dataToValidate)

    // Additional password validation for create mode
    if (mode === 'create' && !formData.password?.trim()) {
      errors.password = 'La contraseña es requerida'
    } else if (mode === 'create' && formData.password && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    // Validate commission for MANAGER
    if ((mode === 'create' && targetRole === 'manager') || (mode === 'edit' && formData.role === 'manager')) {
      const commissionValue = parseFloat(formData.commission)
      if (!formData.commission || isNaN(commissionValue)) {
        errors.commission = 'La comisión es requerida para cobradores'
      } else if (commissionValue < 0 || commissionValue > 100) {
        errors.commission = 'La comisión debe estar entre 0 y 100%'
      }
    }

    // Validate clientQuota for SUBADMIN or MANAGER creation
    if (mode === 'create' && (targetRole === 'subadmin' || targetRole === 'manager')) {
      const quotaValue = parseInt(formData.clientQuota) || 0
      if (quotaValue <= 0) {
        errors.clientQuota = 'La cuota de clientes debe ser mayor a 0'
      } else if (creatorAvailableQuota !== undefined && creatorAvailableQuota > 0 && quotaValue > creatorAvailableQuota) {
        errors.clientQuota = `Solo tienes ${creatorAvailableQuota} clientes disponibles para asignar`
      }
    }
    
    // Validate clientQuota for SUBADMIN or MANAGER edit
    if (mode === 'edit' && user && (formData.role === 'subadmin' || formData.role === 'manager' || formData.role === 'prestamista')) {
      const usedQuota = user.usedClientQuota ?? 0
      const currentQuota = user.clientQuota ?? 0
      const quotaValue = parseInt(formData.clientQuota) || 0
      
      // Check if reducing below used quota
      if (quotaValue < usedQuota) {
        errors.clientQuota = `No puedes reducir la cuota por debajo de ${usedQuota} (clientes actualmente usados)`
      } 
      // Check if increasing beyond creator's available quota
      else if (creatorAvailableQuota !== undefined && quotaValue > currentQuota) {
        const increaseAmount = quotaValue - currentQuota
        if (increaseAmount > creatorAvailableQuota) {
          errors.clientQuota = `Solo puedes aumentar hasta ${currentQuota + creatorAvailableQuota} (tienes ${creatorAvailableQuota} disponibles)`
        }
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
      role: formData.role,
      clientQuota: (targetRole === 'subadmin' || targetRole === 'manager' || formData.role === 'subadmin' || formData.role === 'manager' || formData.role === 'prestamista') 
        ? (parseInt(formData.clientQuota) || 0) 
        : undefined,
      commission: (targetRole === 'manager' || formData.role === 'manager')
        ? (parseFloat(formData.commission) || 0)
        : undefined
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
    setShowPassword(false)
    onClose()
  }

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Calculate quota percentage and remaining
  const quotaPercentage = creatorTotalQuota && creatorTotalQuota > 0
    ? ((creatorTotalQuota - (creatorAvailableQuota || 0)) / creatorTotalQuota) * 100
    : 0
  const quotaUsed = (creatorTotalQuota || 0) - (creatorAvailableQuota || 0)

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
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          m: { xs: 0.5, sm: 2 },
          mt: { xs: 2, sm: 3 },
          maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
          width: { xs: '100%', sm: 'auto' },
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 3 },
          background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
          color: 'white',
          borderRadius: { xs: 0, sm: '12px 12px 0 0' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Title Section */}
          <Box>
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontWeight: 600, 
                mb: 0.5,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.9,
                fontSize: { xs: '0.875rem', sm: '0.875rem' }
              }}
            >
              {mode === 'create' 
                ? `Completa los datos del nuevo ${RoleUtils.getRoleDisplayName(targetRole).toLowerCase()}` 
                : 'Modifica la información del usuario'}
            </Typography>
          </Box>

          {/* Quota Display - Show in create mode or edit mode for users with quota */}
          {creatorAvailableQuota !== undefined && creatorTotalQuota !== undefined && 
           (mode === 'create' || (mode === 'edit' && user && (user.role === 'subadmin' || user.role === 'prestamista'))) && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 2,
                width: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleAlt sx={{ fontSize: { xs: 18, sm: 20 }, color: 'primary.main' }} />
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', sm: '0.75rem' }
                  }}
                >
                  Cuota de Clientes
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    color: creatorAvailableQuota > 0 ? 'success.main' : 'error.main',
                    fontSize: { xs: '1.75rem', sm: '2rem' }
                  }}
                >
                  {creatorAvailableQuota}
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  / {creatorTotalQuota} disponibles
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={quotaPercentage} 
                sx={{ 
                  height: { xs: 8, sm: 6 }, 
                  borderRadius: 1,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: quotaPercentage > 80 ? 'error.main' : quotaPercentage > 50 ? 'warning.main' : 'success.main',
                    borderRadius: 1,
                  }
                }} 
              />
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  mt: 0.5, 
                  display: 'block',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              >
                {quotaUsed} asignados
              </Typography>
            </Paper>
          )}
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: { xs: 2, sm: 2.5 } }}>
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
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!formErrors.password}
              helperText={formErrors.password || (mode === 'create' ? 'Mínimo 6 caracteres' : undefined)}
              required={mode === 'create'}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      aria-label="toggle password visibility"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Teléfono"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              fullWidth
            />

            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                gap: 2 
              }}
            >
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

            {/* Commission Field - Only for Managers */}
            {(mode === 'create' && targetRole === 'manager') || (mode === 'edit' && formData.role === 'manager') ? (
              <TextField
                label="Comisión (%)"
                type="number"
                value={formData.commission}
                onChange={handleInputChange('commission')}
                error={!!formErrors.commission}
                helperText={formErrors.commission || 'Porcentaje de comisión para el cobrador (requerido, ej: 10 para 10%)'}
                required
                fullWidth
                InputProps={{
                  inputProps: { 
                    min: 0,
                    max: 100,
                    step: 0.01
                  }
                }}
              />
            ) : null}

            {/* Client Quota Field */}
            {(mode === 'create' && (targetRole === 'subadmin' || targetRole === 'manager')) || (mode === 'edit' && (formData.role === 'subadmin' || formData.role === 'manager' || formData.role === 'prestamista')) ? (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  bgcolor: 'primary.lighter',
                  border: '2px solid',
                  borderColor: 'primary.light',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PeopleAlt sx={{ fontSize: { xs: 20, sm: 24 }, color: 'primary.main' }} />
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      color: 'primary.main',
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                  >
                    Cuota de Clientes para este {targetRole === 'subadmin' ? 'Asociado' : 'Cobrador'}
                  </Typography>
                </Box>

                {creatorAvailableQuota !== undefined && creatorTotalQuota !== undefined && (
                  <Alert
                    severity={mode === 'create' ? (creatorAvailableQuota > 0 ? 'success' : 'warning') : 'info'}
                    icon={mode === 'create' ? (creatorAvailableQuota > 0 ? <CheckCircle /> : <Warning />) : <PeopleAlt />}
                    sx={{ 
                      mb: 2,
                      '& .MuiAlert-message': {
                        width: '100%'
                      }
                    }}
                  >
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          fontSize: { xs: '0.85rem', sm: '0.875rem' }
                        }}
                      >
                        {mode === 'create' 
                          ? (creatorAvailableQuota > 0 
                              ? `Tienes ${creatorAvailableQuota} clientes disponibles para asignar` 
                              : '⚠️ No tienes clientes disponibles para asignar')
                          : `Cuota disponible del creador para asignar`
                        }
                      </Typography>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: { xs: 1, sm: 2 }, 
                          mt: 1,
                          flexWrap: 'wrap'
                        }}
                      >
                        <Chip 
                          label={`${quotaUsed} usados`} 
                          size="small" 
                          color="default" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.7rem', sm: '0.8125rem' }
                          }}
                        />
                        <Chip 
                          label={`${creatorAvailableQuota} disponibles`} 
                          size="small" 
                          color={creatorAvailableQuota > 0 ? 'success' : 'error'}
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.7rem', sm: '0.8125rem' }
                          }}
                        />
                        <Chip 
                          label={`${creatorTotalQuota} total`} 
                          size="small" 
                          color="primary" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.7rem', sm: '0.8125rem' }
                          }}
                        />
                      </Box>
                      {mode === 'edit' && user && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Cuota actual del usuario:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={`${user.usedClientQuota ?? 0} usados`} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                            <Chip 
                              label={`${user.clientQuota ?? 0} asignados`} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Alert>
                )}

                <TextField
                  label="Número de Clientes a Asignar"
                  type="number"
                  value={formData.clientQuota}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    setFormData(prev => ({
                      ...prev,
                      clientQuota: inputValue
                    }))
                    if (formErrors.clientQuota) {
                      setFormErrors(prev => ({
                        ...prev,
                        clientQuota: ''
                      }))
                    }
                  }}
                  error={!!formErrors.clientQuota}
                  helperText={
                    formErrors.clientQuota || 
                    (mode === 'edit' && user
                      ? `Mínimo: ${user.usedClientQuota ?? 0} (usados) | Máximo: ${(user.clientQuota ?? 0) + (creatorAvailableQuota || 0)} (actual + disponibles)`
                      : (targetRole === 'subadmin' 
                          ? "Este asociado podrá distribuir esta cantidad de clientes entre sus cobradores" 
                          : "Este cobrador podrá crear hasta esta cantidad de clientes")
                    )
                  }
                  fullWidth
                  InputProps={{
                    inputProps: { 
                      min: mode === 'edit' && user ? (user.usedClientQuota ?? 0) : 1,
                      max: mode === 'edit' && user 
                        ? (user.clientQuota ?? 0) + (creatorAvailableQuota || 0)
                        : (creatorAvailableQuota || undefined),
                    },
                    sx: {
                      bgcolor: 'white',
                      '& input[type=number]': {
                        MozAppearance: 'textfield',
                      },
                      '& input[type=number]::-webkit-outer-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                    }
                  }}
                />
              </Paper>
            ) : null}
          </Box>
        </DialogContent>

        <DialogActions 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            gap: { xs: 1.5, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            '& > button': {
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 120 },
            }
          }}
        >
          <Button 
            onClick={handleClose}
            disabled={isLoading}
            variant="outlined"
            size="large"
            fullWidth={false}
            sx={{
              order: { xs: 2, sm: 1 },
              py: { xs: 1.5, sm: 1 },
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={isLoading || (mode === 'create' && creatorAvailableQuota === 0)}
            size="large"
            fullWidth={false}
            sx={{
              order: { xs: 1, sm: 2 },
              py: { xs: 1.5, sm: 1 },
              background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #3d8bfe 100%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            {isLoading ? loadingText : submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}