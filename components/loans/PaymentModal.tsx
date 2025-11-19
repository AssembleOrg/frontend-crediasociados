'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Chip,
  CircularProgress
} from '@mui/material'
import { Payment, AttachMoney, PictureAsPdf, Info } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import { generatePaymentPDF } from '@/utils/pdf/paymentReceipt'
import { useOperativa } from '@/hooks/useOperativa'
import { paymentsService } from '@/services/payments.service'
import { PaymentErrorModal } from './PaymentErrorModal'
import { PaymentSuccessModal } from './PaymentSuccessModal'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  subloan?: SubLoanWithClientInfo | null
  subloans?: SubLoanWithClientInfo[]
  clientName: string
  mode?: 'single' | 'selector'
  onPaymentSuccess?: () => void // Callback to refetch data after successful payment
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  subloan,
  subloans = [],
  clientName,
  mode = 'single',
  onPaymentSuccess
}) => {
  const { createIngresoFromPago } = useOperativa()

  const [selectedSubloanId, setSelectedSubloanId] = useState<string>('')
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState<string>('')
  const [generatePDF, setGeneratePDF] = useState<boolean>(false) // Default: do not generate PDF
  const [isRegistering, setIsRegistering] = useState<boolean>(false) // ✅ Loading state for button
  const [hasUserEdited, setHasUserEdited] = useState<boolean>(false) // ✅ Track if user manually edited the amount
  const [paymentPreview, setPaymentPreview] = useState<{
    remainingAfterPayment: number
    status: 'PARTIAL' | 'PAID'
    isPartial: boolean
  } | null>(null)

  // Modal states for error and success feedback
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successData, setSuccessData] = useState<{
    clientName: string
    paymentNumber: number
    amount: number
    paymentDate: Date
    status: 'PARTIAL' | 'PAID'
    remainingAmount: number
    notes?: string
    pdfGenerated: boolean
  } | null>(null)

  const currentSubloan = useMemo(() => {
    return mode === 'single' ? subloan : subloans.find(s => s.id === selectedSubloanId)
  }, [mode, subloan, subloans, selectedSubloanId])

  // Reset form ONLY when modal opens. Avoid depending on object props to prevent unwanted resets.
  useEffect(() => {
    if (!open) return
    setHasUserEdited(false) // Reset edit flag when modal opens
    if (mode === 'single' && subloan) {
      setSelectedSubloanId(subloan.id ?? '')
      // Auto-fill with pending amount (partial payments allowed)
      const pendingAmount = (subloan.totalAmount ?? 0) - (subloan.paidAmount || 0)
      setPaymentAmount(pendingAmount.toString())
    } else if (mode === 'selector' && subloans.length > 0) {
      const firstPending = subloans.find(s => s.status !== 'PAID')
      if (firstPending) {
        setSelectedSubloanId(firstPending.id ?? '')
        // Auto-fill with pending amount (partial payments allowed)
        const pendingAmount = (firstPending.totalAmount ?? 0) - (firstPending.paidAmount || 0)
        setPaymentAmount(pendingAmount.toString())
      } else {
        setPaymentAmount('')
      }
    }
    setPaymentDate(new Date().toISOString().split('T')[0])
    setNotes('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode])

  // Auto-fill payment amount when subloan selection changes in selector mode
  // BUT only if user hasn't manually edited the amount
  useEffect(() => {
    if (open && mode === 'selector' && selectedSubloanId && currentSubloan && !hasUserEdited) {
      const pendingAmount = (currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)
      setPaymentAmount(pendingAmount.toString())
    }
  }, [selectedSubloanId, open, mode, hasUserEdited])

  // Calculate payment preview (status changes)
  useEffect(() => {
    if (currentSubloan && paymentAmount) {
      const amountValue = parseFloat(paymentAmount) || 0
      const pendingAmount = (currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)
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

    // ✅ Set loading state to disable button
    setIsRegistering(true)

    try {
      const amountValue = parseFloat(paymentAmount)

      // Register payment using the real payments service endpoint
      // This updates the SubLoan status and creates the payment record
      const paymentResult = await paymentsService.registerPayment({
        subLoanId: currentSubloan.id ?? '',
        amount: amountValue,
        currency: 'ARS',
        paymentDate: paymentDate,
        description: notes || undefined
      })

      if (paymentResult) {
        // Also create ingreso in operativa system for financial tracking
        try {
          await createIngresoFromPago(
            currentSubloan.id ?? '',
            amountValue,
            clientName,
            currentSubloan.paymentNumber ?? 0,
            new Date(paymentDate)
          )
        } catch (operativaError) {
          console.warn('⚠️ Payment registered but Operativa entry failed:', operativaError)
          // Don't block - payment is already registered
        }

        // Determine if this was a PARTIAL or PAID payment
        const remainingAfterPayment = Math.max(0, ((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)) - amountValue)
        const newStatus = remainingAfterPayment === 0 ? 'PAID' : 'PARTIAL'

        // Generate receipt if requested
        if (generatePDF) {
          try {
            generatePaymentPDF({
              clientName,
              paymentNumber: currentSubloan.paymentNumber ?? 0,
              amount: amountValue,
              paymentDate: new Date(paymentDate),
              loanTrack: 'N/A',
              status: newStatus,
              remainingAmount: remainingAfterPayment,
              notes: notes || undefined
            })

            console.log('📄 Comprobante de pago PDF generado')
          } catch (error) {
            console.error('Error generating payment receipt:', error)
            // Don't block the payment if receipt generation fails
          }
        }

        // Show success feedback with new modal
        setSuccessData({
          clientName,
          paymentNumber: currentSubloan.paymentNumber ?? 0,
          amount: amountValue,
          paymentDate: new Date(paymentDate),
          status: newStatus,
          remainingAmount: remainingAfterPayment,
          notes: notes || undefined,
          pdfGenerated: generatePDF
        })
        setSuccessModalOpen(true)

        // ✅ Trigger refetch callback after successful payment
        if (onPaymentSuccess) {
          onPaymentSuccess()
        }
      }
    } catch (error) {
      console.error('Payment registration error:', error)

      // Extract error message for better UX
      const errObj = error as Record<string, unknown>
      const responseData = (errObj?.response as Record<string, unknown>)?.data as Record<string, unknown> | undefined
      const errorMsg = responseData?.message ||
                       errObj?.message ||
                       'Error al registrar el pago. Por favor intenta nuevamente.'
      setErrorMessage(String(errorMsg))
      setErrorModalOpen(true)
    } finally {
      // ✅ Always reset loading state
      setIsRegistering(false)
    }
  }

  const handleSuccessClose = () => {
    setSuccessModalOpen(false)
    setSuccessData(null)
    onClose()
  }

  const handleErrorRetry = () => {
    setErrorModalOpen(false)
    setErrorMessage('')
  }

  const formatCurrency = (amount: number) => {
    // Formato genérico sin especificar país o moneda
    return `$${new Intl.NumberFormat('es', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-AR')
  }

  const pendingSubloans = subloans.filter(s => s.status !== 'PAID')
  const canRegister = currentSubloan && paymentAmount && parseFloat(paymentAmount) > 0

  if (!currentSubloan && mode === 'single') {
    return null
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          maxHeight: { xs: '100vh', sm: '90vh' },
          m: { xs: 0, sm: 2 },
          mt: { xs: 0, sm: 3 },
          width: { xs: '100%', sm: 'auto' }
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: { xs: 2, sm: 3 },
          pt: { xs: 3, sm: 3.5 }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Payment sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              Registrar Pago
            </Typography>
            {mode === 'selector' && (
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                }}
              >
                Selecciona la cuota a pagar
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
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
                const pendingAmount = (s.totalAmount ?? 0) - (s.paidAmount || 0)
                return (
                  <MenuItem key={s.id ?? ''} value={s.id ?? ''}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>
                        Cuota #{s.paymentNumber ?? '?'} - Vence: {formatDate(s.dueDate)}
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
                p: { xs: 2, sm: 2.5 },
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'primary.main',
                mb: 3
              }}
            >
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                Cuota #{currentSubloan.paymentNumber ?? '?'}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, bgcolor: 'white', borderRadius: 2 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    Monto Total
                  </Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    $ {formatAmount((currentSubloan.totalAmount ?? 0).toString())}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, bgcolor: 'white', borderRadius: 2 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    Monto Pagado
                  </Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    color="success.main"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    $ {formatAmount((currentSubloan.paidAmount || 0).toString())}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, bgcolor: 'white', borderRadius: 2 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    Saldo Pendiente
                  </Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    color="error.main"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    $ {formatAmount(((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)).toString())}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Payment Form */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, sm: 2 }, mb: 3 }}>
              {/* <TextField
                label="Fecha de Pago"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                  }
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
              /> */}
              <TextField
                label="Monto a Registrar"
                type="text"
                value={formatAmount(paymentAmount)}
                onChange={(e) => {
                  setHasUserEdited(true) // Mark as edited
                  const raw = unformatAmount(e.target.value)
                  setPaymentAmount(raw)
                }}
                inputMode="numeric"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                  }
                }}
                helperText={`Pendiente: $${formatAmount(((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)).toString())} - Puedes pagar parcialmente`}
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

      <Divider />
      
      <DialogActions sx={{ 
        p: { xs: 2, sm: 3 }, 
        gap: { xs: 1.5, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          fullWidth
          sx={{
            borderRadius: 2,
            py: { xs: 1.25, sm: 1.5 },
            order: { xs: 2, sm: 1 },
            minWidth: { xs: '100%', sm: 'auto' }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleRegisterPayment}
          variant="contained"
          disabled={!canRegister || isRegistering}
          startIcon={isRegistering ? <CircularProgress size={20} color="inherit" /> : <Payment />}
          fullWidth
          sx={{
            borderRadius: 2,
            py: { xs: 1.25, sm: 1.5 },
            order: { xs: 1, sm: 2 },
            minWidth: { xs: '100%', sm: 'auto' },
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4292 100%)',
            }
          }}
        >
          {isRegistering ? 'Registrando...' : 'Registrar Pago'}
        </Button>
      </DialogActions>

      {/* Error Modal */}
      <PaymentErrorModal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        errorMessage={errorMessage}
        onRetry={handleErrorRetry}
      />

      {/* Success Modal */}
      {successData && (
        <PaymentSuccessModal
          open={successModalOpen}
          onClose={handleSuccessClose}
          clientName={successData.clientName}
          paymentNumber={successData.paymentNumber}
          amount={successData.amount}
          paymentDate={successData.paymentDate}
          status={successData.status}
          remainingAmount={successData.remainingAmount}
          notes={successData.notes}
          pdfGenerated={successData.pdfGenerated}
        />
      )}
    </Dialog>
  )
}

export default PaymentModal