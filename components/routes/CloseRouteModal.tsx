'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { CollectionRoute } from '@/services/collection-routes.service';

interface CloseRouteModalProps {
  open: boolean;
  onClose: () => void;
  route: CollectionRoute | null;
  onConfirm: (notes: string) => Promise<void>;
}

/**
 * CloseRouteModal - Mobile-first modal to close a route
 * Allows manager to add notes before closing
 */
export function CloseRouteModal({ open, onClose, route, onConfirm }: CloseRouteModalProps) {
  const [notes, setNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    // Formato genérico sin especificar país o moneda
    return `$${new Intl.NumberFormat('es', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const handleConfirm = async () => {
    if (!route) return;

    try {
      setIsClosing(true);
      setError(null);
      await onConfirm(notes);
      // Success - parent will handle closing
      setNotes(''); // Reset for next time
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar la ruta');
    } finally {
      setIsClosing(false);
    }
  };

  const handleClose = () => {
    if (!isClosing) {
      setNotes('');
      setError(null);
      onClose();
    }
  };

  if (!route) return null;

  const totalClients = route.items.length;
  const paidClients = route.items.filter((item) => item.subLoan.status === 'PAID').length;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={false} // Mobile responsive
      PaperProps={{
        sx: {
          m: { xs: 2, sm: 3 },
          maxHeight: { xs: '90vh', sm: '80vh' },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="primary" />
          <Typography variant="h6" component="span">
            Cerrar Ruta del Día
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Una vez cerrada, la ruta no se puede volver a abrir. Los datos quedarán guardados
          permanentemente.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Summary */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Resumen del Día
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Clientes Visitados:
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {paidClients} / {totalClients}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Cobrado:
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {formatCurrency(route.totalCollected)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Gastos:
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="error.main">
              {formatCurrency(route.totalExpenses)}
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body1" fontWeight="bold">
              Neto del Día:
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="primary.main">
              {formatCurrency(route.netAmount)}
            </Typography>
          </Box>
        </Box>

        {/* Notes Input */}
        <TextField
          label="Notas del Día (Opcional)"
          placeholder="Ej: Se cobraron 8/10 clientes. 2 clientes no estaban en sus domicilios..."
          multiline
          rows={4}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isClosing}
          sx={{ mb: 2 }}
          helperText="Agrega observaciones sobre los cobros del día"
        />
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={isClosing}
          startIcon={<Cancel />}
          fullWidth={true}
          sx={{ display: { xs: 'flex', sm: 'inline-flex' } }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={isClosing}
          startIcon={isClosing ? <CircularProgress size={20} /> : <CheckCircle />}
          fullWidth={true}
          sx={{ display: { xs: 'flex', sm: 'inline-flex' } }}
        >
          {isClosing ? 'Cerrando...' : 'Cerrar Ruta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

