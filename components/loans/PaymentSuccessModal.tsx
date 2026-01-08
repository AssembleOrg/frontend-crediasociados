'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid
} from '@mui/material'
import { CheckCircle as SuccessIcon, Warning, Receipt } from '@mui/icons-material'
import { formatCurrencyDisplay } from '@/lib/formatters'
import type { PaymentReceiptData } from '@/utils/pdf/paymentReceipt'

interface PaymentSuccessModalProps {
  open: boolean
  onClose: () => void
  // Simple mode props
  clientName?: string
  paymentNumber?: number
  amount?: number
  paymentDate?: Date
  status?: 'PARTIAL' | 'PAID'
  remainingAmount?: number
  notes?: string
  pdfGenerated?: boolean
  // Full receipt data (takes precedence)
  receiptData?: PaymentReceiptData | null
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  open,
  onClose,
  clientName,
  paymentNumber,
  amount,
  paymentDate,
  status,
  remainingAmount,
  notes,
  pdfGenerated = false,
  receiptData
}) => {
  // Use receipt data if available, otherwise use simple props
  const hasFullData = !!receiptData
  const displayClientName = receiptData?.loan.client.fullName || clientName || 'Cliente'
  const displayPaymentNumber = receiptData?.subLoan.paymentNumber || paymentNumber || 0
  const displayAmount = receiptData?.payment.amount || amount || 0
  const displayDate = receiptData?.payment.paymentDate || paymentDate || new Date()
  const displayStatus = receiptData?.subLoan.status || status || 'PARTIAL'
  const displayRemaining = receiptData?.loanSummary.totalPendiente || remainingAmount || 0
  const displayNotes = receiptData?.notes || notes
  const loanTrack = receiptData?.loan.loanTrack || 'N/A'
  const hasPendingDebt = receiptData ? receiptData.loanSummary.totalPendiente > 0 : (displayRemaining > 0)
  const overdueSubLoans = receiptData ? receiptData.subLoans.filter(s => s.status === 'OVERDUE') : []
  const hasOverduePayments = overdueSubLoans.length > 0

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={hasFullData ? "lg" : "sm"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1,
          pt: 2.5,
          px: 3,
          borderBottom: 1,
          borderColor: 'divider',
          fontWeight: 600
        }}
      >
        <SuccessIcon
          sx={{
            color: 'success.main',
            fontSize: 28
          }}
        />
        ✅ Pago registrado exitosamente
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Success Alert */}
          <Alert
            severity="success"
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            <Typography variant="body2">
              El pago ha sido registrado en el sistema correctamente.
            </Typography>
          </Alert>

          {/* Pending Debt Warning */}
          {hasPendingDebt && (
            <Alert
              severity={hasOverduePayments ? "error" : "warning"}
              variant="outlined"
              icon={<Warning />}
              sx={{ borderRadius: 1 }}
            >
              <Typography variant="body2" fontWeight={600}>
                {hasOverduePayments ? "🔴 Deuda Pendiente con Cuotas Vencidas" : "⚠️ Deuda Pendiente"}: {formatCurrencyDisplay(displayRemaining)}
              </Typography>
              {hasOverduePayments && overdueSubLoans.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                    Cuotas vencidas ({overdueSubLoans.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {overdueSubLoans.map((subLoan) => (
                      <Box
                        key={subLoan.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1,
                          bgcolor: 'error.lighter',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'error.light'
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            Cuota #{subLoan.paymentNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Vencida {subLoan.daysOverdue > 0 ? `hace ${subLoan.daysOverdue} día${subLoan.daysOverdue > 1 ? 's' : ''}` : 'hoy'}
                            {subLoan.dueDate && ` • Vencimiento: ${new Date(subLoan.dueDate).toLocaleDateString('es-AR')}`}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600} color="error.main">
                          {formatCurrencyDisplay(subLoan.pendingAmount)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              {!hasOverduePayments && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  Hay cuotas pendientes de pago.
                </Typography>
              )}
            </Alert>
          )}

          {/* Payment Details Card */}
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1.5,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2
            }}
          >
            {/* Row 1 */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                CLIENTE
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {displayClientName}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                PRÉSTAMO
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {loanTrack}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                CUOTA #
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {displayPaymentNumber}
              </Typography>
            </Box>

            {/* Row 2 */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                MONTO PAGADO
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, color: 'success.main' }}>
                {formatCurrencyDisplay(displayAmount)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                FECHA
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {displayDate instanceof Date ? displayDate.toLocaleDateString('es-AR') : new Date(displayDate).toLocaleDateString('es-AR')}
              </Typography>
            </Box>

            {/* Row 3 - Status & Remaining */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                ESTADO
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={displayStatus === 'PAID' ? 'Pagada' : displayStatus === 'PARTIAL' ? 'Parcial' : displayStatus === 'OVERDUE' ? 'Vencida' : 'Pendiente'}
                  color={displayStatus === 'PAID' ? 'success' : displayStatus === 'OVERDUE' ? 'error' : 'warning'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            {hasPendingDebt && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  SALDO PENDIENTE
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'warning.main', fontWeight: 600 }}>
                  {formatCurrencyDisplay(displayRemaining)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Full Receipt Data - Loan Summary */}
          {hasFullData && receiptData && (
            <>
              <Divider />
              <Box>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Receipt fontSize="small" />
                  Resumen del Préstamo
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Monto Prestado
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrencyDisplay(receiptData.loanSummary.montoPrestado)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Total a Devolver
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrencyDisplay(receiptData.loanSummary.totalADevolver)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Total Pagado
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {formatCurrencyDisplay(receiptData.loanSummary.saldoPagadoTotal)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Total Pendiente
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="warning.main">
                      {formatCurrencyDisplay(receiptData.loanSummary.totalPendiente)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Cuotas Pagadas
                    </Typography>
                    <Typography variant="body2">
                      {receiptData.loanSummary.cuotasPagadasTotales} / {receiptData.loanSummary.totalCuotas}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Cuotas Pendientes
                    </Typography>
                    <Typography variant="body2" color="warning.main">
                      {receiptData.loanSummary.cuotasNoPagadas}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}

          {/* Notes */}
          {displayNotes && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'info.lighter',
                border: 1,
                borderColor: 'info.light',
                borderRadius: 1
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                NOTAS
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {displayNotes}
              </Typography>
            </Box>
          )}

          {/* PDF Status */}
          {pdfGenerated && (
            <Alert severity="info" variant="outlined" sx={{ borderRadius: 1 }}>
              <Typography variant="body2">
                📄 Comprobante de pago descargado automáticamente
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{ minWidth: 120 }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentSuccessModal
