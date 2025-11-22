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
  CardContent,
} from '@mui/material'
import { SwapHoriz, Close } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import { walletsService } from '@/services/wallets.service'
import { useUsers } from '@/hooks/useUsers'
import type { User } from '@/types/auth'

interface TransferToCobradoProps {
  open: boolean
  onClose: () => void
  currentBalance: number
  selectedCobrador?: User | null
  onSuccess?: () => void
}

export const TransferToCobrador: React.FC<TransferToCobradoProps> = ({
  open,
  onClose,
  currentBalance,
  selectedCobrador,
  onSuccess
}) => {
  const { users } = useUsers()
  const [selectedCobradoId, setSelectedCobradoId] = useState<string>('')
  const [transferAmount, setTransferAmount] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si selectedCobrador viene de props, usarlo directamente
  useEffect(() => {
    if (selectedCobrador?.id) {
      setSelectedCobradoId(selectedCobrador.id)
    }
  }, [selectedCobrador?.id, open])

  const cobradores = users.filter(u => u.role === 'prestamista')
  const selectedCobrado = selectedCobrador || cobradores.find(c => c.id === selectedCobradoId)
  const amountValue = parseFloat(unformatAmount(transferAmount)) || 0
  const remainingBalance = currentBalance - amountValue

  // ✅ RESTRICCIÓN REMOVIDA: Las wallets pueden ser negativas sin límite
  const canTransfer =
    selectedCobradoId &&
    transferAmount &&
    amountValue > 0 &&
    notes.trim().length > 0
    // amountValue <= currentBalance // Ya no se valida el balance disponible

  const handleTransfer = async () => {
    if (!selectedCobrado || !canTransfer) return

    setError(null)
    setIsSubmitting(true)

    try {
      await walletsService.transfer({
        managerId: selectedCobrado.id,
        amount: amountValue,
        currency: 'ARS',
        description: notes.trim()
      })

      onSuccess?.()
      handleClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al realizar la transferencia'
      setError(errorMsg)
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
        background: `linear-gradient(135deg, #2196f3 0%, #1976d2 100%)`,
        color: 'white',
        p: 2.5,
        pt: 3
      }}>
        <SwapHoriz sx={{ fontSize: 24 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {selectedCobrador ? `Transferir a ${selectedCobrador.fullName}` : 'Transferir a Cobrador'}
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
            {/* Cobrador Selection - Solo mostrar si no está pre-seleccionado */}
            {!selectedCobrador && (
              <FormControl fullWidth>
                <InputLabel>Seleccionar Cobrador</InputLabel>
                <Select
                  value={selectedCobradoId}
                  onChange={(e) => setSelectedCobradoId(e.target.value)}
                  label="Seleccionar Cobrador"
                  disabled={isSubmitting}
                >
                  {cobradores.map(cobrado => (
                    <MenuItem key={cobrado.id} value={cobrado.id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
            )}

            {/* Cobrador Info - Mostrar si está pre-seleccionado */}
            {selectedCobrador && (
              <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Transferir a:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedCobrador.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedCobrador.email}
                </Typography>
              </Box>
            )}

            {/* Amount Input */}
            <TextField
              label="Monto a Transferir"
              type="text"
              value={formatAmount(transferAmount)}
              onChange={(e) => setTransferAmount(unformatAmount(e.target.value))}
              fullWidth
              placeholder="$0"
              disabled={isSubmitting}
              helperText={`Balance actual: $${formatAmount(currentBalance.toString())} (puede ser negativo)`}
              // error={amountValue > currentBalance && transferAmount !== ''} // Ya no se muestra error por saldo insuficiente
            />

            {/* Notes Input */}
            <TextField
              label="Concepto *"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              placeholder="Motivo de la transferencia..."
              disabled={isSubmitting}
              multiline
              rows={2}
              required
              error={notes.trim().length === 0 && notes.length > 0}
              helperText={
                notes.trim().length === 0 && notes.length > 0
                  ? "El concepto es obligatorio"
                  : "Descripción del movimiento (obligatorio)"
              }
            />

            {/* Preview Card */}
            {selectedCobrado && transferAmount && (
              <Card sx={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Se transferirá a:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {selectedCobrado.fullName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Monto:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        ${formatAmount(amountValue.toString())}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid', borderTopColor: 'divider', pt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tu saldo después:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        ${formatAmount(remainingBalance.toString())}
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
          onClick={handleTransfer}
          variant="contained"
          disabled={!canTransfer || isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SwapHoriz />}
        >
          {isSubmitting ? 'Transfiriendo...' : 'Transferir'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
