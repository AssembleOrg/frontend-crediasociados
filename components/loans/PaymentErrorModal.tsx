'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material'

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
  onRetry,
}) => {
  const getDetailedMessage = () => {
    if (errorMessage?.includes('403') || errorMessage?.includes('acceso')) {
      return {
        title: 'Acceso denegado',
        message: 'No tenés acceso a este préstamo o cuota. Verificá que pertenezca a tu cuenta y que esté en estado correcto.',
      }
    }
    if (errorMessage?.includes('404') || errorMessage?.includes('no encontrad')) {
      return {
        title: 'Cuota no encontrada',
        message: 'La cuota que intentás pagar no existe. Recargá la página e intentá nuevamente.',
      }
    }
    if (errorMessage?.includes('400') || errorMessage?.includes('inválid')) {
      return {
        title: 'Datos inválidos',
        message: 'Verificá el monto y que la cuota no esté completamente pagada.',
      }
    }
    return {
      title: 'No se pudo registrar el pago',
      message: errorMessage,
    }
  }

  const { title, message } = getDetailedMessage()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: {
          borderRadius: { xs: '16px 16px 0 0', sm: 3 },
          m: 0,
          mt: 'auto',
          mx: { sm: 2 },
          mb: { sm: 2 },
          width: '100%',
        },
      }}
    >
      <DialogTitle sx={{ pt: 3, pb: 0, px: 3, fontWeight: 600 }}>
        {title}
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {message}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          flexDirection: 'column',
          gap: 1,
          p: 3,
          pt: 2,
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
        }}
      >
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="contained"
            color="primary"
            fullWidth
            sx={{ minHeight: 44, borderRadius: 2 }}
          >
            Reintentar
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="text"
          color="inherit"
          fullWidth
          sx={{ minHeight: 44, borderRadius: 2, color: 'text.secondary' }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentErrorModal
