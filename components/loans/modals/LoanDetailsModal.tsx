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
} from '@mui/material'
import { Payment, Refresh, Warning } from '@mui/icons-material'
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
  const remainingAmount = totalSubLoansAmount - totalPaid
  const remainingPayments = subLoans.filter(subloan => 
    subloan.status === 'PENDING' || subloan.status === 'OVERDUE'
  ).length

  // Sort subloans by payment number
  const sortedSubLoans = [...subLoans].sort((a, b) => (a.paymentNumber ?? 0) - (b.paymentNumber ?? 0))

  // Validar que no se pueda pagar una cuota si hay anteriores sin pagar
  const canPaySubloan = (subloan: SubLoanWithClientInfo): { canPay: boolean; reason?: string } => {
    // No permitir pagar subpréstamos ya pagados
    if (subloan.status === 'PAID') {
      return { canPay: false, reason: 'Esta cuota ya está pagada' }
    }

    // Buscar si hay cuotas anteriores sin pagar
    const currentPaymentNumber = subloan.paymentNumber ?? 0
    const previousUnpaid = sortedSubLoans.find(s => 
      (s.paymentNumber ?? 0) < currentPaymentNumber && 
      s.status !== 'PAID'
    )

    if (previousUnpaid) {
      return { 
        canPay: false, 
        reason: `No se puede pagar la cuota #${currentPaymentNumber} sin pagar primero la cuota #${previousUnpaid.paymentNumber}` 
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
          width: { xs: '95vw', sm: '95vw', md: '95vw' },
          height: { xs: '90vh', sm: 'auto' },
          maxWidth: '1800px',
          m: { xs: 1, sm: 2 },
          borderRadius: { xs: 2, sm: 3 },
        },
      }}
    >
      <DialogTitle sx={{ pt: 2.5, px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Payment color="primary" />
          <Typography variant="h6">Detalles del Préstamo</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Cargando detalles del préstamo...
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Loan Summary Header */}
            <Box sx={{ mb: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {clientName} - {loan.loanTrack}
              </Typography>

              {/* Remaining Summary - Highlighted */}
              {remainingPayments > 0 && (
                <Box sx={{ 
                  mt: 2, 
                  mb: 3, 
                  p: 2, 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  borderRadius: 2,
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight="bold">
                    Resta pagar ${remainingAmount.toLocaleString()} en {remainingPayments} {remainingPayments === 1 ? 'cuota' : 'cuotas'}
                  </Typography>
                </Box>
              )}

              {remainingPayments === 0 && (
                <Box sx={{ 
                  mt: 2, 
                  mb: 3, 
                  p: 2, 
                  bgcolor: 'success.main', 
                  color: 'white',
                  borderRadius: 2,
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight="bold">
                    ✓ Préstamo completado - Total pagado: ${totalPaid.toLocaleString()}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 3,
                  mt: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Monto del préstamo
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ${principalAmount.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tasa de interés
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {formatInterestRate(loan)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total de intereses
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    ${interestAmount.toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estado
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color={`${statusInfo.color}.main`}>
                    {statusInfo.label}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total cuotas
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {loan.totalPayments}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Frecuencia
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {getFrequencyLabel(loan.paymentFrequency)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de creación
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {new Date(loan.createdAt).toLocaleDateString('es-AR')}
                  </Typography>
                </Box>
              </Box>
            </Box>

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
            <LoanTimeline
              clientName={clientName}
              subLoans={subLoans}
              compact={false}
              onPaymentClick={handlePaymentClick}
              onResetClick={handleResetPayments}
              resettingSubloanId={resettingSubloanId}
            />

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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Warning color="warning" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">
              Confirmar Reseteo de Pagos
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            ¿Está seguro de resetear todos los pagos de la cuota #{subloanToReset?.paymentNumber}?
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Esta acción eliminará:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>Todos los pagos registrados de esta cuota</li>
              <li>Los efectos en las wallets (se revertirán los créditos)</li>
              <li>Los registros de la ruta del día (si aplica)</li>
            </Typography>
          </Alert>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> Solo se puede resetear si el último pago fue realizado en las últimas 24 horas.
            </Typography>
          </Alert>

          <Alert severity="error">
            <Typography variant="body2" fontWeight="bold">
              ⚠️ Esta acción no se puede deshacer.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleCancelReset}
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmReset}
            variant="contained"
            color="warning"
            startIcon={<Refresh />}
            disabled={resettingSubloanId === subloanToReset?.id}
            sx={{ minWidth: 120 }}
          >
            {resettingSubloanId === subloanToReset?.id ? 'Reseteando...' : 'Resetear Pagos'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}