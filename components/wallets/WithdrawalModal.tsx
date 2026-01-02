'use client'

import { useState } from 'react'
import { red } from '@mui/material/colors'
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
import { TrendingDown, Close } from '@mui/icons-material'
import { formatAmount, unformatAmount, formatCurrencyDisplay } from '@/lib/formatters'

interface WithdrawalModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { amount: number; currency: string; description: string }) => Promise<void>
  onSuccess?: (message: string) => void
  currentBalance: number
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  open,
  onClose,
  onSubmit,
  onSuccess,
  currentBalance
}) => {
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountValue = parseFloat(unformatAmount(amount)) || 0
  const canWithdraw = amount && amountValue > 0 && amountValue <= currentBalance && description.trim().length > 0
  const wouldBeNegative = amountValue > currentBalance

  const handleSubmit = async () => {
    if (!canWithdraw) return

    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        amount: amountValue,
        currency: 'ARS',
        description: description.trim()
      })

      setAmount('')
      setDescription('')
      onSuccess?.('Retiro realizado con éxito')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al realizar el retiro'
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
        sx: { 
          borderRadius: 2,
          m: { xs: 1, sm: 2 },
          mt: { xs: 2, sm: 3 }
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        background: `linear-gradient(135deg, ${red[500]} 0%, ${red[700]} 100%)`,
        color: 'white',
        p: 2.5,
        pt: 3
      }}>
        <TrendingDown sx={{ fontSize: 24 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Realizar Retiro
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
            {/* Balance Info */}
            <Card sx={{ backgroundColor: '#fff3e0', borderLeft: '4px solid', borderLeftColor: 'warning.main' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Saldo Disponible:
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {formatCurrencyDisplay(currentBalance)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Amount Section */}
            <Box>
              <TextField
                label="Monto a Retirar"
                type="text"
                value={formatAmount(amount)}
                onChange={(e) => setAmount(unformatAmount(e.target.value))}
                fullWidth
                placeholder="$0"
                disabled={isSubmitting}
                autoFocus
                error={wouldBeNegative}
                helperText={
                  wouldBeNegative
                    ? `El monto excede el saldo disponible. No puedes retirar más de ${formatCurrencyDisplay(currentBalance)}`
                    : 'Ingresa el monto a retirar'
                }
              />
            </Box>

            {/* Description Section */}
            <Box>
              <TextField
                label="Concepto *"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                placeholder="Ej: Retiro para gastos operativos"
                disabled={isSubmitting}
                multiline
                rows={2}
                required
                error={description.trim().length === 0 && description.length > 0}
                helperText={
                  description.trim().length === 0 && description.length > 0
                    ? "El concepto es obligatorio"
                    : "Descripción del retiro (obligatorio)"
                }
              />
            </Box>

            {/* Preview Card */}
            {amount && amountValue > 0 && (
              <Card sx={{ 
                backgroundColor: wouldBeNegative ? '#ffebee' : '#e8f5e9', 
                borderLeft: '4px solid', 
                borderLeftColor: wouldBeNegative ? 'error.main' : 'success.main' 
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Monto a retirar:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: wouldBeNegative ? 'error.main' : 'success.main' }}>
                        {formatCurrencyDisplay(amountValue)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Saldo después del retiro:
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600, 
                          color: (currentBalance - amountValue) < 0 ? 'error.main' : 'text.primary' 
                        }}
                      >
                        {formatCurrencyDisplay(currentBalance - amountValue)}
                      </Typography>
                    </Box>
                    {wouldBeNegative && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        No puedes retirar más de lo disponible. El saldo no puede quedar en negativo.
                      </Alert>
                    )}
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
          disabled={!canWithdraw || isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <TrendingDown />}
          sx={{ backgroundColor: 'error.main', '&:hover': { backgroundColor: 'error.dark' } }}
        >
          {isSubmitting ? 'Retirando...' : 'Retirar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

