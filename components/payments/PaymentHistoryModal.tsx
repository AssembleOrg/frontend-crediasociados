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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material'
import { History, Close } from '@mui/icons-material'
import { paymentsService } from '@/services/payments.service'
import { formatAmount } from '@/lib/formatters'
import type { Payment } from '@/types/auth'

interface PaymentHistoryModalProps {
  open: boolean
  onClose: () => void
  subLoanId: string
  clientName: string
  totalAmount: number
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  open,
  onClose,
  subLoanId,
  clientName,
  totalAmount
}) => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchPaymentHistory()
    }
  }, [open, subLoanId])

  const fetchPaymentHistory = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const history = await paymentsService.getPaymentHistory(subLoanId)
      setPayments(history || [])
    } catch (err: any) {
      setError(err?.message || 'Error al cargar historial de pagos')
    } finally {
      setIsLoading(false)
    }
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remainingAmount = totalAmount - totalPaid

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
        color: 'white'
      }}>
        <History />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Historial de Pagos
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Cliente: <strong>{clientName}</strong>
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: 'primary.lighter', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">Monto Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                ${formatAmount(totalAmount.toString())}
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'success.lighter', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">Pagado</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                ${formatAmount(totalPaid.toString())}
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: remainingAmount > 0 ? 'warning.lighter' : 'error.lighter', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">Restante</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: remainingAmount > 0 ? 'warning.main' : 'error.main' }}>
                ${formatAmount(remainingAmount.toString())}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Payment List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : payments.length === 0 ? (
          <Alert severity="info">No hay pagos registrados aún</Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell align="right"><strong>Monto</strong></TableCell>
                  <TableCell><strong>Descripción</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      {new Date(payment.paymentDate).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                      +${formatAmount(payment.amount.toString())}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                      {payment.description || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Progress Bar */}
        {totalAmount > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption">Progreso de Pago</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {Math.round((totalPaid / totalAmount) * 100)}%
              </Typography>
            </Box>
            <Box sx={{
              width: '100%',
              height: 8,
              bgcolor: 'grey.200',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <Box sx={{
                height: '100%',
                width: `${Math.min((totalPaid / totalAmount) * 100, 100)}%`,
                bgcolor: remainingAmount > 0 ? 'warning.main' : 'success.main',
                transition: 'width 0.3s ease'
              }} />
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" startIcon={<Close />}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentHistoryModal
