'use client';

import { useState } from 'react';
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
} from '@mui/material';
import { TrendingDown, Close, Wallet } from '@mui/icons-material';
import { formatAmount, unformatAmount } from '@/lib/formatters';
import type { User } from '@/types/auth';

interface WithdrawFromCollectorModalProps {
  open: boolean;
  onClose: () => void;
  cobrador: User | null;
  collectorBalance: number;
  onSuccess?: () => void;
  onWithdraw: (userId: string, amount: number, description: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function WithdrawFromCollectorModal({
  open,
  onClose,
  cobrador,
  collectorBalance,
  onSuccess,
  onWithdraw,
  isLoading = false,
  error = null,
}: WithdrawFromCollectorModalProps) {
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const amountValue = parseFloat(unformatAmount(withdrawAmount)) || 0;
  const remainingBalance = collectorBalance - amountValue;

  const canWithdraw = withdrawAmount && amountValue > 0 && amountValue <= collectorBalance && notes.trim().length > 0;

  const handleWithdraw = async () => {
    if (!cobrador || !canWithdraw) return;

    try {
      await onWithdraw(
        cobrador.id,
        amountValue,
        notes.trim()
      );

      // Reset form
      setWithdrawAmount('');
      setNotes('');
      
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setWithdrawAmount('');
      setNotes('');
      onClose();
    }
  };

  if (!cobrador) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          m: { xs: 1, sm: 2 },
          mt: { xs: 2, sm: 3 }
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          background: `linear-gradient(135deg, #f44336 0%, #d32f2f 100%)`,
          color: 'white',
          p: 2.5,
          pt: 3,
        }}
      >
        <TrendingDown sx={{ fontSize: 24 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Retirar de Wallet de Cobros
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Info del Cobrador */}
        <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Wallet sx={{ fontSize: 20, color: 'error.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Wallet de Cobros
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {cobrador.fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {cobrador.email}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'success.main', fontWeight: 600 }}>
            Balance disponible: ${formatAmount(collectorBalance.toString())}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            ℹ️ Este retiro <strong> se agregará</strong> a tu CAJA FUERTE
          </Typography>
          <Typography variant="caption">
            Solo disminuye el saldo de la wallet de cobros del manager
          </Typography>
        </Alert>

        {/* Withdraw Amount */}
        <TextField
          label="Monto a Retirar"
          type="text"
          value={formatAmount(withdrawAmount)}
          onChange={(e) => setWithdrawAmount(unformatAmount(e.target.value))}
          fullWidth
          placeholder="$0"
          disabled={isLoading}
          sx={{ mb: 3 }}
          helperText={`Balance disponible: $${formatAmount(collectorBalance.toString())}`}
          error={amountValue > collectorBalance && withdrawAmount !== ''}
          InputProps={{
            startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
          }}
        />

        {/* Notes */}
        <TextField
          label="Concepto *"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          placeholder="Motivo del retiro..."
          disabled={isLoading}
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
        {withdrawAmount && (
          <Card
            sx={{
              mt: 3,
              backgroundColor: '#ffebee',
              borderLeft: '4px solid',
              borderLeftColor: 'error.main',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Se retirará de:
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {cobrador.fullName}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Monto:
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main' }}>
                    ${formatAmount(amountValue.toString())}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid',
                    borderTopColor: 'divider',
                    pt: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Balance después:
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    ${formatAmount(remainingBalance.toString())}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={isLoading}
          startIcon={<Close />}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleWithdraw}
          variant="contained"
          disabled={!canWithdraw || isLoading}
          endIcon={
            isLoading ? <CircularProgress size={20} color="inherit" /> : <TrendingDown />
          }
          sx={{ backgroundColor: 'error.main', '&:hover': { backgroundColor: 'error.dark' } }}
        >
          {isLoading ? 'Retirando...' : 'Retirar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

