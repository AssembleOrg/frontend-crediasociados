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
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Alert,
  Chip
} from '@mui/material'
import { Payment, CalendarToday, AttachMoney, PictureAsPdf, Info, History } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import { useOperativa } from '@/hooks/useOperativa'
import { exportService } from '@/services/export.service'
import { paymentsService } from '@/services/payments.service'
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
  const { createIngresoFromPago } = useOperativa()

  const [selectedSubloanId, setSelectedSubloanId] = useState<string>('')
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState<string>('')
  const [generatePDF, setGeneratePDF] = useState<boolean>(true) // Default: generate PDF
  const [paymentPreview, setPaymentPreview] = useState<{
    remainingAfterPayment: number
    status: 'PARTIAL' | 'PAID'
    isPartial: boolean
  } | null>(null)

  const currentSubloan = mode === 'single' ? subloan :
    subloans.find(s => s.id === selectedSubloanId)

  // Reset form when modal opens/closes or subloan changes
  useEffect(() => {
    if (open) {
      if (mode === 'single' && subloan) {
        setSelectedSubloanId(subloan.id)
        // Auto-fill with pending amount (partial payments allowed)
        const pendingAmount = subloan.totalAmount - (subloan.paidAmount || 0)
        setPaymentAmount(formatAmount(pendingAmount.toString()))
      } else if (mode === 'selector' && subloans.length > 0) {
        const firstPending = subloans.find(s => s.status !== 'PAID')
        if (firstPending) {
          setSelectedSubloanId(firstPending.id)
          // Auto-fill with pending amount (partial payments allowed)
          const pendingAmount = firstPending.totalAmount - (firstPending.paidAmount || 0)
          setPaymentAmount(formatAmount(pendingAmount.toString()))
        } else {
          setPaymentAmount('')
        }
      }
      setPaymentDate(new Date().toISOString().split('T')[0])
      setNotes('')
    }
  }, [open, subloan, subloans, mode])

  // Auto-fill payment amount when subloan selection changes in selector mode
  useEffect(() => {
    if (open && mode === 'selector' && selectedSubloanId && currentSubloan) {
      const pendingAmount = currentSubloan.totalAmount - (currentSubloan.paidAmount || 0)
      setPaymentAmount(formatAmount(pendingAmount.toString()))
    }
  }, [selectedSubloanId, currentSubloan, open, mode])

  // Calculate payment preview (status changes)
  useEffect(() => {
    if (currentSubloan && paymentAmount) {
      const amountValue = parseFloat(unformatAmount(paymentAmount)) || 0
      const pendingAmount = currentSubloan.totalAmount - (currentSubloan.paidAmount || 0)
      const remainingAfterPayment = Math.max(0, pendingAmount - amountValue)
      const isPartial = amountValue > 0 && remainingAfterPayment > 0
      const status = remainingAfterPayment === 0 ? 'PAID' : 'PARTIAL'

      setPaymentPreview({
        remainingAfterPayment,
        status,
        isPartial
      })
    } else {
      setPaymentPreview(null)
    }
  }, [currentSubloan, paymentAmount])

  const handleRegisterPayment = async () => {
    if (!currentSubloan) return

    const amountValue = parseFloat(unformatAmount(paymentAmount))

    // Create ingreso in operativa system
    const ingreso = await createIngresoFromPago(
      currentSubloan.id,
      amountValue,
      clientName,
      currentSubloan.paymentNumber,
      new Date(paymentDate)
    )

    if (ingreso) {
      // Generate PDF if requested
      if (generatePDF) {
        try {
          // TODO: This is a simplified receipt. When backend provides full loan data,
          // we can generate a more complete payment receipt with loan details.
          const receiptData = {
            clientName,
            paymentNumber: currentSubloan.paymentNumber,
            amount: amountValue,
            paymentDate: new Date(paymentDate),
            loanTrack: currentSubloan.loanTrack || 'N/A',
            notes: notes || 'Pago registrado exitosamente'
          }

          // For now, create a simple text-based receipt
          // Future: Use exportService to generate proper PDF with loan data
          const receiptText = `
COMPROBANTE DE PAGO
===================

Cliente: ${clientName}
Código de Préstamo: ${receiptData.loanTrack}
Cuota #: ${currentSubloan.paymentNumber}
Monto Pagado: $${formatAmount(amountValue.toString())}
Fecha de Pago: ${new Date(paymentDate).toLocaleDateString('es-AR')}
${notes ? `\nNotas: ${notes}` : ''}

Generado: ${new Date().toLocaleString('es-AR')}
Sistema: Prestamito
          `.trim()

          // Download as text file (temporary solution until full PDF implementation)
          const blob = new Blob([receiptText], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `comprobante-pago-${clientName.replace(/\s+/g, '-')}-${currentSubloan.paymentNumber}.txt`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          console.log('📄 Comprobante de pago generado')
        } catch (error) {
          console.error('Error generating payment receipt:', error)
          // Don't block the payment if PDF generation fails
        }
      }

      // Show success feedback
      alert(
        `✅ Pago registrado exitosamente!\n\n` +
        `Cliente: ${clientName}\n` +
        `Cuota #${currentSubloan.paymentNumber}\n` +
        `Monto: $${formatAmount(amountValue.toString())}\n` +
        `Fecha: ${new Date(paymentDate).toLocaleDateString('es-AR')}\n\n` +
        `💰 El ingreso ha sido registrado en Operativa` +
        (generatePDF ? '\n📄 Comprobante descargado' : '')
      )

      onClose()
    } else {
      alert('❌ Error al registrar el pago. Por favor intenta nuevamente.')
    }
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
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                }}
                helperText={`Pendiente: $${formatAmount((currentSubloan.totalAmount - (currentSubloan.paidAmount || 0)).toString())} - Puedes pagar parcialmente`}
                fullWidth
              />
            </Box>

            {/* Payment Preview - Status Display */}
            {paymentPreview && (
              <Alert
                icon={<Info />}
                severity={paymentPreview.isPartial ? 'warning' : 'success'}
                sx={{ mb: 3 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {paymentPreview.isPartial
                      ? `⚠️ Este será un pago PARCIAL`
                      : `✅ Este completará el pago (PAGADO)`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={paymentPreview.status}
                      color={paymentPreview.status === 'PAID' ? 'success' : 'warning'}
                      size="small"
                      variant="outlined"
                    />
                    {paymentPreview.remainingAfterPayment > 0 && (
                      <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>
                        Restará: ${formatAmount(paymentPreview.remainingAfterPayment.toString())}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Alert>
            )}

            <TextField
              label="Notas (opcional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="Agregar observaciones sobre el pago..."
            />

            {/* PDF Generation Option */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={generatePDF}
                  onChange={(e) => setGeneratePDF(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PictureAsPdf fontSize="small" />
                  <Typography variant="body2">
                    Generar comprobante de pago (recomendado)
                  </Typography>
                </Box>
              }
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