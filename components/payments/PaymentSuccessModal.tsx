'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Divider
} from '@mui/material'
import { CheckCircle, Close } from '@mui/icons-material'
import { formatAmount } from '@/lib/formatters'

interface PaymentSuccessModalProps {
  open: boolean
  onClose: () => void
  clientName: string
  paymentNumber: number
  amount: number
  paymentDate: string
  status: 'PARTIAL' | 'PAID'
  remainingAmount?: number
  loanTrack?: string
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  open,
  onClose,
  clientName,
  paymentNumber,
  amount,
  paymentDate,
  status,
  remainingAmount = 0,
  loanTrack = 'N/A'
}) => {
  const isPartial = status === 'PARTIAL'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(to bottom, #f5f7fa, #ffffff)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          background: isPartial
            ? 'linear-gradient(135deg, #ff9800 0%, #fb8c00 100%)'
            : 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}
      >
        <CheckCircle />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            ✅ Pago Registrado
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {isPartial ? 'Pago Parcial' : 'Pago Completo'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Cliente Info */}
        <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Cliente
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {clientName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cuota #{paymentNumber} | Préstamo: {loanTrack}
            </Typography>
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        {/* Payment Details Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          {/* Monto Pagado */}
          <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Monto Pagado
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
              +${formatAmount(amount.toString())}
            </Typography>
          </Box>

          {/* Fecha */}
          <Box sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Fecha
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {new Date(paymentDate).toLocaleDateString('es-AR')}
            </Typography>
          </Box>
        </Box>

        {/* Status Badge */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={status}
            color={isPartial ? 'warning' : 'success'}
            size="medium"
            sx={{ fontWeight: 600, fontSize: '1rem' }}
            icon={<CheckCircle />}
          />
        </Box>

        {/* Partial Payment Info */}
        {isPartial && remainingAmount > 0 && (
          <Card sx={{ bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>
                ⚠️ PAGO PARCIAL
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.primary' }}>
                Aún resta por pagar:
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                ${formatAmount(remainingAmount.toString())}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Paid Complete Info */}
        {!isPartial && (
          <Card sx={{ bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                ✅ Cuota completamente pagada
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                No hay monto pendiente para esta cuota
              </Typography>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" fullWidth startIcon={<Close />}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentSuccessModal
