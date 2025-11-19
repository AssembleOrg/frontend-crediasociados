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
  Chip
} from '@mui/material'
import { CheckCircle as SuccessIcon } from '@mui/icons-material'
import { formatAmount } from '@/lib/formatters'

interface PaymentSuccessModalProps {
  open: boolean
  onClose: () => void
  clientName: string
  paymentNumber: number
  amount: number
  paymentDate: Date
  status: 'PARTIAL' | 'PAID'
  remainingAmount: number
  notes?: string
  pdfGenerated?: boolean
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
  pdfGenerated = false
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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

          {/* Payment Details Card */}
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1.5,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2
            }}
          >
            {/* Row 1 */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                CLIENTE
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {clientName}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                CUOTA #
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {paymentNumber}
              </Typography>
            </Box>

            {/* Row 2 */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                MONTO PAGADO
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, color: 'success.main' }}>
                ${formatAmount(amount.toString())}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                FECHA
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {paymentDate.toLocaleDateString('es-AR')}
              </Typography>
            </Box>

            {/* Row 3 - Status & Remaining */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                ESTADO
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={status === 'PAID' ? 'Pagada' : 'Parcial'}
                  color={status === 'PAID' ? 'success' : 'warning'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            {status === 'PARTIAL' && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  SALDO PENDIENTE
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'warning.main' }}>
                  ${formatAmount(remainingAmount.toString())}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Notes */}
          {notes && (
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
                {notes}
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
