'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
  IconButton,
  Paper,
} from '@mui/material'
import { Payment, Refresh, Warning, Close } from '@mui/icons-material'
import LoanTimeline from '@/components/loans/LoanTimeline'
import { PaymentModal } from '@/components/loans/PaymentModal'
import { 
  calculateTotalRepaymentAmount,
  calculateInterestAmount,
  formatInterestRate,
  getLoanStatusInfo 
} from '@/lib/loans/loanCalculations'
import { getFrequencyLabel } from '@/lib/formatters'
import { paymentsService } from '@/services/payments.service'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import type { Loan } from '@/types/auth'

interface LoanDetailsModalProps {
  open: boolean
  onClose: () => void
  loan: Loan | null
  subLoans: SubLoanWithClientInfo[]
  isLoading?: boolean
  onGoToCobros?: () => void
  onPaymentSuccess?: () => void // Callback para refrescar datos después del pago
}

export default function LoanDetailsModal({
  open,
  onClose,
  loan,
  subLoans,
  isLoading = false,
  onPaymentSuccess
}: LoanDetailsModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedSubloan, setSelectedSubloan] = useState<SubLoanWithClientInfo | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [resettingSubloanId, setResettingSubloanId] = useState<string | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetConfirmModalOpen, setResetConfirmModalOpen] = useState(false)
  const [subloanToReset, setSubloanToReset] = useState<SubLoanWithClientInfo | null>(null)
  if (!loan) return null

  const clientName = subLoans.length > 0 
    ? subLoans[0].clientName || `Cliente #${loan.clientId}`
    : `Cliente #${loan.clientId}`

  // Use originalAmount if available, otherwise fallback to calculations
  const principalAmount = loan.originalAmount ?? loan.amount
  const totalAmountToRepay = loan.originalAmount !== undefined ? loan.amount : calculateTotalRepaymentAmount(loan)
  const interestAmount = loan.originalAmount !== undefined 
    ? loan.amount - loan.originalAmount 
    : calculateInterestAmount(loan)
  const statusInfo = getLoanStatusInfo(loan.status)

  // Calculate remaining amount and payments
  // Use sum of subloans totalAmount for accurate remaining calculation
  const totalSubLoansAmount = subLoans.reduce((sum, subloan) => sum + (subloan.totalAmount || 0), 0)
  const totalPaid = subLoans.reduce((sum, subloan) => sum + (subloan.paidAmount || 0), 0)
  
  // If no subloans loaded, use loan data as fallback
  const hasSubLoans = subLoans.length > 0
  const remainingAmount = hasSubLoans 
    ? totalSubLoansAmount - totalPaid
    : (totalAmountToRepay - totalPaid)
  const remainingPayments = hasSubLoans
    ? subLoans.filter(subloan => 
        subloan.status === 'PENDING' || subloan.status === 'OVERDUE'
      ).length
    : (loan.totalPayments || 0)

  // Sort subloans by payment number
  const sortedSubLoans = [...subLoans].sort((a, b) => (a.paymentNumber ?? 0) - (b.paymentNumber ?? 0))

  // Validar que no se pueda pagar una cuota si hay anteriores sin pagar
  const canPaySubloan = (subloan: SubLoanWithClientInfo): { canPay: boolean; reason?: string } => {
    // No permitir pagar subpréstamos ya pagados
    if (subloan.status === 'PAID') {
      return { canPay: false, reason: 'Esta cuota ya está pagada' }
    }

    // Buscar si hay cuotas anteriores sin ningún pago (PARTIAL ya tiene saldo abonado, se permite continuar)
    const currentPaymentNumber = subloan.paymentNumber ?? 0
    const previousUnpaid = sortedSubLoans.find(s =>
      (s.paymentNumber ?? 0) < currentPaymentNumber &&
      s.status !== 'PAID' &&
      s.status !== 'PARTIAL'
    )

    if (previousUnpaid) {
      return {
        canPay: false,
        reason: `La cuota #${previousUnpaid.paymentNumber} está pendiente de pago. Saldá esa cuota primero.`
      }
    }

    return { canPay: true }
  }

  const handlePaymentClick = (subloan: SubLoanWithClientInfo) => {
    const validation = canPaySubloan(subloan)
    
    if (!validation.canPay) {
      setPaymentError(validation.reason || 'No se puede pagar esta cuota')
      setTimeout(() => setPaymentError(null), 5000)
      return
    }

    setSelectedSubloan(subloan)
    setPaymentModalOpen(true)
    setPaymentError(null)
  }

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false)
    setSelectedSubloan(null)
    onPaymentSuccess?.()
  }

  const handleResetPayments = (subloan: SubLoanWithClientInfo) => {
    if (!subloan.id) return
    setSubloanToReset(subloan)
    setResetConfirmModalOpen(true)
  }

  const handleConfirmReset = async () => {
    if (!subloanToReset?.id) return

    setResettingSubloanId(subloanToReset.id)
    setResetError(null)
    setResetConfirmModalOpen(false)

    try {
      await paymentsService.resetPayments(subloanToReset.id)
      // Refrescar datos después del reset
      onPaymentSuccess?.()
      setSubloanToReset(null)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al resetear los pagos'
      setResetError(errorMessage)
      setTimeout(() => setResetError(null), 5000)
    } finally {
      setResettingSubloanId(null)
    }
  }

  const handleCancelReset = () => {
    setResetConfirmModalOpen(false)
    setSubloanToReset(null)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          width: { sm: '95vw', md: '95vw' },
          maxWidth: '1800px',
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: { xs: 'calc(100dvh - 96px)', sm: '90vh' },
          m: { xs: 1, sm: 2 },
          mt: { xs: 'auto', sm: 2 },
        },
      }}
    >
      <DialogTitle sx={{ pb: 2, pt: 3, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Payment sx={{ fontSize: 24, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>Detalles del Préstamo</Typography>
            <Typography variant="caption" color="text.secondary">{clientName} · {loan.loanTrack}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Cargando detalles del préstamo...
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Loan Summary Header */}
            <Paper elevation={0} sx={{ mb: { xs: 2, sm: 3 }, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
              <Box sx={{ p: { xs: 1.5, sm: 3 } }}>

              {/* Remaining Summary - Highlighted */}
              {remainingPayments > 0 && (
                <Paper elevation={0} sx={{ mt: 2, mb: 3, bgcolor: '#FFFFFF', borderLeft: 4, borderLeftColor: 'primary.main', overflow: 'hidden' }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body1" fontWeight={700} color="primary.main">
                      Resta pagar ${remainingAmount.toLocaleString()} en {remainingPayments} {remainingPayments === 1 ? 'cuota' : 'cuotas'}
                    </Typography>
                  </Box>
                </Paper>
              )}

              {remainingPayments === 0 && (
                <Paper elevation={0} sx={{ mt: 2, mb: 3, bgcolor: '#FFFFFF', borderLeft: 4, borderLeftColor: 'success.main', overflow: 'hidden' }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body1" fontWeight={700} color="success.main">
                      ✓ Préstamo completado · Total pagado: ${totalPaid.toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
              )}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(auto-fit, minmax(150px, 1fr))' },
                  gap: { xs: 1.5, sm: 3 },
                  mt: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">Monto</Typography>
                  <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight="bold">
                    ${principalAmount.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Tasa</Typography>
                  <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight="bold" color="primary.main">
                    {formatInterestRate(loan)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Intereses</Typography>
                  <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight="bold" color="warning.main">
                    ${interestAmount.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Estado</Typography>
                  <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight="bold" color={`${statusInfo.color}.main`}>
                    {statusInfo.label}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Cuotas</Typography>
                  <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight="bold">
                    {loan.totalPayments} ({getFrequencyLabel(loan.paymentFrequency)})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Creado</Typography>
                  <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight="bold">
                    {new Date(loan.createdAt).toLocaleDateString('es-AR')}
                  </Typography>
                </Box>
              </Box>
              </Box>
            </Paper>

            {/* Error Alerts */}
            {paymentError && (
              <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setPaymentError(null)}>
                {paymentError}
              </Alert>
            )}
            {resetError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setResetError(null)}>
                {resetError}
              </Alert>
            )}

            {/* Timeline Component */}
            {isLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Cargando cuotas...
                </Typography>
              </Box>
            ) : subLoans.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 2, p: 3 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No hay cuotas registradas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Este préstamo aún no tiene cuotas generadas. Las cuotas se crean automáticamente al crear el préstamo.
                </Typography>
              </Box>
            ) : (
              <LoanTimeline
                clientName={clientName}
                subLoans={subLoans}
                compact={false}
                onPaymentClick={handlePaymentClick}
                onResetClick={handleResetPayments}
                resettingSubloanId={resettingSubloanId}
                onDateUpdated={onPaymentSuccess}
              />
            )}

            {/* Actions Section */}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
        <Button onClick={onClose} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Cerrar
        </Button>
      </DialogActions>

      {/* Payment Modal */}
      {selectedSubloan && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false)
            setSelectedSubloan(null)
          }}
          subloan={selectedSubloan}
          clientName={clientName}
          mode="single"
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Reset Confirmation Modal */}
      <Dialog
        open={resetConfirmModalOpen}
        onClose={handleCancelReset}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 3 },
            m: { xs: 1, sm: 2 },
            mt: { xs: 'auto', sm: 2 },
            width: { xs: '100%', sm: 'auto' }
          }
        }}
        sx={{ '& .MuiDialog-container': { alignItems: { xs: 'flex-end', sm: 'center' } } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 1.5,
            pt: 2,
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Warning sx={{ color: 'warning.main', fontSize: 22, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              Resetear cuota #{subloanToReset?.paymentNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Esta acción no se puede deshacer
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 2, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              'Todos los pagos registrados de esta cuota',
              'Los efectos en las wallets (créditos revertidos)',
              'Los registros de ruta del día, si aplica',
            ].map((item) => (
              <Box
                key={item}
                sx={{ pl: 1.5, py: 0.5, borderLeft: '3px solid', borderColor: 'warning.main' }}
              >
                <Typography variant="body2" color="text.secondary">{item}</Typography>
              </Box>
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Solo disponible si el último pago fue en las últimas 24 horas.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2,
            pt: 1,
            pb: 'calc(16px + env(safe-area-inset-bottom))',
            gap: 1,
            borderTop: 1,
            borderColor: 'divider'
          }}
        >
          <Button onClick={handleCancelReset} variant="outlined" fullWidth>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmReset}
            variant="contained"
            color="warning"
            fullWidth
            startIcon={<Refresh />}
            disabled={resettingSubloanId === subloanToReset?.id}
          >
            {resettingSubloanId === subloanToReset?.id ? 'Reseteando...' : 'Resetear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}