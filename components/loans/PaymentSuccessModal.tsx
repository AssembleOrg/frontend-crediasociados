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
  Grid,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material'
import { CheckCircle as SuccessIcon, Warning, Receipt, Close } from '@mui/icons-material'
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

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={hasFullData ? "lg" : "sm"}
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown={false}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          boxShadow: 3,
          maxHeight: isMobile ? '100vh' : '90vh',
          m: isMobile ? 0 : 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: isMobile ? 'flex-end' : 'center'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          pb: { xs: 1.5, sm: 1 },
          pt: { xs: 2, sm: 2.5 },
          px: { xs: 2, sm: 3 },
          borderBottom: 1,
          borderColor: 'divider',
          fontWeight: 600,
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
          <SuccessIcon
            sx={{
              color: 'success.main',
              fontSize: { xs: 24, sm: 28 },
              flexShrink: 0
            }}
          />
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            ✅ Pago registrado exitosamente
          </Typography>
        </Box>
        {isMobile && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ ml: 1, flexShrink: 0 }}
          >
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent
        sx={{
          pt: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
          overflow: 'auto',
          flex: 1,
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '4px'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, sm: 2.5 },
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >
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
                  <Typography
                    variant={isMobile ? "body2" : "caption"}
                    fontWeight={600}
                    sx={{ display: 'block', mb: 1 }}
                  >
                    Cuotas vencidas ({overdueSubLoans.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {overdueSubLoans.map((subLoan) => (
                      <Box
                        key={subLoan.id}
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: { xs: 0.5, sm: 0 },
                          p: { xs: 1.5, sm: 1 },
                          bgcolor: 'error.lighter',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'error.light',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                          <Typography
                            variant={isMobile ? "body1" : "body2"}
                            fontWeight={600}
                            sx={{ mb: 0.5 }}
                          >
                            Cuota #{subLoan.paymentNumber}
                          </Typography>
                          <Typography
                            variant={isMobile ? "body2" : "caption"}
                            color="text.secondary"
                            sx={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word'
                            }}
                          >
                            Vencida {subLoan.daysOverdue > 0 ? `hace ${subLoan.daysOverdue} día${subLoan.daysOverdue > 1 ? 's' : ''}` : 'hoy'}
                            {subLoan.dueDate && (
                              <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>
                                {' '}• Vencimiento: {new Date(subLoan.dueDate).toLocaleDateString('es-AR')}
                              </Box>
                            )}
                          </Typography>
                        </Box>
                        <Typography
                          variant={isMobile ? "h6" : "body2"}
                          fontWeight={600}
                          color="error.main"
                          sx={{
                            flexShrink: 0,
                            mt: { xs: 0.5, sm: 0 },
                            alignSelf: { xs: 'flex-end', sm: 'auto' }
                          }}
                        >
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
              p: { xs: 2, sm: 2.5 },
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'divider',
              borderRadius: { xs: 1, sm: 1.5 },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: { xs: 1.5, sm: 2 },
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
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
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  <Grid item xs={6} sm={4} md={3}>
                    <Typography variant={isMobile ? "body2" : "caption"} color="text.secondary" sx={{ mb: 0.5 }}>
                      Monto Prestado
                    </Typography>
                    <Typography variant={isMobile ? "body1" : "body2"} fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                      {formatCurrencyDisplay(receiptData.loanSummary.montoPrestado)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Typography variant={isMobile ? "body2" : "caption"} color="text.secondary" sx={{ mb: 0.5 }}>
                      Total a Devolver
                    </Typography>
                    <Typography variant={isMobile ? "body1" : "body2"} fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                      {formatCurrencyDisplay(receiptData.loanSummary.totalADevolver)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Typography variant={isMobile ? "body2" : "caption"} color="text.secondary" sx={{ mb: 0.5 }}>
                      Total Pagado
                    </Typography>
                    <Typography variant={isMobile ? "body1" : "body2"} fontWeight={600} color="success.main" sx={{ wordBreak: 'break-word' }}>
                      {formatCurrencyDisplay(receiptData.loanSummary.saldoPagadoTotal)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Typography variant={isMobile ? "body2" : "caption"} color="text.secondary" sx={{ mb: 0.5 }}>
                      Total Pendiente
                    </Typography>
                    <Typography variant={isMobile ? "body1" : "body2"} fontWeight={600} color="warning.main" sx={{ wordBreak: 'break-word' }}>
                      {formatCurrencyDisplay(receiptData.loanSummary.totalPendiente)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Typography variant={isMobile ? "body2" : "caption"} color="text.secondary" sx={{ mb: 0.5 }}>
                      Cuotas Pagadas
                    </Typography>
                    <Typography variant={isMobile ? "body1" : "body2"} sx={{ wordBreak: 'break-word' }}>
                      {receiptData.loanSummary.cuotasPagadasTotales} / {receiptData.loanSummary.totalCuotas}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Typography variant={isMobile ? "body2" : "caption"} color="text.secondary" sx={{ mb: 0.5 }}>
                      Cuotas Pendientes
                    </Typography>
                    <Typography variant={isMobile ? "body1" : "body2"} color="warning.main" sx={{ wordBreak: 'break-word' }}>
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

      <DialogActions
        sx={{
          p: { xs: 2, sm: 2.5 },
          pt: { xs: 1.5, sm: 2.5 },
          borderTop: 1,
          borderColor: 'divider',
          position: 'sticky',
          bottom: 0,
          bgcolor: 'background.paper',
          zIndex: 1
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          fullWidth={isMobile}
          sx={{
            minWidth: { xs: '100%', sm: 120 },
            py: { xs: 1.5, sm: 1 }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentSuccessModal
