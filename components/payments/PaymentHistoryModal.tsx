'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Alert
} from '@mui/material'
import { History, Close, Refresh } from '@mui/icons-material'
import { Chip } from '@mui/material'
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
  const [paymentHistory, setPaymentHistory] = useState<Array<{
    date: string;
    type?: string;
    amount: number;
    balance: number;
    description?: string;
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPaymentHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const history = await paymentsService.getPaymentHistory(subLoanId)
      // Handle both array and object response formats
      if (Array.isArray(history)) {
        setPayments(history)
        setPaymentHistory([])
      } else {
        // If it's an object with paymentHistory field
        setPayments((history as any).payments || [])
        setPaymentHistory((history as any).paymentHistory || [])
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar historial de pagos'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [subLoanId])

  useEffect(() => {
    if (open) {
      fetchPaymentHistory()
    }
  }, [open, subLoanId, fetchPaymentHistory])

  // Calculate total paid from paymentHistory if available, otherwise from payments
  const totalPaid = paymentHistory.length > 0
    ? paymentHistory
        .filter(h => h.type !== 'RESET')
        .reduce((sum, h) => sum + Math.max(0, h.amount), 0)
    : payments.reduce((sum, p) => sum + p.amount, 0)
  const remainingAmount = totalAmount - totalPaid

  // Use paymentHistory if available, otherwise fallback to payments
  const displayHistory = paymentHistory.length > 0 ? paymentHistory : payments.map(p => ({
    date: p.paymentDate.toString(),
    amount: p.amount,
    balance: 0,
    description: p.description
  }))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          m: { xs: 1, sm: 2 },
          mt: { xs: 2, sm: 3 }
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
        color: 'white',
        p: 2.5,
        pt: 3
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
        ) : displayHistory.length === 0 ? (
          <Alert severity="info">No hay pagos registrados aún</Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell align="right"><strong>Monto</strong></TableCell>
                  <TableCell><strong>Descripción</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayHistory.map((item, index) => {
                  const isReset = item.type === 'RESET' || (item.amount < 0 && item.description?.toLowerCase().includes('reseteo'))
                  const isPositive = !isReset && item.amount > 0
                  return (
                    <TableRow key={index} hover>
                      <TableCell>
                        {new Date(item.date).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>
                        {isReset ? (
                          <Chip
                            icon={<Refresh />}
                            label="Reseteo"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 600 }}
                          />
                        ) : (
                          <Chip
                            label="Pago"
                            size="small"
                            color="success"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 600, 
                          color: isReset ? 'warning.main' : isPositive ? 'success.main' : 'text.secondary'
                        }}
                      >
                        {isReset ? '-' : '+'}${formatAmount(Math.abs(item.amount).toString())}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                        {item.description || '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}
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
