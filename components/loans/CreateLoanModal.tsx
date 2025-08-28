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
import { LoanSimulationModal } from './LoanSimulationModal'


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
        paymentDay: 'FRIDAY' as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY',
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
                value="5"
                disabled
                fullWidth
                helperText="Temporalmente deshabilitado - Se aplicará 5% por defecto"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: '#666'
                  }
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
              
              {formData.paymentFrequency === 'DAILY' ? (
                <TextField
                  label="Día de Pago"
                  value="Todos los días"
                  disabled
                  fullWidth
                  helperText="Cobros diarios - No requiere día específico"
                />
              ) : (
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
              )}
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


          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSimulate}
            variant="contained"
            disabled={isSimulating}
            size="large"
            sx={{ minWidth: 200 }}
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