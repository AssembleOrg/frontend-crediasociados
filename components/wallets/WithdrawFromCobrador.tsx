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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material'
import { TrendingDown, Close } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import { walletsService } from '@/services/wallets.service'
import { useUsers } from '@/hooks/useUsers'

interface WithdrawFromCobradoProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const WithdrawFromCobrador: React.FC<WithdrawFromCobradoProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { users } = useUsers()
  const [selectedCobradoId, setSelectedCobradoId] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter cobradores (prestamistas)
  const cobradores = users.filter(u => u.role === 'prestamista')
  const selectedCobrado = cobradores.find(c => c.id === selectedCobradoId)
  const cobradoBalance = selectedCobrado?.wallet?.balance ?? 0
  const amountValue = parseFloat(unformatAmount(withdrawAmount)) || 0

  const canWithdraw =
    selectedCobradoId &&
    withdrawAmount &&
    amountValue > 0 &&
    amountValue <= cobradoBalance

  const handleWithdraw = async () => {
    if (!selectedCobrado || !canWithdraw) return

    setError(null)
    setIsSubmitting(true)

    try {
      // Transfer money FROM the cobrador back TO the asociado
      await walletsService.transfer({
        managerId: selectedCobrado.id,
        amount: amountValue * -1,
        currency: 'ARS',
        description: notes || `Retiro de ${selectedCobrado.fullName}`
      })

      onSuccess?.()
      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Error al realizar el retiro')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedCobradoId('')
      setWithdrawAmount('')
      setNotes('')
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
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white'
      }}>
        <TrendingDown />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Retirar de Cobrador
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Cobrador Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Seleccionar Cobrador</InputLabel>
          <Select
            value={selectedCobradoId}
            onChange={(e) => setSelectedCobradoId(e.target.value)}
            label="Seleccionar Cobrador"
            disabled={isSubmitting}
          >
            {cobradores.map(cobrado => {
              const balance = cobrado.wallet?.balance ?? 0
              return (
                <MenuItem key={cobrado.id} value={cobrado.id} disabled={balance === 0}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {cobrado.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cobrado.email} (Balance: ${formatAmount(balance.toString())})
                    </Typography>
                  </Box>
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        {/* Withdraw Amount */}
        <TextField
          label="Monto a Retirar"
          type="text"
          value={formatAmount(withdrawAmount)}
          onChange={(e) => setWithdrawAmount(unformatAmount(e.target.value))}
          fullWidth
          sx={{ mb: 3 }}
          placeholder="$0"
          disabled={isSubmitting || !selectedCobradoId}
          helperText={`Disponible: $${formatAmount(cobradoBalance.toString())}`}
          error={amountValue > cobradoBalance && withdrawAmount !== ''}
        />

        {/* Notes */}
        <TextField
          label="Notas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={2}
          fullWidth
          sx={{ mb: 3 }}
          placeholder="Motivo del retiro..."
          disabled={isSubmitting}
        />

        {/* Preview */}
        {selectedCobrado && withdrawAmount && (
          <Card sx={{ bgcolor: 'error.lighter', mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Se retirará de:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedCobrado.fullName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Monto:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                  ${formatAmount(amountValue.toString())}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Balance después:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  ${formatAmount((cobradoBalance - amountValue).toString())}
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
          onClick={handleWithdraw}
          variant="contained"
          disabled={!canWithdraw || isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={20} /> : <TrendingDown />}
          sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
        >
          {isSubmitting ? 'Retirando...' : 'Retirar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
