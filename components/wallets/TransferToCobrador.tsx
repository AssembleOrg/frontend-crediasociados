'use client'

import { useState, useEffect } from 'react'
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
import { SwapHoriz, Close } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import { walletsService } from '@/services/wallets.service'
import { useUsers } from '@/hooks/useUsers'

interface TransferToCobradoProps {
  open: boolean
  onClose: () => void
  currentBalance: number
  onSuccess?: () => void
}

export const TransferToCobrador: React.FC<TransferToCobradoProps> = ({
  open,
  onClose,
  currentBalance,
  onSuccess
}) => {
  const { users } = useUsers()
  const [selectedCobradoId, setSelectedCobradoId] = useState<string>('')
  const [transferAmount, setTransferAmount] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter cobradores (prestamistas)
  const cobradores = users.filter(u => u.role === 'prestamista')
  const selectedCobrado = cobradores.find(c => c.id === selectedCobradoId)
  const amountValue = parseFloat(unformatAmount(transferAmount)) || 0
  const remainingBalance = currentBalance - amountValue

  const canTransfer =
    selectedCobradoId &&
    transferAmount &&
    amountValue > 0 &&
    amountValue <= currentBalance

  const handleTransfer = async () => {
    if (!selectedCobrado || !canTransfer) return

    setError(null)
    setIsSubmitting(true)

    try {
      await walletsService.transfer({
        managerId: selectedCobrado.id,
        amount: amountValue,
        currency: 'ARS',
        description: notes || `Transferencia a ${selectedCobrado.fullName}`
      })

      onSuccess?.()
      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Error al realizar la transferencia')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedCobradoId('')
      setTransferAmount('')
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
        background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
        color: 'white'
      }}>
        <SwapHoriz />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Transferir a Cobrador
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
            {cobradores.map(cobrado => (
              <MenuItem key={cobrado.id} value={cobrado.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {cobrado.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cobrado.email || 'Sin email'}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Transfer Amount */}
        <TextField
          label="Monto a Transferir"
          type="text"
          value={formatAmount(transferAmount)}
          onChange={(e) => setTransferAmount(unformatAmount(e.target.value))}
          fullWidth
          sx={{ mb: 3 }}
          placeholder="$0"
          helperText={`Disponible: $${formatAmount(currentBalance.toString())}`}
          disabled={isSubmitting}
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
          placeholder="Motivo de la transferencia..."
          disabled={isSubmitting}
        />

        {/* Preview */}
        {selectedCobrado && transferAmount && (
          <Card sx={{ bgcolor: 'primary.lighter', mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Se transferirá a:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedCobrado.fullName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Monto:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  ${formatAmount(amountValue.toString())}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Saldo después:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  ${formatAmount(remainingBalance.toString())}
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
          onClick={handleTransfer}
          variant="contained"
          disabled={!canTransfer || isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={20} /> : <SwapHoriz />}
        >
          {isSubmitting ? 'Transfiriendo...' : 'Transferir'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
