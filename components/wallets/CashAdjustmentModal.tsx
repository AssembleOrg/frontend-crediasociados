'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'
import { AccountBalance, TrendingUp } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import { collectorWalletService } from '@/services/collector-wallet.service'
import type { User } from '@/types/auth'

interface CashAdjustmentModalProps {
  open: boolean
  onClose: () => void
  cobrador: User | null
  currentBalance: number
  onSuccess?: () => void
  onSafeBalanceUpdate?: () => void
}

export function CashAdjustmentModal({
  open,
  onClose,
  cobrador,
  currentBalance,
  onSuccess,
  onSafeBalanceUpdate
}: CashAdjustmentModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setAmount('')
      setDescription('')
      setError(null)
    }
  }, [open])

  const amountValue = parseFloat(unformatAmount(amount)) || 0
  const projectedBalance = currentBalance + amountValue

  const canAdjust = 
    amount && 
    amountValue > 0 && 
    description.trim().length > 0 &&
    cobrador !== null

  const handleAdjust = async () => {
    if (!cobrador || !canAdjust) return

    setError(null)
    setIsSubmitting(true)

    try {
      // El endpoint cash-adjustment maneja todo: ajusta la wallet de cobros y retira de la caja fuerte
      await collectorWalletService.cashAdjustment({
        managerId: cobrador.id,
        amount: amountValue,
        description: description.trim()
      })

      // Actualizar balance de caja fuerte (el backend ya lo modificó)
      onSafeBalanceUpdate?.()
      
      onSuccess?.()
      handleClose()
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al realizar el ajuste de caja'
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

  const handleAmountChange = (value: string) => {
    setAmount(formatAmount(value))
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
        background: `linear-gradient(135deg, #4caf50 0%, #388e3c 100%)`,
        color: 'white',
        p: 2.5,
        pt: 3
      }}>
        <TrendingUp sx={{ fontSize: 24 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Ajuste de Caja
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ 
          mb: 3, 
          p: 2, 
          bgcolor: currentBalance < 0 ? 'error.lighter' : 'info.lighter', 
          borderRadius: 1 
        }}>
          <Typography variant="body2" color={currentBalance < 0 ? 'error.main' : 'info.main'} fontWeight={600} gutterBottom>
            Balance Actual de Wallet de Cobros
          </Typography>
          <Typography variant="h5" color={currentBalance < 0 ? 'error.main' : 'info.main'} sx={{ fontWeight: 700 }}>
            ${currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {currentBalance < 0 
              ? 'El saldo es negativo. El monto se retirará de la caja fuerte para cuadrar la caja.'
              : 'El monto se retirará de la caja fuerte y se agregará a la wallet de cobros.'
            }
          </Typography>
        </Box>

        <TextField
          label="Monto a Agregar *"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          fullWidth
          placeholder="0"
          disabled={isSubmitting}
          InputProps={{
            startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>,
          }}
          sx={{ mb: 2 }}
          error={amountValue <= 0 && amount.length > 0}
          helperText={
            amountValue <= 0 && amount.length > 0
              ? "El monto debe ser mayor a 0"
              : "Monto a retirar de la caja fuerte y agregar a la wallet de cobros"
          }
        />

        {amountValue > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
            <Typography variant="body2" color="success.main" fontWeight={600} gutterBottom>
              Balance Proyectado
            </Typography>
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
              ${projectedBalance.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Typography>
          </Box>
        )}

        <TextField
          label="Concepto *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          placeholder="Ej: Ajuste de caja negativo - Cuadre fin de semana"
          disabled={isSubmitting}
          multiline
          rows={2}
          required
          error={description.trim().length === 0 && description.length > 0}
          helperText={
            description.trim().length === 0 && description.length > 0
              ? "El concepto es obligatorio"
              : "Descripción del ajuste (obligatorio)"
          }
        />
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleAdjust}
          disabled={!canAdjust || isSubmitting}
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <AccountBalance />}
          sx={{
            backgroundColor: 'success.main',
            '&:hover': { backgroundColor: 'success.dark' }
          }}
        >
          {isSubmitting ? 'Ajustando...' : 'Ajustar Caja'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

