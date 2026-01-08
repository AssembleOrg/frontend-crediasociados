'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Grid
} from '@mui/material'
import { 
  CheckCircle, 
  Close, 
  Receipt,
  Warning,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material'
import { formatCurrencyDisplay } from '@/lib/formatters'
import type { PaymentReceiptData } from '@/utils/pdf/paymentReceipt'

interface PaymentReceiptModalProps {
  open: boolean
  onClose: () => void
  data: PaymentReceiptData | null
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'PAID': return 'Pagada'
    case 'PARTIAL': return 'Parcial'
    case 'PENDING': return 'Pendiente'
    case 'OVERDUE': return 'Vencida'
    default: return status
  }
}

const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'PAID': return 'success'
    case 'PARTIAL': return 'warning'
    case 'OVERDUE': return 'error'
    case 'PENDING': return 'default'
    default: return 'default'
  }
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateLong = (date: Date): string => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  open,
  onClose,
  data
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  console.log('PaymentReceiptModal render - open:', open, 'data:', !!data)

  // Log when props change
  useEffect(() => {
    console.log('PaymentReceiptModal useEffect - open changed to:', open, 'data:', !!data)
  }, [open, data])

  if (!data || !open) {
    console.log('PaymentReceiptModal returning null - open:', open, 'hasData:', !!data)
    return null
  }

  const hasPendingDebt = data.loanSummary.totalPendiente > 0
  const hasOverduePayments = data.subLoans.some(s => s.status === 'OVERDUE')
  const isPaid = data.subLoan.status === 'PAID'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      sx={{
        zIndex: 1400 // Higher than default Modal (1300) to appear above other modals
      }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '90vh',
          m: { xs: 0, sm: 2 },
          zIndex: 1400
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1A4089 0%, #1565c0 100%)',
          color: 'white',
          py: 2,
          px: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Receipt sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" component="div" fontWeight={600}>
              COMPROBANTE DE PAGO
            </Typography>
            <Typography variant="caption" component="div" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
              {isPaid ? 'Pago Completo' : 'Pago Parcial'}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Client & Loan Info */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  CLIENTE
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {data.loan.client.fullName}
                </Typography>
                {(data.loan.client.dni || data.loan.client.cuit) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {data.loan.client.dni ? `DNI: ${data.loan.client.dni}` : ''}
                    {data.loan.client.dni && data.loan.client.cuit ? ' • ' : ''}
                    {data.loan.client.cuit ? `CUIT: ${data.loan.client.cuit}` : ''}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  PRÉSTAMO
                </Typography>
                <Typography variant="body1" fontWeight={600} color="primary.main">
                  {data.loan.loanTrack}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Cuota abonada: #{data.subLoan.paymentNumber} de {data.loanSummary.totalCuotas}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Payment Details */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: 2,
              borderColor: isPaid ? 'success.main' : 'warning.main',
              borderRadius: 2,
              bgcolor: 'white'
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  MONTO ABONADO
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color={isPaid ? 'success.main' : 'warning.main'}
                >
                  {formatCurrencyDisplay(data.payment.amount)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  FECHA DE PAGO
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {formatDateLong(data.payment.paymentDate)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {new Date(data.payment.paymentDate).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  ESTADO CUOTA
                </Typography>
                <Chip
                  label={getStatusLabel(data.subLoan.status)}
                  color={getStatusColor(data.subLoan.status)}
                  size="medium"
                  sx={{ fontWeight: 600 }}
                />
              </Grid>
              {data.subLoan.pendingAmount > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    SALDO PENDIENTE DE ESTA CUOTA
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="warning.main">
                    {formatCurrencyDisplay(data.subLoan.pendingAmount)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Pending Debt Alert */}
          {hasPendingDebt && (
            <Alert
              severity={hasOverduePayments ? 'error' : 'warning'}
              icon={<Warning />}
              sx={{
                borderRadius: 2,
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {hasOverduePayments
                  ? '⚠️ ATENCIÓN: CLIENTE CON CUOTAS VENCIDAS'
                  : '⚠️ DEUDA PENDIENTE'}
              </Typography>
              <Typography variant="body2">
                Saldo pendiente del préstamo: <strong>{formatCurrencyDisplay(data.loanSummary.totalPendiente)}</strong>
              </Typography>
              {hasOverduePayments && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Cuotas vencidas: <strong>{data.subLoans.filter(s => s.status === 'OVERDUE').length}</strong>
                </Typography>
              )}
            </Alert>
          )}

          {/* Loan Summary */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              RESUMEN DEL PRÉSTAMO
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  MONTO PRESTADO
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                  {formatCurrencyDisplay(data.loanSummary.montoPrestado)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  TOTAL A DEVOLVER
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                  {formatCurrencyDisplay(data.loanSummary.totalADevolver)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  TOTAL PAGADO
                </Typography>
                <Typography variant="body1" fontWeight={600} color="success.main" sx={{ mt: 0.5 }}>
                  {formatCurrencyDisplay(data.loanSummary.saldoPagadoTotal)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  SALDO PENDIENTE
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color={data.loanSummary.totalPendiente > 0 ? 'error.main' : 'success.main'}
                  sx={{ mt: 0.5 }}
                >
                  {formatCurrencyDisplay(data.loanSummary.totalPendiente)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Installments Table */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              DETALLE DE CUOTAS
            </Typography>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                maxHeight: 400,
                overflow: 'auto'
              }}
            >
              <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Vencimiento</TableCell>
                    {!isMobile && (
                      <>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Monto</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Pagado</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Pendiente</TableCell>
                      </>
                    )}
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.subLoans.map((subLoan, index) => {
                    const isCurrentPayment = subLoan.id === data.subLoan.id
                    return (
                      <TableRow
                        key={subLoan.id}
                        sx={{
                          bgcolor: isCurrentPayment ? 'action.selected' : index % 2 === 0 ? 'grey.50' : 'white',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={isCurrentPayment ? 600 : 400}>
                            {subLoan.paymentNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(subLoan.dueDate)}</Typography>
                          {isMobile && (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Monto: {formatCurrencyDisplay(subLoan.totalAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Pagado: {formatCurrencyDisplay(subLoan.paidAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Pendiente: {formatCurrencyDisplay(subLoan.pendingAmount)}
                              </Typography>
                            </>
                          )}
                        </TableCell>
                        {!isMobile && (
                          <>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatCurrencyDisplay(subLoan.totalAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="success.main">
                                {formatCurrencyDisplay(subLoan.paidAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                color={subLoan.pendingAmount > 0 ? 'error.main' : 'success.main'}
                                fontWeight={subLoan.pendingAmount > 0 ? 600 : 400}
                              >
                                {formatCurrencyDisplay(subLoan.pendingAmount)}
                              </Typography>
                            </TableCell>
                          </>
                        )}
                        <TableCell align="center">
                          <Chip
                            label={getStatusLabel(subLoan.status)}
                            color={getStatusColor(subLoan.status)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Installments Summary */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              RESUMEN DE CUOTAS
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  TOTAL CUOTAS
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
                  {data.loanSummary.totalCuotas}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  PAGADAS
                </Typography>
                <Typography variant="h6" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>
                  {data.loanSummary.cuotasPagadasTotales}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  PARCIALES
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color={data.loanSummary.cuotasPagadasParciales > 0 ? 'warning.main' : 'text.secondary'}
                  sx={{ mt: 0.5 }}
                >
                  {data.loanSummary.cuotasPagadasParciales}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  PENDIENTES
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color={data.loanSummary.cuotasNoPagadas > 0 ? 'error.main' : 'success.main'}
                  sx={{ mt: 0.5 }}
                >
                  {data.loanSummary.cuotasNoPagadas}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Notes */}
          {(data.notes || data.payment.description) && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'info.lighter',
                border: 1,
                borderColor: 'info.light',
                borderRadius: 2
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                OBSERVACIONES
              </Typography>
              <Typography variant="body2">
                {data.payment.description || data.notes}
              </Typography>
            </Paper>
          )}

          {/* Footer Info */}
          <Box
            sx={{
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1
            }}
          >
            <Typography variant="caption" color="text.secondary">
              ✓ Este comprobante es válido como constancia de pago
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Generado el {new Date().toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          size="large"
          sx={{ minWidth: 120 }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentReceiptModal

