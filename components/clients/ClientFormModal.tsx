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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,

  Card,
  CardContent,
  Divider,
} from '@mui/material'
import { Person, Phone, Email, Home, Work } from '@mui/icons-material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { useClients } from '@/hooks/useClients'
import { ClientValidation } from '@/lib/validation-utils'
import { formatDNI, formatCUIT, unformatDNI, unformatCUIT, formatPhoneNumber, unformatPhoneNumber } from '@/lib/formatters'
import { LATIN_AMERICAN_COUNTRIES } from '@/lib/countries'
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
  job: '',
  countryCode: 'AR' // Default to Argentina
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
      // Extract country code from phone if it exists
      let countryCode = 'AR'
      let phoneNumber = client.phone || ''
      
      if (phoneNumber) {
        const country = LATIN_AMERICAN_COUNTRIES.find(c => 
          phoneNumber.startsWith(c.phoneCode)
        )
        if (country) {
          countryCode = country.code
          phoneNumber = phoneNumber.substring(country.phoneCode.length)
        }
      }

      setFormData({
        fullName: client.fullName || '',
        dni: client.dni ? formatDNI(client.dni) : '',
        cuit: client.cuit ? formatCUIT(client.cuit) : '',
        phone: phoneNumber,
        email: client.email || '',
        address: client.address || '',
        job: client.job || '',
        countryCode
      })
    } else if (mode === 'create') {
      setFormData(INITIAL_FORM_DATA)
    }
  }, [client, mode])

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = event.target.value
    
    // Apply formatting for specific fields
    if (field === 'dni') {
      value = formatDNI(value)
    } else if (field === 'cuit') {
      value = formatCUIT(value)
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleCountryChange = (event: SelectChangeEvent<string>) => {
    setFormData(prev => ({
      ...prev,
      countryCode: event.target.value
    }))
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
    const selectedCountry = LATIN_AMERICAN_COUNTRIES.find(c => c.code === formData.countryCode)
    const fullPhoneNumber = formData.phone && selectedCountry 
      ? formatPhoneNumber(formData.phone, selectedCountry.phoneCode)
      : undefined

    const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
      fullName: formData.fullName,
      dni: formData.dni ? unformatDNI(formData.dni) : undefined,
      cuit: formData.cuit ? unformatCUIT(formData.cuit) : undefined,
      phone: fullPhoneNumber,
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

  const selectedCountry = LATIN_AMERICAN_COUNTRIES.find(c => c.code === formData.countryCode)

  return (
    <Dialog 
      open={open} 
      onClose={() => {}} // Prevent closing on outside click
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
        color: 'white',
        borderRadius: '12px 12px 0 0'
      }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          {mode === 'create' ? 'Completa los datos del nuevo cliente' : 'Modifica la información del cliente'}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 0 }}>
          {error && (
            <Alert severity="error" sx={{ m: 3, mb: 0 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ p: 3 }}>
            {/* Personal Information Card */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Información Personal
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Nombre Completo"
                    value={formData.fullName}
                    onChange={handleInputChange('fullName')}
                    error={!!formErrors.fullName}
                    helperText={formErrors.fullName}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="DNI"
                      value={formData.dni}
                      onChange={handleInputChange('dni')}
                      error={!!formErrors.dni}
                      helperText={formErrors.dni || 'Formato: xx.xxx.xxx'}
                      fullWidth
                      placeholder="12.345.678"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />

                    <TextField
                      label="CUIT"
                      value={formData.cuit}
                      onChange={handleInputChange('cuit')}
                      error={!!formErrors.cuit}
                      helperText={formErrors.cuit || 'Formato: xx-xxxxxxxx-x'}
                      fullWidth
                      placeholder="20-12345678-9"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Contact Information Card */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Información de Contacto
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '200px' } }}>
                      <InputLabel>País</InputLabel>
                      <Select
                        value={formData.countryCode}
                        onChange={handleCountryChange}
                        label="País"
                        sx={{
                          borderRadius: 2,
                        }}
                      >
                        {LATIN_AMERICAN_COUNTRIES.map((country) => (
                          <MenuItem key={country.code} value={country.code}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography sx={{ mr: 1, fontSize: '1.2em' }}>
                                {country.flag}
                              </Typography>
                              <Typography sx={{ mr: 1 }}>
                                {country.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                +{country.phoneCode}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Teléfono"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      error={!!formErrors.phone}
                      helperText={formErrors.phone || `Código de país: +${selectedCountry?.phoneCode}`}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="body2" color="text.secondary">
                              +{selectedCountry?.phoneCode}
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Box>

                  <TextField
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Additional Information Card */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Home sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Información Adicional
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Dirección"
                    value={formData.address}
                    onChange={handleInputChange('address')}
                    error={!!formErrors.address}
                    helperText={formErrors.address}
                    fullWidth
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <Home color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />

                  <TextField
                    label="Trabajo"
                    value={formData.job}
                    onChange={handleInputChange('job')}
                    error={!!formErrors.job}
                    helperText={formErrors.job}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Work color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={handleClose}
            disabled={isLoading}
            variant="outlined"
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 4,
              py: 1.5
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={isLoading}
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #3d8bfe 100%)',
              }
            }}
          >
            {isLoading ? loadingText : submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
