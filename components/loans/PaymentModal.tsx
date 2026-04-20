'use client'

/**
 * PaymentModal — Container/Orchestrator.
 * On mobile (xs/sm): renders PaymentForm inside a SwipeableDrawer.
 * On desktop (md+):  renders PaymentForm inside a Dialog.
 * All form logic lives in PaymentForm.
 */

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Dialog,
  DialogTitle,
  SwipeableDrawer,
  Box,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  Alert,
  IconButton,
} from '@mui/material'
import { Payment, Warning, Close } from '@mui/icons-material'
import { formatAmount, unformatAmount, numberToFormattedAmount } from '@/lib/formatters'
import { generatePaymentPDF, type PaymentReceiptData } from '@/utils/pdf/paymentReceipt'
import { useOperativa } from '@/hooks/useOperativa'
import { paymentsService } from '@/services/payments.service'
import { PaymentErrorModal } from './PaymentErrorModal'
import { PaymentSuccessModal } from './PaymentSuccessModal'
import { PaymentForm } from './PaymentForm'
import { useBottomSheet } from '@/hooks/useBottomSheet'
import { iosColors } from '@/lib/theme'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  subloan?: SubLoanWithClientInfo | null
  subloans?: SubLoanWithClientInfo[]
  clientName: string
  mode?: 'single' | 'selector'
  onPaymentSuccess?: () => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  subloan,
  subloans = [],
  clientName,
  mode = 'single',
  onPaymentSuccess,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { createIngresoFromPago } = useOperativa()

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedSubloanId, setSelectedSubloanId] = useState<string>('')
  const [paymentAmount, setPaymentAmount]           = useState<string>('')
  const [notes, setNotes]                           = useState<string>('')
  const [generatePDF, setGeneratePDF]               = useState<boolean>(false)
  const [isRegistering, setIsRegistering]           = useState<boolean>(false)
  const [hasUserEdited, setHasUserEdited]           = useState<boolean>(false)
  const [adjustEnabled, setAdjustEnabled]           = useState<boolean>(false)
  const [adjustedAmount, setAdjustedAmount]         = useState<string>('')
  const [paymentPreview, setPaymentPreview]         = useState<{
    remainingAfterPayment: number
    status: 'PARTIAL' | 'PAID'
    isPartial: boolean
  } | null>(null)

  // ── Feedback state ─────────────────────────────────────────────────────────
  const [errorModalOpen, setErrorModalOpen]                 = useState(false)
  const [errorMessage, setErrorMessage]                     = useState('')
  const [successModalOpen, setSuccessModalOpen]             = useState(false)
  const [multiPaymentConfirmOpen, setMultiPaymentConfirmOpen] = useState(false)
  const [successData, setSuccessData]                       = useState<{
    clientName: string; paymentNumber: number; amount: number; paymentDate: Date
    status: 'PARTIAL' | 'PAID'; remainingAmount: number; notes?: string; pdfGenerated: boolean
  } | null>(null)
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null)

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentSubloan = useMemo(
    () => (mode === 'single' ? subloan : subloans.find((s) => s.id === selectedSubloanId)),
    [mode, subloan, subloans, selectedSubloanId],
  )

  const effectiveTotalAmount = adjustEnabled && adjustedAmount
    ? (parseFloat(unformatAmount(adjustedAmount)) || 0)
    : (currentSubloan?.totalAmount ?? 0)

  const pendingSubloans = subloans.filter((s) => s.status !== 'PAID')

  // ── Bottom sheet hook (for mobile SwipeableDrawer) ─────────────────────────
  const { handleOpen: sheetOpen, handleClose: sheetClose } = useBottomSheet(open, (v) => {
    if (!v) onClose()
  })

  // ── Reset form on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setReceiptData(null)
      return
    }
    setHasUserEdited(false)
    setAdjustEnabled(false)
    setAdjustedAmount('')
    if (mode === 'single' && subloan) {
      setSelectedSubloanId(subloan.id ?? '')
      const pending = (subloan.totalAmount ?? 0) - (subloan.paidAmount || 0)
      setPaymentAmount(pending > 0 ? numberToFormattedAmount(pending) : '')
    } else if (mode === 'selector' && subloans.length > 0) {
      const first = subloans.find((s) => s.status !== 'PAID')
      if (first) {
        setSelectedSubloanId(first.id ?? '')
        const pending = (first.totalAmount ?? 0) - (first.paidAmount || 0)
        setPaymentAmount(pending > 0 ? numberToFormattedAmount(pending) : '')
      } else {
        setPaymentAmount('')
      }
    }
    setNotes('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode])

  // Auto-fill when subloan selection changes
  useEffect(() => {
    if (open && mode === 'selector' && selectedSubloanId && currentSubloan && !hasUserEdited) {
      const pending = (currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)
      setPaymentAmount(pending > 0 ? numberToFormattedAmount(pending) : '')
    }
  }, [selectedSubloanId, open, mode, hasUserEdited, currentSubloan])

  // Auto-fill when adjusted amount changes
  useEffect(() => {
    if (adjustEnabled && currentSubloan && !hasUserEdited && adjustedAmount) {
      const newTotal = parseFloat(unformatAmount(adjustedAmount)) || 0
      const pending = newTotal - (currentSubloan.paidAmount || 0)
      setPaymentAmount(pending > 0 ? numberToFormattedAmount(pending) : '')
    }
  }, [adjustedAmount, adjustEnabled])

  // Payment preview
  useEffect(() => {
    if (currentSubloan && paymentAmount) {
      const amount = parseFloat(unformatAmount(paymentAmount)) || 0
      const newPaid = (currentSubloan.paidAmount || 0) + amount
      const remaining = Math.max(0, effectiveTotalAmount - newPaid)
      setPaymentPreview({
        remainingAfterPayment: remaining,
        status: remaining < 0.01 ? 'PAID' : 'PARTIAL',
        isPartial: newPaid > 0 && remaining >= 0.01,
      })
    } else {
      setPaymentPreview(null)
    }
  }, [currentSubloan, paymentAmount, effectiveTotalAmount])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAmountChange = (raw: string) => {
    setHasUserEdited(true)
    setPaymentAmount(raw)
  }

  const handleAdjustEnabledChange = (checked: boolean) => {
    setAdjustEnabled(checked)
    if (!checked) {
      setAdjustedAmount('')
      if (currentSubloan && !hasUserEdited) {
        const pending = (currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)
        setPaymentAmount(pending > 0 ? numberToFormattedAmount(pending) : '')
      }
    } else if (currentSubloan) {
      setAdjustedAmount(numberToFormattedAmount(currentSubloan.totalAmount ?? 0))
    }
  }

  const handleRegisterPayment = async () => {
    if (!currentSubloan) return
    const amount = parseFloat(unformatAmount(paymentAmount)) || 0
    const pending = (currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)
    if (amount > pending) {
      setMultiPaymentConfirmOpen(true)
      return
    }
    await executePayment(amount)
  }

  const executePayment = async (amountValue: number) => {
    if (!currentSubloan) return
    setIsRegistering(true)
    try {
      const paymentResult = await paymentsService.registerPayment({
        subLoanId: currentSubloan.id ?? '',
        amount: amountValue,
        currency: 'ARS',
        paymentDate: new Date().toISOString().split('T')[0],
        description: notes || undefined,
        ...(adjustEnabled && adjustedAmount ? { adjustedTotalAmount: parseFloat(unformatAmount(adjustedAmount)) || undefined } : {}),
      })

      if (paymentResult) {
        try {
          await createIngresoFromPago(
            currentSubloan.id ?? '',
            amountValue,
            clientName,
            currentSubloan.paymentNumber ?? 0,
            new Date(),
          )
        } catch {
          // Payment registered — operativa entry is supplemental
        }

        const remaining = Math.max(0, ((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)) - amountValue)
        const newStatus = remaining === 0 ? 'PAID' : 'PARTIAL'

        let receiptDataToShow: PaymentReceiptData | null = null
        if (paymentResult.loan && paymentResult.loanSummary && paymentResult.subLoans) {
          receiptDataToShow = {
            payment: {
              id: paymentResult.payment.id,
              amount: paymentResult.payment.amount,
              paymentDate: new Date(paymentResult.payment.paymentDate),
              description: paymentResult.payment.description || undefined,
            },
            subLoan: {
              id: paymentResult.subLoan.id,
              paymentNumber: paymentResult.subLoan.paymentNumber,
              totalAmount: paymentResult.subLoan.totalAmount,
              status: paymentResult.subLoan.status,
              paidAmount: paymentResult.subLoan.paidAmount,
              pendingAmount: paymentResult.subLoan.remainingAmount,
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
                cuit: paymentResult.loan.client.cuit,
              },
            },
            loanSummary: paymentResult.loanSummary,
            subLoans: paymentResult.subLoans.map((sl) => ({
              id: sl.id,
              paymentNumber: sl.paymentNumber,
              amount: sl.amount,
              totalAmount: sl.totalAmount,
              status: sl.status,
              dueDate: new Date(sl.dueDate),
              paidDate: sl.paidDate ? new Date(sl.paidDate) : null,
              paidAmount: sl.paidAmount,
              pendingAmount: sl.pendingAmount,
              daysOverdue: sl.daysOverdue,
            })),
            notes: notes || undefined,
          }
        }

        if (generatePDF) {
          try {
            generatePaymentPDF(
              receiptDataToShow ?? {
                clientName,
                paymentNumber: paymentResult.subLoan.paymentNumber || (currentSubloan.paymentNumber ?? 0),
                amount: amountValue,
                paymentDate: new Date(),
                loanTrack: 'N/A',
                status: newStatus,
                remainingAmount: remaining,
                notes: notes || undefined,
              },
            )
          } catch {
            // PDF generation is best-effort
          }
        }

        setReceiptData(receiptDataToShow)
        setSuccessData({
          clientName,
          paymentNumber: paymentResult.subLoan.paymentNumber || (currentSubloan.paymentNumber ?? 0),
          amount: amountValue,
          paymentDate: new Date(),
          status: newStatus,
          remainingAmount: remaining,
          notes: notes || undefined,
          pdfGenerated: generatePDF,
        })
        setSuccessModalOpen(true)

        onPaymentSuccess?.()
      }
    } catch (error) {
      const errObj = error as Record<string, unknown>
      const responseData = (errObj?.response as Record<string, unknown>)?.data as Record<string, unknown> | undefined
      const msg = responseData?.message || errObj?.message || 'Error al registrar el pago. Por favor intenta nuevamente.'
      setErrorMessage(String(msg))
      setErrorModalOpen(true)
    } finally {
      setIsRegistering(false)
    }
  }

  const handleSuccessClose = () => {
    setSuccessModalOpen(false)
    setSuccessData(null)
    onClose()
  }

  // ── Form props ─────────────────────────────────────────────────────────────
  const formProps = {
    clientName,
    mode,
    currentSubloan,
    pendingSubloans,
    selectedSubloanId,
    paymentAmount,
    notes,
    generatePDF,
    adjustEnabled,
    adjustedAmount,
    effectiveTotalAmount,
    paymentPreview,
    isRegistering,
    onSubloanChange: setSelectedSubloanId,
    onAmountChange:  handleAmountChange,
    onNotesChange:   setNotes,
    onGeneratePDFChange: setGeneratePDF,
    onAdjustEnabledChange: handleAdjustEnabledChange,
    onAdjustedAmountChange: setAdjustedAmount,
    onRegister: handleRegisterPayment,
    onCancel:   onClose,
  }

  // Guard: no subloan in single mode → render nothing
  if (!currentSubloan && mode === 'single') return null

  // ── Shared header ──────────────────────────────────────────────────────────
  const header = (
    <Box
      sx={{
        pb: 2,
        pt: 3,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Payment sx={{ fontSize: 24, color: 'primary.main' }} />
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Registrar Pago
          </Typography>
          {mode === 'selector' && (
            <Typography variant="caption" color="text.secondary">
              Seleccioná la cuota a pagar
            </Typography>
          )}
        </Box>
      </Box>
      <IconButton onClick={onClose} size="small">
        <Close />
      </IconButton>
    </Box>
  )

  return (
    <>
      {/* ── Mobile: SwipeableDrawer ── */}
      {isMobile ? (
        <SwipeableDrawer
          anchor="bottom"
          open={open && !successModalOpen}
          onClose={sheetClose}
          onOpen={sheetOpen}
          disableSwipeToOpen
          sx={{ zIndex: 1400 }}
          PaperProps={{
            sx: {
              borderRadius:  '20px 20px 0 0',
              maxHeight:     '95dvh',
              overflow:      'hidden',
              display:       'flex',
              flexDirection: 'column',
            },
          }}
        >
          {/* Handle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5, flexShrink: 0 }}>
            <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: iosColors.gray3 }} />
          </Box>
          {header}
          <PaymentForm {...formProps} />
        </SwipeableDrawer>
      ) : (
        /* ── Desktop: Dialog ── */
        <Dialog
          open={open && !successModalOpen}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          scroll="paper"
          sx={{ zIndex: 1400 }}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              maxHeight: { xs: '100vh', sm: '90vh' },
              m: { xs: 0, sm: 2 },
              mt: { xs: 0, sm: 3 },
              width: { xs: '100%', sm: 'auto' },
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <DialogTitle sx={{ p: 0 }}>{header}</DialogTitle>
          <PaymentForm {...formProps} />
        </Dialog>
      )}

      {/* ── Multi-payment confirmation (shared) ── */}
      <Dialog
        open={multiPaymentConfirmOpen}
        onClose={() => setMultiPaymentConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 3 }, m: { xs: 1, sm: 2 }, mt: { xs: 'auto', sm: 2 } } }}
      >
        <DialogTitle sx={{ pb: 2, pt: 3, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Warning sx={{ fontSize: 24, color: 'warning.main' }} />
            <Typography variant="h6" fontWeight={600}>Confirmar Pago de Múltiples Cuotas</Typography>
          </Box>
          <IconButton onClick={() => setMultiPaymentConfirmOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {currentSubloan && (
            <>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                El monto a pagar es mayor al saldo pendiente de la cuota actual.
              </Typography>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={500}>Saldo pendiente cuota #{currentSubloan.paymentNumber}:</Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main">
                    {`$${formatAmount(String((currentSubloan.totalAmount ?? 0) - (currentSubloan.paidAmount || 0)))}`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={500}>Monto a pagar:</Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main">${formatAmount(paymentAmount)}</Typography>
                </Box>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>⚠️ Importante:</Typography>
                <Typography variant="body2">
                  Este pago completará la cuota actual y se aplicará el excedente a las siguientes cuotas pendientes.
                </Typography>
              </Alert>
              <Typography variant="body2" color="text.secondary">¿Deseas continuar con el registro del pago?</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, gap: 2 }}>
          <Button onClick={() => setMultiPaymentConfirmOpen(false)} variant="outlined" sx={{ minWidth: 120 }}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              setMultiPaymentConfirmOpen(false)
              await executePayment(parseFloat(unformatAmount(paymentAmount)))
            }}
            variant="contained"
            color="primary"
            sx={{ minWidth: 120 }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Error modal ── */}
      <PaymentErrorModal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        errorMessage={errorMessage}
        onRetry={() => { setErrorModalOpen(false); setErrorMessage('') }}
      />

      {/* ── Success modal (portal) ── */}
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
          receiptData={receiptData}
        />,
        document.body,
      )}
    </>
  )
}

export default PaymentModal
