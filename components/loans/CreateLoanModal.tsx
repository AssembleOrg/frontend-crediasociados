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
import { 
  Person, 
  AttachMoney, 
  Percent, 
  CalendarToday, 
  Description,
  TrendingUp
} from '@mui/icons-material'
import { useClients } from '@/hooks/useClients'
import { LoanSimulationModal } from './LoanSimulationModal'
import { VisualCalendar } from '@/components/ui/VisualCalendar'
import { useBuenosAiresDate } from '@/hooks/useBuenosAiresDate'


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
    }
  }, [open])

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

    if (!formData.amount || parseFloat(formData.amount) < 0) {
      errors.amount = 'El monto no puede ser menor a 0'
    }

    if (!formData.baseInterestRate || parseFloat(formData.baseInterestRate) < 0) {
      errors.baseInterestRate = 'La tasa de interés base debe ser 0 o mayor'
    }

    // Tasa de penalización temporalmente deshabilitada

    if (!formData.totalPayments || parseInt(formData.totalPayments) < 1) {
      errors.totalPayments = 'El número de pagos debe ser al menos 1'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const calculateSubLoans = (): SubLoan[] => {
    const amount = parseFloat(formData.amount)
    const baseRate = parseFloat(formData.baseInterestRate) / 100 // Convertir porcentaje a decimal
    const totalPayments = parseInt(formData.totalPayments)
    
    if (!amount || !totalPayments || isNaN(baseRate)) {
      return []
    }

    const totalAmountWithInterest = amount * (1 + baseRate)
    const amountPerPayment = totalAmountWithInterest / totalPayments
    
    const subLoans: SubLoan[] = []
    const startDate = formData.firstDueDate || automaticDate
    
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

      subLoans.push({
        paymentNumber: i,
        amount: amount / totalPayments, // Monto principal sin interés
        totalAmount: amountPerPayment, // Monto con interés
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
    
    // Abrir modal de simulación
    setTimeout(() => {
      setSimulationModalOpen(true)
      setIsSimulating(false)
    }, 500) // Pequeño delay para mejor UX
  }

  const handleSimulationModalClose = () => {
    setSimulationModalOpen(false)
    // NO cerrar el modal principal para mantener los datos
  }

  const handleLoanCreated = () => {
    // Solo cerrar cuando se cree exitosamente el préstamo
    setSimulationModalOpen(false)
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
    const amount = parseFloat(formData.amount) || 0
    const interestRate = parseFloat(formData.baseInterestRate) || 0
    return amount * (1 + interestRate / 100)
  }

  const totalAmount = calculateTotalAmount()
  const automaticDate = calculateAutomaticDate()

  // Función para saltar domingos en pagos diarios
  const skipSundays = (date: Date, daysToAdd: number, subLoans: SubLoan[]): Date => {
    let newDate = new Date(date)
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
          Configura los parámetros del préstamo y simula las cuotas
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Client Selection Card */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Selección de Cliente
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl error={!!formErrors.clientId} fullWidth>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    value={formData.clientId}
                    onChange={(e) => handleSelectChange('clientId', e.target.value)}
                    label="Cliente"
                    disabled={clientsLoading}
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.fullName} {client.dni ? `(DNI: ${client.dni})` : ''} {client.cuit ? `(CUIT: ${client.cuit})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.clientId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {formErrors.clientId}
                    </Typography>
                  )}
                </FormControl>

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
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Monto del Préstamo
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    label="Monto del Préstamo"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange('amount')}
                    error={!!formErrors.amount}
                    helperText={formErrors.amount || 'Ingresa el monto a prestar'}
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
                    p: 2, 
                    bgcolor: 'primary.50', 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: 'primary.200'
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                      Resumen del Préstamo
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Monto base:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ${parseFloat(formData.amount || '0').toLocaleString('es-AR')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Interés ({formData.baseInterestRate}%):
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ${(parseFloat(formData.amount || '0') * parseFloat(formData.baseInterestRate || '0') / 100).toLocaleString('es-AR')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'primary.200' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Total a prestar:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ${totalAmount.toLocaleString('es-AR')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Interest Rates Card */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Percent sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Tasas de Interés
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
            </CardContent>
          </Card>

          {/* Payment Schedule Card */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                  
                  {formData.paymentFrequency === 'DAILY' ? (
                    <TextField
                      label="Día de Pago"
                      value="Todos los días"
                      disabled
                      fullWidth
                      helperText="Cobros diarios - No requiere día específico"
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
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Description sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
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

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={handleClose}
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
          onClick={handleSimulate}
          variant="contained"
          disabled={isSimulating}
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