'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  error?: string | null
  severity?: 'warning' | 'error' | 'info'
  confirmColor?: 'primary' | 'error' | 'warning' | 'info' | 'success'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  error,
  // severity = 'warning',
  confirmColor = 'error'
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    if (!error) {
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {typeof message === 'string' ? (
          <Typography color="text.secondary">
            {message}
          </Typography>
        ) : (
          message
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          color={confirmColor}
          disabled={isLoading}
        >
          {isLoading ? 'Procesando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}