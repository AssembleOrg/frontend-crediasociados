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
import { TrendingDown, Close } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import { walletsService } from '@/services/wallets.service'
import { useUsers } from '@/hooks/useUsers'
import type { User } from '@/types/auth'

interface WithdrawFromCobradoProps {
  open: boolean
  onClose: () => void
  selectedCobrador?: User | null
  onSuccess?: () => void
}

export const WithdrawFromCobrador: React.FC<WithdrawFromCobradoProps> = ({
  open,
  onClose,
  selectedCobrador,
  onSuccess
}) => {
  const { users } = useUsers()
  const [selectedCobradoId, setSelectedCobradoId] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
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
      await walletsService.transfer({
        managerId: selectedCobrado.id,
        amount: amountValue * -1,
        currency: 'ARS',
        description: notes || `Retiro de ${selectedCobrado.fullName}`
      })

      onSuccess?.()
      handleClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al realizar el retiro'
      setError(errorMsg)
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
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        background: `linear-gradient(135deg, #f44336 0%, #d32f2f 100%)`,
        color: 'white',
        p: 2.5
      }}>
        <TrendingDown sx={{ fontSize: 24 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {selectedCobrador ? `Retirar de ${selectedCobrador.fullName}` : 'Retirar de Cobrador'}
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
                  {cobradores.map(cobrado => {
                    const balance = cobrado.wallet?.balance ?? 0
                    return (
                      <MenuItem key={cobrado.id} value={cobrado.id} disabled={balance === 0}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
            )}

            {/* Cobrador Info - Mostrar si está pre-seleccionado */}
            {selectedCobrador && (
              <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Retirar de:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedCobrador.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedCobrador.email} (Balance: ${formatAmount(cobradoBalance.toString())})
                </Typography>
              </Box>
            )}

            {/* Withdraw Amount */}
            <TextField
              label="Monto a Retirar"
              type="text"
              value={formatAmount(withdrawAmount)}
              onChange={(e) => setWithdrawAmount(unformatAmount(e.target.value))}
              fullWidth
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
              fullWidth
              placeholder="Motivo del retiro..."
              disabled={isSubmitting}
              multiline
              rows={2}
              helperText="Descripción del movimiento"
            />

            {/* Preview Card */}
            {selectedCobrado && withdrawAmount && (
              <Card sx={{ backgroundColor: '#ffebee', borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Se retirará de:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {selectedCobrado.fullName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Monto:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main' }}>
                        ${formatAmount(amountValue.toString())}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid', borderTopColor: 'divider', pt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Balance después:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        ${formatAmount((cobradoBalance - amountValue).toString())}
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
          onClick={handleWithdraw}
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
