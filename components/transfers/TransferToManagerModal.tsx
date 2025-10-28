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
import { SwapHoriz, Close } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import { walletsService } from '@/services/wallets.service'

interface Manager {
  id: string
  name: string
  email?: string
}

interface TransferToManagerModalProps {
  open: boolean
  onClose: () => void
  availableBalance: number
  managers: Manager[]
  onSuccess?: () => void
}

export const TransferToManagerModal: React.FC<TransferToManagerModalProps> = ({
  open,
  onClose,
  availableBalance,
  managers,
  onSuccess
}) => {
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')
  const [transferAmount, setTransferAmount] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedManager = managers.find(m => m.id === selectedManagerId)
  const amountValue = parseFloat(unformatAmount(transferAmount)) || 0
  const remainingBalance = availableBalance - amountValue

  const canTransfer =
    selectedManagerId &&
    transferAmount &&
    amountValue > 0 &&
    amountValue <= availableBalance

  const handleTransfer = async () => {
    if (!selectedManager || !canTransfer) return

    setError(null)
    setIsSubmitting(true)

    try {
      await walletsService.transfer({
        managerId: selectedManager.id,
        amount: amountValue,
        currency: 'ARS',
        description: notes || `Transferencia a ${selectedManager.name}`
      })

      alert(
        `✅ Transferencia exitosa!\n\n` +
        `Monto: $${formatAmount(amountValue.toString())}\n` +
        `Hacia: ${selectedManager.name}\n` +
        `Tu saldo ahora: $${formatAmount(remainingBalance.toString())}`
      )

      onSuccess?.()
      onClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al realizar la transferencia'
      setError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedManagerId('')
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
          Transferir a Manager
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Manager Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Seleccionar Manager</InputLabel>
          <Select
            value={selectedManagerId}
            onChange={(e) => setSelectedManagerId(e.target.value)}
            label="Seleccionar Manager"
            disabled={isSubmitting}
          >
            {managers.map(manager => (
              <MenuItem key={manager.id} value={manager.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {manager.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {manager.email || 'Sin email'}
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
          helperText={`Disponible: $${formatAmount(availableBalance.toString())}`}
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
        {selectedManager && transferAmount && (
          <Card sx={{ bgcolor: 'primary.lighter', mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Se transferirá a:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedManager.name}
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

export default TransferToManagerModal
