'use client'

import { useState } from 'react'
import { green } from '@mui/material/colors'
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
  CardContent,
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
        currency: 'ARS',
        description: description || `Depósito de $${formatAmount(amountValue.toString())}`
      })

      setAmount('')
      setDescription('')
      onSuccess?.('Depósito realizado con éxito')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al hacer el depósito'
      setError(errorMsg)
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
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        background: `linear-gradient(135deg, ${green[500]} 0%, ${green[700]} 100%)`,
        color: 'white',
        p: 2.5
      }}>
        <TrendingUp sx={{ fontSize: 24 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Hacer Depósito
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ m: 3, mb: 0 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Amount Section */}
            <Box>
              <TextField
                label="Monto a Depositar"
                type="text"
                value={formatAmount(amount)}
                onChange={(e) => setAmount(unformatAmount(e.target.value))}
                fullWidth
                placeholder="$0"
                disabled={isSubmitting}
                autoFocus
                helperText="Ingresa el monto en pesos argentinos"
              />
            </Box>

            {/* Description Section */}
            <Box>
              <TextField
                label="Concepto (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                placeholder="Ej: Ingreso de capital enero 2025"
                disabled={isSubmitting}
                multiline
                rows={2}
                helperText="Descripción del depósito"
              />
            </Box>

            {/* Preview Card */}
            {amount && (
              <Card sx={{ backgroundColor: '#e8f5e9', borderLeft: '4px solid', borderLeftColor: 'success.main' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Monto a depositar:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        ${formatAmount(amountValue.toString())}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Moneda:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        ARS
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={handleClose} variant="outlined" disabled={isSubmitting} startIcon={<Close />}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit || isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <TrendingUp />}
          sx={{ backgroundColor: 'success.main', '&:hover': { backgroundColor: 'success.dark' } }}
        >
          {isSubmitting ? 'Depositando...' : 'Depositar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
