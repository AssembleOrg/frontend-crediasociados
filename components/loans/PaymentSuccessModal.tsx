'use client'

import React from 'react'
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
  Collapse,
  Divider,
  Paper,
  Grid,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material'
import { CheckCircle as SuccessIcon, Warning, Receipt, Close, ExpandMore, ExpandLess } from '@mui/icons-material'
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
  const [overdueOpen, setOverdueOpen] = React.useState(false)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={hasFullData ? "lg" : "sm"}
      fullWidth
      sx={{
        zIndex: 1500,
        '& .MuiDialog-container': {
          alignItems: { xs: 'flex-end', sm: 'center' },
        },
      }}
      disableEscapeKeyDown={false}
      PaperProps={{
        sx: {
          borderRadius: { xs: '16px 16px 0 0', sm: 3 },
          maxHeight: { xs: '92dvh', sm: '90vh' },
          m: 0,
          mt: 'auto',
          mx: { sm: 2 },
          mb: { sm: 2 },
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
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
            Pago registrado exitosamente
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
          pb: 'calc(24px + env(safe-area-inset-bottom))',
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
            <Box
              sx={{
                border: '1px solid',
                borderColor: hasOverduePayments ? 'error.light' : 'warning.light',
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <Box
                onClick={hasOverduePayments ? () => setOverdueOpen(v => !v) : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: 1,
                  cursor: hasOverduePayments ? 'pointer' : 'default',
                  userSelect: 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning fontSize="small" sx={{ color: hasOverduePayments ? 'error.main' : 'warning.main', flexShrink: 0 }} />
                  <Typography variant="body2" fontWeight={600} color={hasOverduePayments ? 'error.main' : 'warning.main'}>
                    {hasOverduePayments
                      ? `Cuotas vencidas (${overdueSubLoans.length})`
                      : '⚠️ Deuda pendiente'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={700} color={hasOverduePayments ? 'error.main' : 'warning.main'}>
                    {formatCurrencyDisplay(displayRemaining)}
                  </Typography>
                  {hasOverduePayments && (
                    overdueOpen ? <ExpandLess fontSize="small" sx={{ color: 'text.secondary' }} /> : <ExpandMore fontSize="small" sx={{ color: 'text.secondary' }} />
                  )}
                </Box>
              </Box>

              {hasOverduePayments && (
                <Collapse in={overdueOpen}>
                  <Divider />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, px: 1.5, py: 1 }}>
                    {overdueSubLoans.map((subLoan, i) => (
                      <Box
                        key={subLoan.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 0.75,
                          borderTop: i > 0 ? '1px solid' : 'none',
                          borderColor: 'divider'
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            Cuota #{subLoan.paymentNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Vencida {subLoan.daysOverdue > 0 ? `hace ${subLoan.daysOverdue}d` : 'hoy'}
                            {subLoan.dueDate && ` • ${new Date(subLoan.dueDate).toLocaleDateString('es-AR')}`}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={700} color="error.main">
                          {formatCurrencyDisplay(subLoan.pendingAmount)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              )}
            </Box>
          )}

          {/* Payment Details Card */}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.paper' }}>
            <Grid container spacing={{ xs: 1, sm: 1.5 }}>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>Cliente</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>{displayClientName}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>Préstamo</Typography>
                <Typography variant="body2" fontWeight={600}>{loanTrack}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>Cuota #</Typography>
                <Typography variant="body2" fontWeight={600}>{displayPaymentNumber}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>Monto pagado</Typography>
                <Typography variant="body2" fontWeight={700} color="success.main">{formatCurrencyDisplay(displayAmount)}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>Fecha</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayDate instanceof Date ? displayDate.toLocaleDateString('es-AR') : new Date(displayDate).toLocaleDateString('es-AR')}
                </Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>Estado</Typography>
                <Chip
                  label={displayStatus === 'PAID' ? 'Pagada' : displayStatus === 'PARTIAL' ? 'Parcial' : displayStatus === 'OVERDUE' ? 'Vencida' : 'Pendiente'}
                  color={displayStatus === 'PAID' ? 'success' : displayStatus === 'OVERDUE' ? 'error' : 'warning'}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              {hasPendingDebt && (
                <Grid xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>Saldo pendiente</Typography>
                  <Typography variant="body2" fontWeight={700} color="warning.main">{formatCurrencyDisplay(displayRemaining)}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Full Receipt Data - Loan Summary */}
          {hasFullData && receiptData && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <Receipt fontSize="small" />
                  Resumen del Préstamo
                </Typography>
                <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.paper' }}>
                  <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                    {[
                      { label: 'Monto Prestado', value: formatCurrencyDisplay(receiptData.loanSummary.montoPrestado), color: undefined },
                      { label: 'Total a Devolver', value: formatCurrencyDisplay(receiptData.loanSummary.totalADevolver), color: undefined },
                      { label: 'Total Pagado', value: formatCurrencyDisplay(receiptData.loanSummary.saldoPagadoTotal), color: 'success.main' },
                      { label: 'Total Pendiente', value: formatCurrencyDisplay(receiptData.loanSummary.totalPendiente), color: 'warning.main' },
                      { label: 'Cuotas Pagadas', value: `${receiptData.loanSummary.cuotasPagadasTotales} / ${receiptData.loanSummary.totalCuotas}`, color: undefined },
                      { label: 'Cuotas Pendientes', value: String(receiptData.loanSummary.cuotasNoPagadas), color: 'warning.main' },
                    ].map(({ label, value, color }) => (
                      <Grid xs={6} sm={4} key={label}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                          {label}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color={color} sx={{ wordBreak: 'break-word' }}>
                          {value}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Box>
            </>
          )}

          {/* Notes */}
          {displayNotes && (
            <Box
              sx={{
                pl: 1.5,
                pr: 1,
                py: 1,
                borderLeft: '3px solid',
                borderColor: 'info.main'
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
          px: { xs: 2, sm: 2.5 },
          pt: { xs: 1.5, sm: 2 },
          pb: 'calc(16px + env(safe-area-inset-bottom))',
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
