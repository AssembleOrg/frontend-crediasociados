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
  InputAdornment
} from '@mui/material'
import { useClients } from '@/hooks/useClients'
import type { components } from '@/types/api-generated'

type CreateLoanDto = components['schemas']['CreateLoanDto']

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

  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    baseInterestRate: '',
    penaltyInterestRate: '',
    currency: 'ARS' as const,
    paymentFrequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    paymentDay: 'FRIDAY' as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY',
    totalPayments: '',
    firstDueDate: null as Date | null,
    loanTrack: '',
    description: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [simulatedLoans, setSimulatedLoans] = useState<SubLoan[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

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
        paymentDay: 'FRIDAY' as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY',
        totalPayments: '',
        firstDueDate: null,
        loanTrack: '',
        description: ''
      })
      setFormErrors({})
      setSimulatedLoans([])
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

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value ? new Date(event.target.value) : null
    setFormData(prev => ({
      ...prev,
      firstDueDate: dateValue
    }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.clientId) {
      errors.clientId = 'Debe seleccionar un cliente'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'El monto debe ser mayor a 0'
    }

    if (!formData.baseInterestRate || parseFloat(formData.baseInterestRate) < 0) {
      errors.baseInterestRate = 'La tasa de interés base debe ser 0 o mayor'
    }

    if (!formData.penaltyInterestRate || parseFloat(formData.penaltyInterestRate) < 0) {
      errors.penaltyInterestRate = 'La tasa de interés penalización debe ser 0 o mayor'
    }

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
    const startDate = formData.firstDueDate || new Date()
    
    for (let i = 1; i <= totalPayments; i++) {
      const dueDate = new Date(startDate)
      
      // Calcular fecha según frecuencia
      switch (formData.paymentFrequency) {
        case 'DAILY':
          dueDate.setDate(startDate.getDate() + (i - 1))
          break
        case 'WEEKLY':
          dueDate.setDate(startDate.getDate() + ((i - 1) * 7))
          break
        case 'BIWEEKLY':
          dueDate.setDate(startDate.getDate() + ((i - 1) * 14))
          break
        case 'MONTHLY':
          dueDate.setMonth(startDate.getMonth() + (i - 1))
          break
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
    
    // Console log para debug
    console.log('=== SIMULACIÓN DE PRÉSTAMO ===')
    console.log('Cliente:', clients.find(c => c.id === formData.clientId)?.fullName)
    console.log('Monto principal:', formData.amount)
    console.log('Tasa de interés base:', formData.baseInterestRate + '%')
    console.log('Tasa de penalización:', formData.penaltyInterestRate + '%')
    console.log('Frecuencia de pago:', formData.paymentFrequency)
    console.log('Total de pagos:', formData.totalPayments)
    console.log('Monto total con interés:', (parseFloat(formData.amount) * (1 + parseFloat(formData.baseInterestRate) / 100)).toFixed(2))
    console.log('Sub-préstamos calculados:')
    calculated.forEach((loan) => {
      console.log(`  Pago ${loan.paymentNumber}: $${loan.totalAmount.toFixed(2)} (Principal: $${loan.amount.toFixed(2)}) - Vence: ${loan.dueDate.toLocaleDateString()}`)
    })
    console.log('================================')
    
    setIsSimulating(false)
  }

  const handleConfirm = () => {
    if (!validateForm()) {
      return
    }

    // TODO: Implementar creación real del préstamo
    const createLoanData: CreateLoanDto = {
      clientId: formData.clientId,
      amount: parseFloat(formData.amount),
      baseInterestRate: parseFloat(formData.baseInterestRate) / 100, // API espera decimal
      penaltyInterestRate: parseFloat(formData.penaltyInterestRate) / 100,
      currency: formData.currency,
      paymentFrequency: formData.paymentFrequency,
      paymentDay: formData.paymentDay,
      totalPayments: parseInt(formData.totalPayments),
      firstDueDate: formData.firstDueDate?.toISOString(),
      loanTrack: formData.loanTrack || undefined,
      description: formData.description || undefined
    }

    console.log('=== DATOS PARA ENVIAR AL BACKEND ===')
    console.log(JSON.stringify(createLoanData, null, 2))
    console.log('=====================================')

    // Por ahora solo cerramos el modal
    onClose()
  }

  const handleClose = () => {
    setSimulatedLoans([])
    onClose()
  }

  const selectedClient = clients.find(c => c.id === formData.clientId)

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
        <DialogTitle>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'grid', gap: 3, pt: 1 }}>
            {/* Selección de Cliente */}
            <FormControl error={!!formErrors.clientId} fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={formData.clientId}
                onChange={(e) => handleSelectChange('clientId', e.target.value)}
                label="Cliente"
                disabled={clientsLoading}
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
              <Alert severity="info">
                Cliente seleccionado: <strong>{selectedClient.fullName}</strong>
                {selectedClient.phone && ` • Tel: ${selectedClient.phone}`}
                {selectedClient.email && ` • Email: ${selectedClient.email}`}
              </Alert>
            )}

            {/* Monto y Moneda */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
              <TextField
                label="Monto del Préstamo"
                type="number"
                value={formData.amount}
                onChange={handleInputChange('amount')}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                required
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
              <TextField
                label="Moneda"
                value="ARS - Peso Argentino"
                disabled
                fullWidth
                helperText="Solo se manejan préstamos en pesos argentinos"
              />
            </Box>

            {/* Tasas de Interés */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
              />
              <TextField
                label="Tasa de Penalización"
                type="number"
                value={formData.penaltyInterestRate}
                onChange={handleInputChange('penaltyInterestRate')}
                error={!!formErrors.penaltyInterestRate}
                helperText={formErrors.penaltyInterestRate || 'Porcentaje adicional por pagos vencidos'}
                required
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Box>

            {/* Frecuencia y Día de Pago */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Frecuencia de Pago</InputLabel>
                <Select
                  value={formData.paymentFrequency}
                  onChange={(e) => handleSelectChange('paymentFrequency', e.target.value)}
                  label="Frecuencia de Pago"
                >
                  <MenuItem value="DAILY">Diario</MenuItem>
                  <MenuItem value="WEEKLY">Semanal</MenuItem>
                  <MenuItem value="BIWEEKLY">Quincenal</MenuItem>
                  <MenuItem value="MONTHLY">Mensual</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Día de Pago</InputLabel>
                <Select
                  value={formData.paymentDay}
                  onChange={(e) => handleSelectChange('paymentDay', e.target.value)}
                  label="Día de Pago"
                >
                  <MenuItem value="MONDAY">Lunes</MenuItem>
                  <MenuItem value="TUESDAY">Martes</MenuItem>
                  <MenuItem value="WEDNESDAY">Miércoles</MenuItem>
                  <MenuItem value="THURSDAY">Jueves</MenuItem>
                  <MenuItem value="FRIDAY">Viernes</MenuItem>
                  <MenuItem value="SATURDAY">Sábado</MenuItem>
                  <MenuItem value="SUNDAY">Domingo</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Total de Pagos y Fecha de Inicio */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Total de Pagos"
                type="number"
                value={formData.totalPayments}
                onChange={handleInputChange('totalPayments')}
                error={!!formErrors.totalPayments}
                helperText={formErrors.totalPayments || 'En cuántos pagos se dividirá el préstamo'}
                required
                fullWidth
              />
              <TextField
                label="Fecha de Primer Pago"
                type="date"
                value={formData.firstDueDate ? formData.firstDueDate.toISOString().split('T')[0] : ''}
                onChange={handleDateChange}
                fullWidth
                helperText="Opcional - si no se especifica, usa fecha actual"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>

            {/* Código de Tracking */}
            <TextField
              label="Código de Tracking"
              value={formData.loanTrack}
              onChange={handleInputChange('loanTrack')}
              helperText="Opcional - si no se especifica, se genera automáticamente"
              fullWidth
            />

            {/* Descripción */}
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={handleInputChange('description')}
              multiline
              rows={2}
              fullWidth
              helperText="Descripción del préstamo"
            />


            {/* Resultados de Simulación */}
            {simulatedLoans.length > 0 && (
              <Alert severity="success">
                <Typography variant="h6" gutterBottom>
                  Simulación de Cuotas Calculada
                </Typography>
                <Typography variant="body2">
                  <strong>Total de pagos:</strong> {simulatedLoans.length}<br />
                  <strong>Monto total con interés:</strong> ${(simulatedLoans.reduce((sum, loan) => sum + loan.totalAmount, 0)).toFixed(2)}<br />
                  <strong>Monto por cuota:</strong> ${simulatedLoans[0]?.totalAmount.toFixed(2)}<br />
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ver detalles completos en la consola del navegador (F12)
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleSimulate}
            variant="outlined"
            disabled={isSimulating}
          >
            {isSimulating ? 'Simulando...' : 'Simular'}
          </Button>
          <Button
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={!simulatedLoans.length}
          >
            Confirmar
          </Button>
        </DialogActions>
    </Dialog>
  )
}