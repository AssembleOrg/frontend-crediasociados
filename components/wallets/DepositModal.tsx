'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material'
import { TrendingUp, Close } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'

interface DepositModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { amount: number; currency: string; description: string }) => Promise<void>
  onSuccess?: (message: string) => void
}

export const DepositModal: React.FC<DepositModalProps> = ({
  open,
  onClose,
  onSubmit,
  onSuccess
}) => {
  const [amount, setAmount] = useState<string>('')
  const [currency, setCurrency] = useState<string>('ARS')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountValue = parseFloat(unformatAmount(amount)) || 0
  const canSubmit = amount && amountValue > 0

  const handleSubmit = async () => {
    if (!canSubmit) return

    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        amount: amountValue,
        currency,
        description: description || `Depósito de $${formatAmount(amountValue.toString())}`
      })

      // Reset form on success
      setAmount('')
      setDescription('')
      setCurrency('ARS')
      onSuccess?.('Depósito realizado con éxito')
    } catch (err: any) {
      setError(err?.message || 'Error al hacer el depósito')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount('')
      setDescription('')
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white'
      }}>
        <TrendingUp />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Hacer Depósito
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Amount Input */}
        <TextField
          label="Monto a Depositar"
          type="text"
          value={formatAmount(amount)}
          onChange={(e) => setAmount(unformatAmount(e.target.value))}
          fullWidth
          sx={{ mb: 3 }}
          placeholder="$0"
          disabled={isSubmitting}
          autoFocus
          helperText="Ingresa el monto en pesos argentinos"
        />

        {/* Description */}
        <TextField
          label="Concepto (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          placeholder="Ej: Pago de capital enero 2025"
          disabled={isSubmitting}
          multiline
          rows={2}
        />

        {/* Preview */}
        {amount && (
          <Card sx={{ bgcolor: 'success.lighter', mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Monto a depositar:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  ${formatAmount(amountValue.toString())}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Moneda:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {currency}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="outlined" disabled={isSubmitting} startIcon={<Close />}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit || isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={20} /> : <TrendingUp />}
          sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
        >
          {isSubmitting ? 'Depositando...' : 'Depositar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
