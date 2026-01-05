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
  Autocomplete,
  CircularProgress,
} from '@mui/material'
import {
  AttachMoney,
  CalendarToday,
  Description,
} from '@mui/icons-material'
import { useClients } from '@/hooks/useClients'
import { useWallet } from '@/hooks/useWallet'
import { LoanSimulationModal } from './LoanSimulationModal'
import { VisualCalendar } from '@/components/ui/VisualCalendar'
import { useBuenosAiresDate } from '@/hooks/useBuenosAiresDate'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import { ValidationUtils } from '@/lib/validation-utils'
import { clientsService } from '@/services/clients.service'
import { apiClientToClient } from '@/types/transforms'
import type { Client } from '@/types/auth'


interface CreateLoanModalProps {
  open: boolean
  onClose: () => void
  title?: string
}

interface SubLoan {
  paymentNumber: number
  amount: number
  totalAmount: number
  dueDate: Date
}

export function CreateLoanModal({
  open,
  onClose,
  title = "Crear Nuevo Préstamo"
}: CreateLoanModalProps) {
  const { clients, isLoading: clientsLoading } = useClients()
  const { now, addDays, addMonths, formatDate } = useBuenosAiresDate()
  const { wallet } = useWallet()

  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    baseInterestRate: '',
    penaltyInterestRate: '',
    currency: 'ARS' as const,
    paymentFrequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    paymentDay: 'FRIDAY' as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY',
    totalPayments: '',
    firstDueDate: null as Date | null,
    description: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [simulatedLoans, setSimulatedLoans] = useState<SubLoan[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationModalOpen, setSimulationModalOpen] = useState(false)
  const [_livePreview, setLivePreview] = useState<{
    totalAmount: number
    installmentAmount: number
    totalInterest: number
  } | null>(null)

  // Client search states
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Reset form cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setFormData({
        clientId: '',
        amount: '',
        baseInterestRate: '',
        penaltyInterestRate: '',
        currency: 'ARS' as const,
        paymentFrequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
        paymentDay: 'FRIDAY' as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY',
        totalPayments: '',
        firstDueDate: null,
        description: ''
      })
      setFormErrors({})
      setSimulatedLoans([])
      setSimulationModalOpen(false)
      setLivePreview(null)
      setSearchInput('')
      setSearchResults([])
      setSelectedClient(null)
    }
  }, [open])

  // Search clients after 2 characters
  // Only search if user is actively typing (not when selecting from dropdown)
  useEffect(() => {
    const searchClients = async () => {
      // Don't search if input is too short or if a client is already selected and input matches the selected client
      if (searchInput.length < 2) {
        setSearchResults([])
        return
      }

      // If a client is selected and the input matches the selected client's label, don't search
      if (selectedClient) {
        const selectedLabel = [
          selectedClient.fullName,
          selectedClient.dni ? `DNI: ${selectedClient.dni}` : null,
          selectedClient.cuit ? `CUIT: ${selectedClient.cuit}` : null
        ].filter(Boolean).join(' • ')
        
        if (searchInput === selectedLabel) {
          // User selected a client, don't search again
          return
        }
      }

      setIsSearching(true)
      try {
        // Search by DNI, CUIT, or name (partial match)
        // Backend now supports name parameter for partial matching
        const results = await clientsService.searchByDniOrCuit(searchInput, searchInput, searchInput)
        
        if (results && results.length > 0) {
          // Convert ClientResponseDto[] to Client[]
          const clientsConverted = results.map(apiClientToClient)
          setSearchResults(clientsConverted)
        } else {
          // No results found
          setSearchResults([])
        }
      } catch (error) {
        // Error searching clients - fallback to local filtering
        const filtered = clients.filter(client =>
          client.fullName.toLowerCase().includes(searchInput.toLowerCase()) ||
          client.dni?.includes(searchInput) ||
          client.cuit?.includes(searchInput)
        )
        setSearchResults(filtered)
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(searchClients, 300)
    return () => clearTimeout(timeoutId)
  }, [searchInput, clients, selectedClient])

  // Live preview calculation - updates as user types
  useEffect(() => {
    if (open && formData.amount && formData.baseInterestRate && formData.totalPayments) {
      try {
        const amountValue = parseFloat(unformatAmount(formData.amount))
        const interestRate = parseFloat(formData.baseInterestRate) / 100
        const payments = parseInt(formData.totalPayments)

        if (amountValue > 0 && interestRate >= 0 && payments > 0) {
          const totalInterest = amountValue * interestRate
          const totalAmount = amountValue + totalInterest
          const installmentAmount = totalAmount / payments

          setLivePreview({
            totalAmount,
            installmentAmount,
            totalInterest
          })
        } else {
          setLivePreview(null)
        }
      } catch {
        setLivePreview(null)
      }
    } else {
      setLivePreview(null)
    }
  }, [open, formData.amount, formData.baseInterestRate, formData.totalPayments])

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = event.target.value
    
    // Apply formatting for amount field
    if (field === 'amount') {
      value = formatAmount(value)
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSelectChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      firstDueDate: date
    }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.clientId) {
      errors.clientId = 'Debe seleccionar un cliente'
    }

    // Validate amount with proper validation
    const amountError = ValidationUtils.validateRequired(formData.amount, 'Monto del préstamo') ||
                        ValidationUtils.validateAmount(formData.amount, 1000, 100000000) // Min $1000, Max $100M
    if (amountError) {
      errors.amount = amountError
    }

    if (formData.baseInterestRate === undefined || formData.baseInterestRate === null || formData.baseInterestRate === '' || isNaN(parseFloat(formData.baseInterestRate)) || parseFloat(formData.baseInterestRate) < 0) {
      errors.baseInterestRate = 'La tasa de interés base debe ser 0 o mayor'
    }

    // Tasa de penalización temporalmente deshabilitada

    if (!formData.totalPayments || parseInt(formData.totalPayments) < 1) {
      errors.totalPayments = 'El número de pagos debe ser al menos 1'
    }

    // ✅ RESTRICCIÓN REMOVIDA: Las wallets pueden ser negativas sin límite
    // Las validaciones de saldo se manejan en el backend si es necesario
    // if (wallet && formData.amount) {
    //   const loanAmount = parseFloat(unformatAmount(formData.amount)) || 0
    //   if (loanAmount > wallet.balance) {
    //     errors.amount = `Saldo insuficiente. Disponible: $${wallet.balance.toLocaleString('es-AR')}`
    //   }
    // }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const calculateSubLoans = (): SubLoan[] => {
    const amount = parseFloat(unformatAmount(formData.amount))
    const baseRate = parseFloat(formData.baseInterestRate) / 100 // Convertir porcentaje a decimal
    const totalPayments = parseInt(formData.totalPayments)

    if (!amount || !totalPayments || isNaN(baseRate)) {
      return []
    }

    const totalAmountWithInterest = amount * (1 + baseRate)
    const amountPerPayment = totalAmountWithInterest / totalPayments
    const principalPerPayment = amount / totalPayments

    const subLoans: SubLoan[] = []
    const startDate = formData.firstDueDate || automaticDate

    // Track accumulated amounts for precision correction
    let accumulatedTotal = 0
    let accumulatedPrincipal = 0

    for (let i = 1; i <= totalPayments; i++) {
      let dueDate: Date

      // Calcular fecha según frecuencia
      switch (formData.paymentFrequency) {
        case 'DAILY':
          // Para pagos diarios, saltar domingos
          dueDate = skipSundays(startDate, i - 1, subLoans)
          break
        case 'WEEKLY':
          dueDate = new Date(startDate)
          dueDate.setDate(startDate.getDate() + ((i - 1) * 7))
          break
        case 'BIWEEKLY':
          dueDate = new Date(startDate)
          dueDate.setDate(startDate.getDate() + ((i - 1) * 14))
          break
        case 'MONTHLY':
          dueDate = new Date(startDate)
          dueDate.setMonth(startDate.getMonth() + (i - 1))
          break
        default:
          dueDate = new Date(startDate)
      }

      // For the last payment, calculate remainder to avoid floating-point accumulation errors
      let paymentTotal: number
      let paymentPrincipal: number

      if (i === totalPayments) {
        // Last payment = remaining amount to ensure exact total
        paymentTotal = totalAmountWithInterest - accumulatedTotal
        paymentPrincipal = amount - accumulatedPrincipal
      } else {
        // Regular payment
        paymentTotal = Math.round(amountPerPayment * 100) / 100 // Round to 2 decimals
        paymentPrincipal = Math.round(principalPerPayment * 100) / 100
        accumulatedTotal += paymentTotal
        accumulatedPrincipal += paymentPrincipal
      }

      subLoans.push({
        paymentNumber: i,
        amount: paymentPrincipal, // Monto principal sin interés
        totalAmount: paymentTotal, // Monto con interés
        dueDate
      })
    }

    return subLoans
  }

  const handleSimulate = () => {
    if (!validateForm()) {
      return
    }

    setIsSimulating(true)
    const calculated = calculateSubLoans()
    setSimulatedLoans(calculated)
    setSimulationModalOpen(true)
    setIsSimulating(false)
  }

  const handleSimulationModalClose = () => {
    setSimulationModalOpen(false)
    // NO cerrar el modal principal para mantener los datos
  }

  const handleLoanCreated = () => {
    // Close the parent CreateLoanModal to show only the success modal
    onClose()
  }

  const handleClose = () => {
    setSimulatedLoans([])
    onClose()
  }

  // Calcular fecha automática basada en frecuencia de pago
  const calculateAutomaticDate = (): Date => {
    const today = now()
    const todayDay = today.weekday // 1 = lunes, 7 = domingo
    
    switch (formData.paymentFrequency) {
      case 'DAILY':
        // Si es diario, empezar mañana (excepto si mañana es domingo, entonces lunes)
        const tomorrow = addDays(today.toJSDate(), 1)
        const tomorrowDay = now().plus({ days: 1 }).weekday
        if (tomorrowDay === 7) { // Si mañana es domingo
          return addDays(today.toJSDate(), 2) // Lunes
        }
        return tomorrow
        
      case 'WEEKLY':
        // Si es semanal, próximo día de la semana correspondiente
        const targetDay = formData.paymentDay === 'MONDAY' ? 1 :
                         formData.paymentDay === 'TUESDAY' ? 2 :
                         formData.paymentDay === 'WEDNESDAY' ? 3 :
                         formData.paymentDay === 'THURSDAY' ? 4 :
                         formData.paymentDay === 'FRIDAY' ? 5 :
                         formData.paymentDay === 'SATURDAY' ? 6 : 1
        
        // Si el día objetivo es hoy, usar el próximo (7 días después)
        // Si no, calcular días hasta el próximo día objetivo
        const daysUntilTarget = targetDay === todayDay ? 
          7 : // Si es el mismo día, usar la próxima semana
          targetDay > todayDay ? 
            targetDay - todayDay : // Si es más adelante en la semana
            7 - todayDay + targetDay // Si es en la próxima semana
        
        return addDays(today.toJSDate(), daysUntilTarget)
        
      case 'BIWEEKLY':
        // Si es quincenal, cada 14 días desde hoy
        return addDays(today.toJSDate(), 14)
        
      case 'MONTHLY':
        // Si es mensual, mismo día del próximo mes
        return addMonths(today.toJSDate(), 1)
        
      default:
        return today.toJSDate()
    }
  }

  // Calcular total a prestar (monto + interés)
  const calculateTotalAmount = (): number => {
    const amount = parseFloat(unformatAmount(formData.amount)) || 0
    const interestRate = parseFloat(formData.baseInterestRate) || 0
    return amount * (1 + interestRate / 100)
  }

  const totalAmount = calculateTotalAmount()
  const automaticDate = calculateAutomaticDate()

  // Función para saltar domingos en pagos diarios
  const skipSundays = (date: Date, daysToAdd: number, subLoans: SubLoan[]): Date => {
    const newDate = new Date(date)
    newDate.setDate(date.getDate() + daysToAdd)
    
    // Verificar si es domingo y saltar al lunes
    while (newDate.getDay() === 0) {
      newDate.setDate(newDate.getDate() + 1)
    }
    
    // Verificar si ya existe una fecha igual en los subpréstamos anteriores
    while (subLoans.some(loan => 
      loan.dueDate.getTime() === newDate.getTime()
    )) {
      newDate.setDate(newDate.getDate() + 1)
      // Si al avanzar un día cae en domingo, saltar al lunes
      while (newDate.getDay() === 0) {
        newDate.setDate(newDate.getDate() + 1)
      }
    }
    
    return newDate
  }

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent closing on outside click
      maxWidth="lg"
      fullWidth
      fullScreen={false}
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          m: { xs: 0, sm: 2 },
          mt: { xs: 0, sm: 3 },
          maxHeight: { xs: '100vh', sm: '95vh' },
          width: { xs: '100%', sm: 'auto' },
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: { xs: 1.5, sm: 1 },
        pt: { xs: 2, sm: 2 },
        px: { xs: 2, sm: 3 },
        background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
        color: 'white',
        borderRadius: { xs: 0, sm: '12px 12px 0 0' }
      }}>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            fontWeight: 600,
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            opacity: 0.9, 
            mt: 0.5,
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          Genera un nuevo préstamo con cronograma de pagos
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Single Unified Card with Blue Gradient Background */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 },
          background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
        }}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            overflow: 'visible'
          }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              {/* Client Selection with Search */}
              <Box sx={{ mb: 3 }}>
                <Autocomplete
                  fullWidth
                  options={searchInput.length >= 2 ? searchResults.filter(c => c.verified !== false) : clients.filter(c => c.verified !== false)}
                  getOptionLabel={(option) => {
                    const parts = [option.fullName]
                    if (option.dni) parts.push(`DNI: ${option.dni}`)
                    if (option.cuit) parts.push(`CUIT: ${option.cuit}`)
                    return parts.join(' • ')
                  }}
                  value={selectedClient}
                  onChange={(_, newValue) => {
                    if (newValue && newValue.verified === false) {
                      setFormErrors(prev => ({ ...prev, clientId: 'No se puede seleccionar un cliente no verificado' }))
                      return
                    }
                    setSelectedClient(newValue)
                    handleSelectChange('clientId', newValue?.id || '')
                    // When selecting a client, update searchInput to match the label to prevent re-search
                    if (newValue) {
                      const label = [
                        newValue.fullName,
                        newValue.dni ? `DNI: ${newValue.dni}` : null,
                        newValue.cuit ? `CUIT: ${newValue.cuit}` : null
                      ].filter(Boolean).join(' • ')
                      setSearchInput(label)
                    } else {
                      setSearchInput('')
                    }
                  }}
                  inputValue={searchInput}
                  onInputChange={(_, newInputValue, reason) => {
                    // Only update searchInput if user is typing (not when selecting)
                    // Reason can be: 'input', 'clear', 'reset', 'blur'
                    if (reason === 'input' || reason === 'clear') {
                      setSearchInput(newInputValue)
                      // If clearing, also clear selected client
                      if (reason === 'clear') {
                        setSelectedClient(null)
                        handleSelectChange('clientId', '')
                      }
                    }
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  loading={isSearching}
                  loadingText="Buscando..."
                  noOptionsText={searchInput.length < 2 ? "Escribe al menos 2 caracteres" : "No se encontraron clientes verificados"}
                    disabled={clientsLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cliente *"
                      error={!!formErrors.clientId}
                      helperText={formErrors.clientId || "Busca por nombre, DNI o CUIT (solo clientes verificados)"}
                    sx={{
                        '& .MuiOutlinedInput-root': { 
                      borderRadius: 2,
                          bgcolor: 'grey.50' 
                        } 
                      }}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {option.fullName}
                    </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.dni && `DNI: ${option.dni}`}
                          {option.dni && option.cuit && ' • '}
                          {option.cuit && `CUIT: ${option.cuit}`}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />

                {selectedClient && (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                    <strong>{selectedClient.fullName}</strong>
                    {selectedClient.phone && ` • ${selectedClient.phone}`}
                    {selectedClient.email && ` • ${selectedClient.email}`}
                  </Alert>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Loan Amount and Interest - Compact Layout */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                  mb: 2, 
                      fontWeight: 600,
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'primary.main'
                    }}
                  >
                <AttachMoney /> Monto del Préstamo
                {/* {wallet && (
                  <Box sx={{
                    ml: 'auto',
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'success.lighter',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'success.light'
                  }}>
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                      Disponible: ${wallet.balance.toLocaleString('es-AR')}
                    </Typography>
                  </Box>
                )} */}
              </Typography>

              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, 
                gap: 2, 
                mb: 3 
              }}>
                  <TextField
                    label="Monto del Préstamo"
                    type="text"
                    value={formatAmount(formData.amount || '')}
                    onChange={(e) => {
                      const unformattedValue = unformatAmount(e.target.value);
                    setFormData(prev => ({ ...prev, amount: unformattedValue }));
                      if (formErrors.amount) {
                      setFormErrors(prev => ({ ...prev, amount: '' }));
                      }
                    }}
                    error={!!formErrors.amount}
                    helperText={formErrors.amount || 'Ingresa el monto a prestar (ej: 1.000.000)'}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' },
                    }}
                  />

                  <TextField
                  label="Tasa de Interés Base"
                  type="number"
                  value={formData.baseInterestRate}
                  onChange={handleInputChange('baseInterestRate')}
                  error={!!formErrors.baseInterestRate}
                  helperText={formErrors.baseInterestRate || 'Ej: 12'}
                  required
                    fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                    sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' },
                    '& input[type=number]': { MozAppearance: 'textfield' },
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { display: 'none' },
                    }}
                  />
                </Box>

              {/* Summary Preview - Inline */}
                {formData.amount && formData.baseInterestRate && (
                  <Box sx={{ 
                  p: 2, 
                  mb: 3,
                    bgcolor: 'primary.50', 
                    borderRadius: 2, 
                  border: '2px solid',
                    borderColor: 'primary.200'
                  }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
                      Resumen del Préstamo
                    </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 120 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Monto base:
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        ${parseFloat(unformatAmount(formData.amount) || '0').toLocaleString('es-AR')}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 120 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Interés ({formData.baseInterestRate}%):
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="warning.main">
                        ${(parseFloat(unformatAmount(formData.amount) || '0') * parseFloat(formData.baseInterestRate || '0') / 100).toLocaleString('es-AR')}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 120, textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="caption" color="primary.main" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                        Total a prestar:
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        ${totalAmount.toLocaleString('es-AR')}
                      </Typography>
                    </Box>
                  </Box>
                  {formData.totalPayments && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'primary.200' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Valor por cuota:
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="success.main">
                        ${(totalAmount / parseInt(formData.totalPayments)).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
                  )}
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Payment Schedule - Compact */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                  mb: 2, 
                    fontWeight: 600,
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'primary.main'
                  }}
                >
                <CalendarToday /> Cronograma de Pagos
                </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                  gap: 2 
                }}>
                  <FormControl fullWidth>
                    <InputLabel>Frecuencia de Pago</InputLabel>
                    <Select
                      value={formData.paymentFrequency}
                      onChange={(e) => handleSelectChange('paymentFrequency', e.target.value)}
                      label="Frecuencia de Pago"
                      sx={{ borderRadius: 2, bgcolor: 'grey.50' }}
                    >
                      <MenuItem value="DAILY">Diario</MenuItem>
                      <MenuItem value="WEEKLY">Semanal</MenuItem>
                      <MenuItem value="BIWEEKLY">Quincenal</MenuItem>
                      <MenuItem value="MONTHLY">Mensual</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {formData.paymentFrequency === 'DAILY' || formData.paymentFrequency === 'BIWEEKLY' ? (
                    <TextField
                      label="Día de Pago"
                      value={formData.paymentFrequency === 'DAILY' ? "Todos los días" : "Sin día específico"}
                      disabled
                      fullWidth
                      helperText={formData.paymentFrequency === 'DAILY' ? "Cobros diarios" : "Cobros quincenales"}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  ) : (
                    <FormControl fullWidth>
                      <InputLabel>Día de Pago</InputLabel>
                      <Select
                        value={formData.paymentDay}
                        onChange={(e) => handleSelectChange('paymentDay', e.target.value)}
                        label="Día de Pago"
                        sx={{ borderRadius: 2, bgcolor: 'grey.50' }}
                      >
                        <MenuItem value="MONDAY">Lunes</MenuItem>
                        <MenuItem value="TUESDAY">Martes</MenuItem>
                        <MenuItem value="WEDNESDAY">Miércoles</MenuItem>
                        <MenuItem value="THURSDAY">Jueves</MenuItem>
                        <MenuItem value="FRIDAY">Viernes</MenuItem>
                        <MenuItem value="SATURDAY">Sábado</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Box>

                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, 
                  gap: 2 
                }}>
                  <TextField
                    label="Total de Pagos"
                    type="number"
                    value={formData.totalPayments}
                    onChange={handleInputChange('totalPayments')}
                    error={!!formErrors.totalPayments}
                    helperText={formErrors.totalPayments || 'N° de cuotas'}
                    required
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' },
                      '& input[type=number]': { MozAppearance: 'textfield' },
                      '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { display: 'none' },
                    }}
                  />
                  <VisualCalendar
                    label="Fecha de Primer Pago"
                    value={formData.firstDueDate}
                    onChange={handleDateChange}
                    placeholder="dd/mm/aaaa"
                    helperText={`Opcional - Por defecto: ${formatDate(automaticDate)}`}
                    minDate={now().toJSDate()}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Additional Information - Compact */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                  mb: 2, 
                    fontWeight: 600,
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'primary.main'
                  }}
                >
                <Description /> Información Adicional
                </Typography>
              
              <TextField
                label="Descripción"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={2}
                fullWidth
                placeholder="Agrega notas o detalles sobre el préstamo (opcional)"
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' }
                }}
              />
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ 
        p: { xs: 2, sm: 3 }, 
        gap: { xs: 1.5, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' },
        background: 'linear-gradient(135deg, #667eea08 0%, #4facfe08 100%)',
      }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          size="large"
          fullWidth
          sx={{ 
            borderRadius: 2,
            px: { xs: 3, sm: 4 },
            py: { xs: 1.25, sm: 1.5 },
            order: { xs: 2, sm: 1 },
            minWidth: { xs: '100%', sm: 'auto' },
            borderColor: 'grey.300',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'grey.400',
              bgcolor: 'grey.50'
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSimulate}
          variant="contained"
          disabled={isSimulating}
          size="large"
          fullWidth
          sx={{ 
            borderRadius: 2,
            px: { xs: 4, sm: 6 },
            py: { xs: 1.25, sm: 1.5 },
            order: { xs: 1, sm: 2 },
            minWidth: { xs: '100%', sm: 'auto' },
            background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            fontSize: '1rem',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #3d8bfe 100%)',
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
            }
          }}
        >
          {isSimulating ? 'Simulando...' : '📊 Simular Préstamo'}
        </Button>
      </DialogActions>

      {/* Modal de Simulación */}
      <LoanSimulationModal
        open={simulationModalOpen}
        onClose={handleSimulationModalClose}
        onLoanCreated={handleLoanCreated}
        simulatedLoans={simulatedLoans}
        formData={formData}
        clientName={selectedClient?.fullName}
      />
    </Dialog>
  )
}
