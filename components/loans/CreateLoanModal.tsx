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
} from '@mui/material'
import {
  Person,
  AttachMoney,
  Percent,
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
  const [livePreview, setLivePreview] = useState<{
    totalAmount: number
    installmentAmount: number
    totalInterest: number
  } | null>(null)

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
    }
  }, [open])

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

    if (!formData.baseInterestRate || parseFloat(formData.baseInterestRate) < 0) {
      errors.baseInterestRate = 'La tasa de interés base debe ser 0 o mayor'
    }

    // Tasa de penalización temporalmente deshabilitada

    if (!formData.totalPayments || parseInt(formData.totalPayments) < 1) {
      errors.totalPayments = 'El número de pagos debe ser al menos 1'
    }

    // Validate wallet balance
    if (wallet && formData.amount) {
      const loanAmount = parseFloat(unformatAmount(formData.amount)) || 0
      if (loanAmount > wallet.balance) {
        errors.amount = `Saldo insuficiente. Disponible: $${wallet.balance.toLocaleString('es-AR')}`
      }
    }

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

  const selectedClient = clients.find(c => c.id === formData.clientId)

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
          Configura los parámetros del préstamo y simula las cuotas
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Client Selection Card */}
          <Card sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
                <Person sx={{ mr: 1, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Selección de Cliente
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option) =>
                    `${option.fullName}${option.dni ? ` (DNI: ${option.dni})` : ''}${option.cuit ? ` (CUIT: ${option.cuit})` : ''}`
                  }
                  value={clients.find(c => c.id === formData.clientId) || null}
                  onChange={(_, newValue) => {
                    handleSelectChange('clientId', newValue?.id || '')
                    if (newValue && formErrors.clientId) {
                      setFormErrors(prev => ({ ...prev, clientId: '' }))
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cliente"
                      placeholder="Buscar cliente por nombre, DNI o CUIT..."
                      error={!!formErrors.clientId}
                      helperText={formErrors.clientId}
                    />
                  )}
                  loading={clientsLoading}
                  disabled={clientsLoading}
                  fullWidth
                  noOptionsText="No se encontraron clientes"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />

                {selectedClient && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Cliente seleccionado: <strong>{selectedClient.fullName}</strong>
                    {selectedClient.phone && ` • Tel: ${selectedClient.phone}`}
                    {selectedClient.email && ` • Email: ${selectedClient.email}`}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Loan Amount Card */}
          <Card sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: { xs: 'flex-start', sm: 'center' }, 
                mb: { xs: 1.5, sm: 2 }, 
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ mr: 1, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Monto del Préstamo
                  </Typography>
                </Box>
                {wallet && (
                  <Box sx={{
                    p: { xs: 0.75, sm: 1 },
                    bgcolor: 'success.lighter',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'success.light'
                  }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'success.main', 
                        fontWeight: 600,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                      }}
                    >
                      Disponible: ${wallet.balance.toLocaleString('es-AR')} {wallet.currency}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    label="Monto del Préstamo"
                    type="text"
                    value={formatAmount(formData.amount || '')}
                    onChange={(e) => {
                      const unformattedValue = unformatAmount(e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        amount: unformattedValue
                      }));
                      // Clear error if exists
                      if (formErrors.amount) {
                        setFormErrors(prev => ({
                          ...prev,
                          amount: ''
                        }));
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
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
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
                    }}
                  />
                  <TextField
                    label="Moneda"
                    value="ARS - Peso Argentino"
                    disabled
                    fullWidth
                    helperText="Solo se manejan préstamos en pesos argentinos"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Box>

                {/* Resumen del cálculo */}
                {formData.amount && formData.baseInterestRate && (
                  <Box sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    bgcolor: 'primary.50', 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: 'primary.200'
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        mb: 1, 
                        color: 'primary.main',
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      Resumen del Préstamo
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
                        Monto base:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                      >
                        ${parseFloat(unformatAmount(formData.amount) || '0').toLocaleString('es-AR')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
                        Interés ({formData.baseInterestRate}%):
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                      >
                        ${(parseFloat(unformatAmount(formData.amount) || '0') * parseFloat(formData.baseInterestRate || '0') / 100).toLocaleString('es-AR')}
                      </Typography>
                    </Box>
                    {formData.totalPayments && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                        >
                          Valor por cuota:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}
                        >
                          ${(totalAmount / parseInt(formData.totalPayments)).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'primary.200' }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600, 
                          color: 'primary.main',
                          fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                      >
                        Total a prestar:
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: 'primary.main',
                          fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                      >
                        ${totalAmount.toLocaleString('es-AR')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Interest Rates Card */}
          <Card sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
                <Percent sx={{ mr: 1, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Tasas de Interés
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, flex: 1, width: { xs: '100%', sm: 'auto' } }}>
                  <TextField
                    label="Tasa de Interés Base"
                    type="number"
                    value={formData.baseInterestRate}
                    onChange={handleInputChange('baseInterestRate')}
                    error={!!formErrors.baseInterestRate}
                    helperText={formErrors.baseInterestRate || 'Porcentaje de interés aplicado al monto total'}
                    required
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                      '& input[type=number]': {
                        MozAppearance: 'textfield',
                      },
                      '& input[type=number]::-webkit-outer-spin-button': {
                        display: 'none',
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        display: 'none',
                      },
                    }}
                  />
                  {/* <Tooltip title='Redondear cuota hacia arriba'>
                    <span>
                      <IconButton
                        size='small'
                        onClick={() => {
                          if (formData.amount && formData.totalPayments && formData.baseInterestRate) {
                            const result = findRoundedInterestRateUp({
                              baseAmount: parseFloat(unformatAmount(formData.amount)),
                              totalPayments: parseInt(formData.totalPayments),
                              currentInterestRate: parseFloat(formData.baseInterestRate),
                            });
                            if (result) {
                              setFormData(prev => ({
                                ...prev,
                                baseInterestRate: result.interestRate.toFixed(2),
                              }));
                            }
                          }
                        }}
                        disabled={!formData.amount || !formData.totalPayments || !formData.baseInterestRate}
                        sx={{
                          bgcolor: 'primary.lighter',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'primary.light',
                            borderColor: 'primary.dark',
                          },
                          '&:disabled': {
                            bgcolor: 'action.disabledBackground',
                            borderColor: 'action.disabled',
                            color: 'action.disabled',
                          },
                        }}
                      >
                        <KeyboardArrowUp />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title='Redondear cuota hacia abajo'>
                    <span>
                      <IconButton
                        size='small'
                        onClick={() => {
                          if (formData.amount && formData.totalPayments && formData.baseInterestRate) {
                            const result = findRoundedInterestRateDown({
                              baseAmount: parseFloat(unformatAmount(formData.amount)),
                              totalPayments: parseInt(formData.totalPayments),
                              currentInterestRate: parseFloat(formData.baseInterestRate),
                            });
                            if (result) {
                              setFormData(prev => ({
                                ...prev,
                                baseInterestRate: result.interestRate.toFixed(2),
                              }));
                            }
                          }
                        }}
                        disabled={!formData.amount || !formData.totalPayments || !formData.baseInterestRate}
                        sx={{
                          bgcolor: 'primary.lighter',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'primary.light',
                            borderColor: 'primary.dark',
                          },
                          '&:disabled': {
                            bgcolor: 'action.disabledBackground',
                            borderColor: 'action.disabled',
                            color: 'action.disabled',
                          },
                        }}
                      >
                        <KeyboardArrowDown />
                      </IconButton>
                    </span>
                  </Tooltip> */}
                </Box>
                <Box sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
                  <TextField
                    label="Tasa de Penalización"
                    type="number"
                    value="0"
                    fullWidth
                    helperText="Se aplicará 0% por defecto"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#666'
                      }
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Schedule Card */}
          <Card sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
                <CalendarToday sx={{ mr: 1, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Cronograma de Pagos
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <FormControl fullWidth>
                    <InputLabel>Frecuencia de Pago</InputLabel>
                    <Select
                      value={formData.paymentFrequency}
                      onChange={(e) => handleSelectChange('paymentFrequency', e.target.value)}
                      label="Frecuencia de Pago"
                      sx={{
                        borderRadius: 2,
                      }}
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
                      helperText={formData.paymentFrequency === 'DAILY' ? "Cobros diarios - No requiere día específico" : "Cobros quincenales - No requiere día específico"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  ) : (
                    <FormControl fullWidth>
                      <InputLabel>Día de Pago</InputLabel>
                      <Select
                        value={formData.paymentDay}
                        onChange={(e) => handleSelectChange('paymentDay', e.target.value)}
                        label="Día de Pago"
                        sx={{
                          borderRadius: 2,
                        }}
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

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    label="Total de Pagos"
                    type="number"
                    value={formData.totalPayments}
                    onChange={handleInputChange('totalPayments')}
                    error={!!formErrors.totalPayments}
                    helperText={formErrors.totalPayments || 'En cuántos pagos se dividirá el préstamo'}
                    required
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
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
                    }}
                  />
                  <VisualCalendar
                    label="Fecha de Primer Pago"
                    value={formData.firstDueDate}
                    onChange={handleDateChange}
                    placeholder="dd/mm/aaaa"
                    helperText={`Opcional - si no se especifica, se usará: ${formatDate(automaticDate)} (calculado según frecuencia de pago)`}
                    minDate={now().toJSDate()}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>


          {/* Description Card */}
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
                <Description sx={{ mr: 1, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Información Adicional
                </Typography>
              </Box>
              
              <TextField
                label="Descripción"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={3}
                fullWidth
                helperText="Descripción del préstamo"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
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
        flexDirection: { xs: 'column', sm: 'row' }
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
            minWidth: { xs: '100%', sm: 'auto' }
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
            px: { xs: 3, sm: 4 },
            py: { xs: 1.25, sm: 1.5 },
            order: { xs: 1, sm: 2 },
            minWidth: { xs: '100%', sm: 'auto' },
            background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #3d8bfe 100%)',
            }
          }}
        >
          {isSimulating ? 'Simulando...' : 'Simular Préstamo'}
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
