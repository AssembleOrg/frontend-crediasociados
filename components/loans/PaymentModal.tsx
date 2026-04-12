'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
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
import { Payment, AttachMoney, PictureAsPdf, Info, Warning, TuneRounded } from '@mui/icons-material'
import { formatAmount, unformatAmount, formatCurrencyDisplay, numberToFormattedAmount } from '@/lib/formatters'
import { generatePaymentPDF, type PaymentReceiptData } from '@/utils/pdf/paymentReceipt'
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
  const [hasUserEdited, setHasUserEdited] = useState<boolean>(false)
  const [adjustEnabled, setAdjustEnabled] = useState<boolean>(false)
  const [adjustedAmount, setAdjustedAmount] = useState<string>('') // new total amount for the installment
  const [paymentPreview, setPaymentPreview] = useState<{
    remainingAfterPayment: number
    status: 'PARTIAL' | 'PAID'
    isPartial: boolean
  } | null>(null)

  // Modal states for error and success feedback
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [multiPaymentConfirmOpen, setMultiPaymentConfirmOpen] = useState(false)
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
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null)

  const currentSubloan = useMemo(() => {
    return mode === 'single' ? subloan : subloans.find(s => s.id === selectedSubloanId)
  }, [mode, subloan, subloans, selectedSubloanId])


  // Reset form ONLY when modal opens. Avoid depending on object props to prevent unwanted resets.
  useEffect(() => {
    if (!open) {
      // Reset receipt data when payment modal closes
      setReceiptData(null)
      return
    }
    setHasUserEdited(false)
    setAdjustEnabled(false)
    setAdjustedAmount('')
    if (mode === 'single' && subloan) {
      setSelectedSubloanId(subloan.id ?? '')
      // Auto-fill with pending amount (partial payments allowed)
      const pendingAmount = (subloan.totalAmount ?? 0) - (subloan.paidAmount || 0)
      setPaymentAmount(pendingAmount > 0 ? numberToFormattedAmount(pendingAmount) : '')
    } else if (mode === 'selector' && subloans.length > 0) {
      // Solo permitir seleccionar subpréstamos no pagados
      const firstPending = subloans.find(s => s.status !== 'PAID')
      if (firstPending) {
        setSelectedSubloanId(firstPending.id ?? '')
        const pendingAmount = (firstPending.totalAmount ?? 0) - (firstPending.paidAmount || 0)
        setPaymentAmount(pendingAmount > 0 ? numberToFormattedAmount(pendingAmount) : '')
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
      setPaymentAmount(pendingAmount > 0 ? numberToFormattedAmount(pendingAmount) : '')
    }
  }, [selectedSubloanId, open, mode, hasUserEdited, currentSubloan])

  // Effective total amount for this installment (adjusted or original)
  const effectiveTotalAmount = adjustEnabled && adjustedAmount
    ? (parseFloat(unformatAmount(adjustedAmount)) || 0)
    : (currentSubloan?.totalAmount ?? 0)

  // Calculate payment preview (status changes)
  useEffect(() => {
    if (currentSubloan && paymentAmount) {
      const amountValue = parseFloat(unformatAmount(paymentAmount)) || 0
      const currentPaidAmount = currentSubloan.paidAmount || 0
      const newPaidAmount = currentPaidAmount + amountValue
      const remainingAfterPayment = Math.max(0, effectiveTotalAmount - newPaidAmount)
      const isPartial = newPaidAmount > 0 && remainingAfterPayment >= 0.01
      const status = remainingAfterPayment < 0.01 ? 'PAID' : 'PARTIAL'

      setPaymentPreview({
        remainingAfterPayment,
        status,
        isPartial
      })
    } else {
      setPaymentPreview(null)
    }
  }, [currentSubloan, paymentAmount, effectiveTotalAmount])

  // When adjusted amount changes, auto-fill payment with the new pending amount
  useEffect(() => {
    if (adjustEnabled && currentSubloan && !hasUserEdited && adjustedAmount) {
      const newTotal = parseFloat(unformatAmount(adjustedAmount)) || 0
      const pendingAmount = newTotal - (currentSubloan.paidAmount || 0)
      setPaymentAmount(pendingAmount > 0 ? numberToFormattedAmount(pendingAmount) : '')
    }
  }, [adjustedAmount, adjustEnabled])

  const handleRegisterPayment = async () => {
    if (!currentSubloan) return

    const amountValue = parseFloat(unformatAmount(paymentAmount)) || 0
    const pendingAmount = (currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)

    // Check if payment amount exceeds pending amount (will pay multiple installments)
    if (amountValue > pendingAmount) {
      setMultiPaymentConfirmOpen(true)
      return
    }

    // Proceed with payment registration
    await executePayment(amountValue)
  }

  const executePayment = async (amountValue: number) => {
    if (!currentSubloan) return

    // ✅ Set loading state to disable button
    setIsRegistering(true)

    try {

      // Register payment using the real payments service endpoint
      // This updates the SubLoan status and creates the payment record
      const paymentResult = await paymentsService.registerPayment({
        subLoanId: currentSubloan.id ?? '',
        amount: amountValue,
        currency: 'ARS',
        paymentDate: paymentDate,
        description: notes || undefined,
        ...(adjustEnabled && adjustedAmount ? { adjustedTotalAmount: parseFloat(unformatAmount(adjustedAmount)) || undefined } : {}),
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
          // Payment registered but Operativa entry failed
          // Don't block - payment is already registered
        }

        // Determine if this was a PARTIAL or PAID payment
        const remainingAfterPayment = Math.max(0, ((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)) - amountValue)
        const newStatus = remainingAfterPayment === 0 ? 'PAID' : 'PARTIAL'

        // Prepare receipt data if we have the new extended response format
        let receiptDataToShow: PaymentReceiptData | null = null
        
        if (paymentResult.loan && paymentResult.loanSummary && paymentResult.subLoans) {
          receiptDataToShow = {
            payment: {
              id: paymentResult.payment.id,
              amount: paymentResult.payment.amount,
              paymentDate: new Date(paymentResult.payment.paymentDate),
              description: paymentResult.payment.description || undefined
            },
            subLoan: {
              id: paymentResult.subLoan.id,
              paymentNumber: paymentResult.subLoan.paymentNumber,
              totalAmount: paymentResult.subLoan.totalAmount,
              status: paymentResult.subLoan.status,
              paidAmount: paymentResult.subLoan.paidAmount,
              pendingAmount: paymentResult.subLoan.remainingAmount
            },
            loan: {
              id: paymentResult.loan.id,
              loanTrack: paymentResult.loan.loanTrack,
              amount: paymentResult.loan.amount,
              originalAmount: paymentResult.loan.originalAmount,
              currency: paymentResult.loan.currency,
              client: {
                id: paymentResult.loan.client.id,
                fullName: paymentResult.loan.client.fullName,
                dni: paymentResult.loan.client.dni,
                cuit: paymentResult.loan.client.cuit
              }
            },
            loanSummary: paymentResult.loanSummary,
            subLoans: paymentResult.subLoans.map(sl => ({
              id: sl.id,
              paymentNumber: sl.paymentNumber,
              amount: sl.amount,
              totalAmount: sl.totalAmount,
              status: sl.status,
              dueDate: new Date(sl.dueDate),
              paidDate: sl.paidDate ? new Date(sl.paidDate) : null,
              paidAmount: sl.paidAmount,
              pendingAmount: sl.pendingAmount,
              daysOverdue: sl.daysOverdue
            })),
            notes: notes || undefined
          }
        } else {
          console.log('Missing data for receipt modal, using fallback')
        }

        // Generate receipt PDF if requested
        if (generatePDF && receiptDataToShow) {
          try {
            generatePaymentPDF(receiptDataToShow)
          } catch (error) {
            console.error('Error generating PDF:', error)
          }
        } else if (generatePDF) {
          // Fallback to legacy format
          try {
            generatePaymentPDF({
              clientName,
              paymentNumber: paymentResult.subLoan.paymentNumber || (currentSubloan.paymentNumber ?? 0),
              amount: amountValue,
              paymentDate: new Date(paymentDate),
              loanTrack: 'N/A',
              status: newStatus,
              remainingAmount: remainingAfterPayment,
              notes: notes || undefined
            })
          } catch (error) {
            console.error('Error generating PDF:', error)
          }
        }

        // Prepare success modal data and open it
        // DON'T close payment modal yet - keep it open so state persists
        if (receiptDataToShow) {
          // Show success modal with full receipt data
          setSuccessData({
            clientName,
            paymentNumber: paymentResult.subLoan.paymentNumber || (currentSubloan.paymentNumber ?? 0),
            amount: amountValue,
            paymentDate: new Date(paymentDate),
            status: newStatus,
            remainingAmount: remainingAfterPayment,
            notes: notes || undefined,
            pdfGenerated: generatePDF
          })
          // Store receipt data separately to pass to success modal
          setReceiptData(receiptDataToShow)
          setSuccessModalOpen(true)
        } else {
          // Fallback to simple success modal
          setSuccessData({
            clientName,
            paymentNumber: paymentResult.subLoan.paymentNumber || (currentSubloan.paymentNumber ?? 0),
            amount: amountValue,
            paymentDate: new Date(paymentDate),
            status: newStatus,
            remainingAmount: remainingAfterPayment,
            notes: notes || undefined,
            pdfGenerated: generatePDF
          })
          setSuccessModalOpen(true)
        }
        
        // DON'T close payment modal - let success modal close it when user closes it

        // ✅ Trigger refetch callback after successful payment
        if (onPaymentSuccess) {
          onPaymentSuccess()
        }
      }
    } catch (error) {
      // Payment registration error

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

  // Use the shared formatter from lib/formatters
  const formatCurrency = formatCurrencyDisplay

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
    <>
    <Dialog
      open={open && !successModalOpen}
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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2 } }}>
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
                    {formatCurrencyDisplay(currentSubloan.totalAmount ?? 0)}
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
                    {formatCurrencyDisplay(currentSubloan.paidAmount || 0)}
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
                    {formatCurrency((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0))}
                  </Typography>
                </Box>
                {currentSubloan.outstandingBalance !== undefined && (
                  <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'warning.main' }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      Saldo a finalizar
                    </Typography>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      color="warning.main"
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                      {formatCurrencyDisplay(currentSubloan.outstandingBalance ?? 0)}
                    </Typography>
                  </Box>
                )}
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
              {/* Adjust Installment Amount - BEFORE payment amount */}
              <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: adjustEnabled ? 'primary.main' : 'divider', borderRadius: 2, bgcolor: adjustEnabled ? 'primary.lighter' : 'transparent', transition: 'all 0.2s' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={adjustEnabled}
                      onChange={(e) => {
                        setAdjustEnabled(e.target.checked)
                        if (!e.target.checked) {
                          setAdjustedAmount('')
                          if (currentSubloan && !hasUserEdited) {
                            const pendingAmount = (currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)
                            setPaymentAmount(pendingAmount > 0 ? numberToFormattedAmount(pendingAmount) : '')
                          }
                        } else if (currentSubloan) {
                          setAdjustedAmount(numberToFormattedAmount(currentSubloan.totalAmount ?? 0))
                        }
                      }}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TuneRounded fontSize="small" color={adjustEnabled ? 'primary' : 'action'} />
                      <Typography variant="body2" fontWeight={adjustEnabled ? 600 : 400}>
                        Ajustar monto de esta cuota
                      </Typography>
                    </Box>
                  }
                />
                {adjustEnabled && currentSubloan && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Monto original: {formatCurrencyDisplay(currentSubloan.totalAmount ?? 0)}
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      label="Nuevo monto de la cuota"
                      type="text"
                      inputMode="numeric"
                      value={formatAmount(adjustedAmount)}
                      onChange={(e) => {
                        const raw = unformatAmount(e.target.value)
                        setAdjustedAmount(raw)
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ mb: 1 }}
                    />
                    {effectiveTotalAmount !== (currentSubloan.totalAmount ?? 0) && effectiveTotalAmount > 0 && (
                      <Alert
                        severity={effectiveTotalAmount < (currentSubloan.totalAmount ?? 0) ? 'success' : 'warning'}
                        sx={{ py: 0.5 }}
                      >
                        <Typography variant="caption">
                          {effectiveTotalAmount < (currentSubloan.totalAmount ?? 0)
                            ? `Cuota reducida a ${formatCurrencyDisplay(effectiveTotalAmount)} (descuento de ${formatCurrencyDisplay((currentSubloan.totalAmount ?? 0) - effectiveTotalAmount)})`
                            : `Cuota aumentada a ${formatCurrencyDisplay(effectiveTotalAmount)} (recargo de ${formatCurrencyDisplay(effectiveTotalAmount - (currentSubloan.totalAmount ?? 0))})`
                          }
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>

              {/* Payment Amount - right after adjustment */}
              <TextField
                label="Monto a Registrar"
                type="text"
                value={formatAmount(paymentAmount)}
                onChange={(e) => {
                  setHasUserEdited(true)
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
                  sx: { borderRadius: 2 }
                }}
                helperText={`Pendiente: ${formatCurrencyDisplay(effectiveTotalAmount - (currentSubloan.paidAmount || 0))} - Puedes pagar parcialmente`}
                fullWidth
              />
            </Box>

            {/* Payment Preview */}
            {paymentPreview && (
              <Alert
                icon={<Info />}
                severity={paymentPreview.isPartial ? 'warning' : 'success'}
                sx={{ mb: 3 }}
              >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 1, justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {paymentPreview.isPartial
                      ? 'Este sera un pago PARCIAL'
                      : 'Este completara el pago (PAGADO)'}
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
                        Restara: {formatCurrencyDisplay(paymentPreview.remainingAfterPayment)}
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

      {/* Success Modal - Rendered via Portal to appear above everything, even when PaymentModal closes */}
      {successData && typeof document !== 'undefined' && createPortal(
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
          receiptData={receiptData} // Pass full receipt data if available
        />,
        document.body
      )}

      {/* Multi-Payment Confirmation Modal */}
      <Dialog
        open={multiPaymentConfirmOpen}
        onClose={() => setMultiPaymentConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Warning color="warning" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">
              Confirmar Pago de Múltiples Cuotas
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentSubloan && (
            <>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                El monto a pagar es mayor al saldo pendiente de la cuota actual.
              </Typography>
              
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Detalles del pago:
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    Saldo pendiente de la cuota #{currentSubloan.paymentNumber}:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main">
                    {formatCurrency((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0))}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={500}>
                    Monto a pagar:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    ${formatAmount(paymentAmount)}
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  ⚠️ Importante:
                </Typography>
                <Typography variant="body2">
                  Este pago completará la cuota actual y se aplicará el excedente a las siguientes cuotas pendientes.
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary">
                ¿Deseas continuar con el registro del pago?
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, gap: 2 }}>
          <Button
            onClick={() => setMultiPaymentConfirmOpen(false)}
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              setMultiPaymentConfirmOpen(false)
              const amountValue = parseFloat(paymentAmount)
              await executePayment(amountValue)
            }}
            variant="contained"
            color="primary"
            sx={{ minWidth: 120 }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
    
    {/* Success Modal - Rendered via Portal to appear above everything */}
    {successData && typeof document !== 'undefined' && createPortal(
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
        receiptData={receiptData} // Pass full receipt data if available
      />,
      document.body
    )}
    </>
  )
}

export default PaymentModal