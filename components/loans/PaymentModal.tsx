'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  InputAdornment
} from '@mui/material'
import { Payment, CalendarToday, AttachMoney } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  subloan?: SubLoanWithClientInfo | null
  subloans?: SubLoanWithClientInfo[]
  clientName: string
  mode?: 'single' | 'selector'
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  subloan,
  subloans = [],
  clientName,
  mode = 'single'
}) => {
  const [selectedSubloanId, setSelectedSubloanId] = useState<string>('')
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState<string>('')
  
  const currentSubloan = mode === 'single' ? subloan : 
    subloans.find(s => s.id === selectedSubloanId)

  // Reset form when modal opens/closes or subloan changes
  useEffect(() => {
    if (open) {
      if (mode === 'single' && subloan) {
        setSelectedSubloanId(subloan.id)
        setPaymentAmount('')
      } else if (mode === 'selector' && subloans.length > 0) {
        const firstPending = subloans.find(s => s.status !== 'PAID')
        if (firstPending) {
          setSelectedSubloanId(firstPending.id)
        }
        setPaymentAmount('')
      }
      setPaymentDate(new Date().toISOString().split('T')[0])
      setNotes('')
    }
  }, [open, subloan, subloans, mode])

  const handleAmountChange = (value: string) => {
    setPaymentAmount(formatAmount(value))
  }

  const handlePayFullAmount = () => {
    if (currentSubloan) {
      const pendingAmount = currentSubloan.totalAmount - (currentSubloan.paidAmount || 0)
      setPaymentAmount(formatAmount(pendingAmount.toString()))
    }
  }

  const handleRegisterPayment = () => {
    if (!currentSubloan) return

    const paymentData = {
      subloanId: currentSubloan.id,
      amount: parseFloat(paymentAmount),
      date: paymentDate,
      notes: notes.trim() || undefined
    }

    // Simulate payment registration (without backend)
    console.log('Registrar Pago:', {
      client: clientName,
      cuota: `#${currentSubloan.paymentNumber}`,
      ...paymentData
    })

    // Show success feedback
    alert(`Pago registrado exitosamente!\n\nCliente: ${clientName}\nCuota #${currentSubloan.paymentNumber}\nMonto: $${paymentAmount}\nFecha: ${new Date(paymentDate).toLocaleDateString('es-AR')}`)

    onClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR')
  }

  const pendingSubloans = subloans.filter(s => s.status !== 'PAID')
  const canRegister = currentSubloan && paymentAmount && parseFloat(unformatAmount(paymentAmount)) > 0

  if (!currentSubloan && mode === 'single') {
    return null
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Payment color="primary" />
          <Typography variant="h6">
            Registrar Pago {mode === 'selector' && '- Seleccionar Cuota'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cliente: {clientName}
          </Typography>
        </Box>

        {/* Cuota Selector (only in selector mode) */}
        {mode === 'selector' && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Seleccionar Cuota</InputLabel>
            <Select
              value={selectedSubloanId}
              onChange={(e) => setSelectedSubloanId(e.target.value)}
              label="Seleccionar Cuota"
            >
              {pendingSubloans.map((s) => {
                const pendingAmount = s.totalAmount - (s.paidAmount || 0)
                return (
                  <MenuItem key={s.id} value={s.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>
                        Cuota #{s.paymentNumber} - Vence: {formatDate(s.dueDate)}
                      </Typography>
                      <Typography color="primary" fontWeight="bold">
                        {formatCurrency(pendingAmount)}
                      </Typography>
                    </Box>
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
        )}

        {/* Cuota Details */}
        {currentSubloan && (
          <>
            <Box
              sx={{
                p: 3,
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                border: 1,
                borderColor: 'grey.300',
                mb: 3
              }}
            >
              <Typography variant="h6" gutterBottom>
                Cuota #{currentSubloan.paymentNumber}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Monto Total
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(currentSubloan.totalAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Monto Pagado
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(currentSubloan.paidAmount || 0)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Saldo Pendiente
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {formatCurrency(currentSubloan.totalAmount - (currentSubloan.paidAmount || 0))}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Payment Form */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
              <TextField
                label="Fecha de Pago"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday />
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
              />
              <TextField
                label="Monto a Registrar"
                type="text"
                value={formatAmount(paymentAmount || '')}
                onChange={(e) => {
                  const unformattedValue = unformatAmount(e.target.value);
                  handleAmountChange(unformattedValue);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handlePayFullAmount}
                sx={{ mb: 2 }}
              >
                Pagar Monto Completo ({formatCurrency(currentSubloan.totalAmount - (currentSubloan.paidAmount || 0))})
              </Button>
            </Box>

            <TextField
              label="Notas (opcional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              sx={{ mb: 3 }}
              placeholder="Agregar observaciones sobre el pago..."
            />

          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleRegisterPayment}
          variant="contained"
          disabled={!canRegister}
          startIcon={<Payment />}
        >
          Registrar Pago
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentModal