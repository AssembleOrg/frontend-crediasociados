'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Warning, DeleteForever } from '@mui/icons-material'
import { useTheme, useMediaQuery } from '@mui/material'

interface DeleteLoanConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  loanTrack?: string
  loanAmount?: number
}

export function DeleteLoanConfirmModal({
  open,
  onClose,
  onConfirm,
  loanTrack,
  loanAmount,
}: DeleteLoanConfirmModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConfirmValid = confirmText.toLowerCase() === 'eliminar'

  const handleClose = () => {
    if (isDeleting) return
    setConfirmText('')
    setError(null)
    onClose()
  }

  const handleConfirm = async () => {
    if (!isConfirmValid) return

    setIsDeleting(true)
    setError(null)

    try {
      await onConfirm()
      setConfirmText('')
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar el préstamo')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && isConfirmValid && !isDeleting) {
      handleConfirm()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: { xs: 'calc(100dvh - 96px)', sm: '90vh' },
          m: { xs: 1, sm: 2 },
          mt: { xs: 'auto', sm: 2 },
          width: { xs: '100%', sm: 'auto' },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'error.main',
          color: 'white',
          py: 2,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Warning sx={{ fontSize: { xs: 24, sm: 32 } }} />
        <Box>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} component="div" fontWeight={600}>
            Eliminar Prestamo
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Esta accion no se puede deshacer
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            ⚠️ ADVERTENCIA: Esta acción es irreversible
          </Typography>
          <Typography variant="body2">
            El préstamo será eliminado permanentemente del sistema y el monto será devuelto a tu billetera.
          </Typography>
        </Alert>

        {loanTrack && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Préstamo a eliminar:
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'monospace',
                color: 'error.main',
                fontWeight: 'bold',
              }}
            >
              {loanTrack}
            </Typography>
            {loanAmount !== undefined && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Monto: ${loanAmount.toLocaleString('es-AR')}
              </Typography>
            )}
          </Box>
        )}

        <Box>
          <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
            Para confirmar, escribe <strong>"eliminar"</strong> (sin comillas):
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe: eliminar"
            disabled={isDeleting}
            autoFocus
            error={confirmText.length > 0 && !isConfirmValid}
            helperText={
              confirmText.length > 0 && !isConfirmValid
                ? 'Debes escribir exactamente "eliminar"'
                : ''
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: isConfirmValid ? 'error.main' : undefined,
                },
              },
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
        <Button
          onClick={handleClose}
          disabled={isDeleting}
          variant="outlined"
          fullWidth={isMobile}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!isConfirmValid || isDeleting}
          variant="contained"
          color="error"
          fullWidth={isMobile}
          startIcon={
            isDeleting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <DeleteForever />
            )
          }
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

