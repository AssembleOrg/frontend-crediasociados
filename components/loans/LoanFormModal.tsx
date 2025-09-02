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
} from '@mui/material'
import { useClients } from '@/hooks/useClients'
import { useLoans } from '@/hooks/useLoans'
import { CustomCalendar } from '@/components/ui/CustomCalendar'
import { useBuenosAiresDate } from '@/hooks/useBuenosAiresDate'
import type { components } from '@/types/api-generated'

type CreateLoanDto = components['schemas']['CreateLoanDto']
// TODO: Define UpdateLoanDto type when backend supports loan updates
// type UpdateLoanDto = components['schemas']['UpdateLoanDto']

interface LoanFormModalProps {
  open: boolean
  onClose: () => void
  loan?: unknown // TODO: Add proper Loan type when available
  mode: 'create' | 'edit'
}

const INITIAL_FORM_DATA = {
  clientId: '',
  amount: '',
  baseInterestRate: '10',
  penaltyInterestRate: '20',
  currency: 'ARS' as 'ARS' | 'USD',
  paymentFrequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
  numberOfInstallments: '4',
  startDate: new Date().toISOString().split('T')[0]
}

const PAYMENT_FREQUENCIES = [
  { value: 'DAILY', label: 'Diario' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quincenal' },
  { value: 'MONTHLY', label: 'Mensual' }
]

const CURRENCIES = [
  { value: 'ARS', label: 'Pesos Argentinos (ARS)' },
  { value: 'USD', label: 'Dólares (USD)' }
]

export function LoanFormModal({ 
  open, 
  onClose, 
  loan,
  mode
}: LoanFormModalProps) {
  const { clients, isLoading: clientsLoading } = useClients()
  const { createLoan, isLoading, error } = useLoans()
  const { now } = useBuenosAiresDate()
  // TODO: Implement updateLoan in useLoans hook
  // const { updateLoan } = useLoans()

  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Initialize form data when loan changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && loan) {
      const loanData = loan as Record<string, unknown>; // TODO: Fix with proper Loan type
      setFormData({
        clientId: (loanData.clientId as string) || '',
        amount: (loanData.amount as number)?.toString() || '',
        baseInterestRate: (loanData.baseInterestRate as number)?.toString() || '10',
        penaltyInterestRate: (loanData.penaltyInterestRate as number)?.toString() || '20',
        currency: (loanData.currency as 'ARS' | 'USD') || 'ARS',
        paymentFrequency: (loanData.paymentFrequency as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY') || 'WEEKLY',
        numberOfInstallments: (loanData.numberOfInstallments as number)?.toString() || '4',
        startDate: loanData.startDate ? new Date(loanData.startDate as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      })
    } else if (mode === 'create') {
      setFormData(INITIAL_FORM_DATA)
    }
  }, [loan, mode])

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

  const handleSelectChange = (field: keyof typeof formData) => (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any
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

    if (!formData.clientId) {
      errors.clientId = 'Debe seleccionar un cliente'
    }

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'El monto debe ser un número mayor a 0'
    }

    if (!formData.baseInterestRate || isNaN(Number(formData.baseInterestRate)) || Number(formData.baseInterestRate) < 0) {
      errors.baseInterestRate = 'La tasa de interés debe ser un número mayor o igual a 0'
    }

    if (!formData.penaltyInterestRate || isNaN(Number(formData.penaltyInterestRate)) || Number(formData.penaltyInterestRate) < 0) {
      errors.penaltyInterestRate = 'La tasa de mora debe ser un número mayor o igual a 0'
    }

    if (!formData.numberOfInstallments || isNaN(Number(formData.numberOfInstallments)) || Number(formData.numberOfInstallments) <= 0) {
      errors.numberOfInstallments = 'El número de cuotas debe ser mayor a 0'
    }

    if (!formData.startDate) {
      errors.startDate = 'La fecha de inicio es requerida'
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
    const loanData = {
      clientId: formData.clientId,
      amount: Number(formData.amount),
      baseInterestRate: Number(formData.baseInterestRate),
      penaltyInterestRate: Number(formData.penaltyInterestRate),
      currency: formData.currency as 'ARS' | 'USD',
      paymentFrequency: formData.paymentFrequency,
      numberOfInstallments: Number(formData.numberOfInstallments),
      totalPayments: Number(formData.numberOfInstallments), // Required field
      startDate: new Date(formData.startDate).toISOString(),
    }

    let result: boolean

    if (mode === 'create') {
      const createdLoan = await createLoan(loanData as CreateLoanDto)
      result = !!createdLoan
    } else if (mode === 'edit' && loan) {
      // TODO: Implement updateLoan functionality
      console.warn('Update loan functionality not implemented yet')
      result = false
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

  // Don't render if in edit mode but no loan provided
  if (mode === 'edit' && !loan) {
    return null
  }

  const title = mode === 'create' ? 'Crear Nuevo Préstamo' : 'Editar Préstamo'
  const submitText = mode === 'create' ? 'Crear Préstamo' : 'Guardar Cambios'
  const loadingText = mode === 'create' ? 'Creando...' : 'Guardando...'

  const selectedClient = clients.find(client => client.id === formData.clientId)

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
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
            {/* Cliente Selection */}
            <FormControl fullWidth error={!!formErrors.clientId}>
              <InputLabel>Cliente *</InputLabel>
              <Select
                value={formData.clientId}
                onChange={handleSelectChange('clientId')}
                label="Cliente *"
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.fullName} {client.dni && `(DNI: ${client.dni})`}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.clientId && (
                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                  {formErrors.clientId}
                </Typography>
              )}
            </FormControl>

            {/* Amount and Currency */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
              <TextField
                label="Monto del Préstamo"
                value={formData.amount}
                onChange={handleInputChange('amount')}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                required
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Moneda</InputLabel>
                <Select
                  value={formData.currency}
                  onChange={handleSelectChange('currency')}
                  label="Moneda"
                >
                  {CURRENCIES.map((currency) => (
                    <MenuItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Interest Rates */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Tasa de Interés Base"
                value={formData.baseInterestRate}
                onChange={handleInputChange('baseInterestRate')}
                error={!!formErrors.baseInterestRate}
                helperText={formErrors.baseInterestRate}
                required
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                fullWidth
              />

              <TextField
                label="Tasa de Mora"
                value={formData.penaltyInterestRate}
                onChange={handleInputChange('penaltyInterestRate')}
                error={!!formErrors.penaltyInterestRate}
                helperText={formErrors.penaltyInterestRate}
                required
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                fullWidth
              />
            </Box>

            {/* Payment Frequency and Installments */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Frecuencia de Pago</InputLabel>
                <Select
                  value={formData.paymentFrequency}
                  onChange={handleSelectChange('paymentFrequency')}
                  label="Frecuencia de Pago"
                >
                  {PAYMENT_FREQUENCIES.map((freq) => (
                    <MenuItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Número de Cuotas"
                value={formData.numberOfInstallments}
                onChange={handleInputChange('numberOfInstallments')}
                error={!!formErrors.numberOfInstallments}
                helperText={formErrors.numberOfInstallments}
                required
                type="number"
                fullWidth
              />
            </Box>

            {/* Start Date */}
            <CustomCalendar
              label="Fecha de Inicio"
              value={formData.startDate ? new Date(formData.startDate) : null}
              onChange={(date) => setFormData(prev => ({
                ...prev,
                startDate: date ? date.toISOString().split('T')[0] : ''
              }))}
              placeholder="dd/mm/aaaa"
              error={!!formErrors.startDate}
              helperText={formErrors.startDate}
              minDate={now().toJSDate()}
            />

            {/* Selected Client Info */}
            {selectedClient && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cliente Seleccionado:
                </Typography>
                <Typography variant="body2">
                  <strong>{selectedClient.fullName}</strong>
                </Typography>
                {selectedClient.dni && (
                  <Typography variant="body2">
                    DNI: {selectedClient.dni}
                  </Typography>
                )}
                {selectedClient.phone && (
                  <Typography variant="body2">
                    Teléfono: {selectedClient.phone}
                  </Typography>
                )}
              </Box>
            )}
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
            disabled={isLoading || clientsLoading}
          >
            {isLoading ? loadingText : submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}