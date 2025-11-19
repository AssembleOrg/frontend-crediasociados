'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert
} from '@mui/material'
import { Error as ErrorIcon } from '@mui/icons-material'

interface PaymentErrorModalProps {
  open: boolean
  onClose: () => void
  errorMessage?: string
  onRetry?: () => void
}

export const PaymentErrorModal: React.FC<PaymentErrorModalProps> = ({
  open,
  onClose,
  errorMessage = 'Error al registrar el pago. Por favor intenta nuevamente.',
  onRetry
}) => {
  const handleRetry = () => {
    onRetry?.()
  }

  // Extract specific error message if it's a 403 access error
  const getDetailedMessage = () => {
    if (errorMessage?.includes('403') || errorMessage?.includes('acceso')) {
      return {
        title: 'Acceso denegado',
        message: 'No tienes acceso a este préstamo o cuota. Verifica que el préstamo pertenezca a tu cuenta y que tenga el estado correcto para registrar el pago.',
        severity: 'error' as const
      }
    }

    if (errorMessage?.includes('404') || errorMessage?.includes('no encontrad')) {
      return {
        title: 'Cuota no encontrada',
        message: 'La cuota que intentas pagar no existe. Por favor, recarga la página e intenta nuevamente.',
        severity: 'error' as const
      }
    }

    if (errorMessage?.includes('400') || errorMessage?.includes('inválid')) {
      return {
        title: 'Datos inválidos',
        message: 'Los datos ingresados no son válidos. Verifica el monto, la fecha y que la cuota no esté completamente pagada.',
        severity: 'warning' as const
      }
    }

    return {
      title: 'Error al registrar el pago',
      message: errorMessage,
      severity: 'error' as const
    }
  }

  const { title, message, severity } = getDetailedMessage()

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
          borderColor: 'divider'
        }}
      >
        <ErrorIcon
          sx={{
            color: severity === 'error' ? 'error.main' : 'warning.main',
            fontSize: 28
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert
            severity={severity}
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {message}
            </Typography>
          </Alert>

          {errorMessage && errorMessage !== message && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                border: 1,
                borderColor: 'grey.200',
                borderRadius: 1
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Detalles técnicos:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  fontFamily: 'monospace',
                  wordBreak: 'break-word',
                  color: 'text.secondary'
                }}
              >
                {errorMessage}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ minWidth: 100 }}
        >
          Cerrar
        </Button>
        {onRetry && (
          <Button
            onClick={handleRetry}
            variant="contained"
            color="primary"
            sx={{ minWidth: 100 }}
          >
            Reintentar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default PaymentErrorModal
