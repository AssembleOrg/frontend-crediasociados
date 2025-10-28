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
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'error.main',
          color: 'white',
          py: 2,
        }}
      >
        <Warning sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" component="div">
            Eliminar Préstamo Permanentemente
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Esta acción no se puede deshacer
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
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

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={isDeleting}
          variant="outlined"
          size="large"
          sx={{ minWidth: 120 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!isConfirmValid || isDeleting}
          variant="contained"
          color="error"
          size="large"
          startIcon={
            isDeleting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <DeleteForever />
            )
          }
          sx={{ minWidth: 160 }}
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

