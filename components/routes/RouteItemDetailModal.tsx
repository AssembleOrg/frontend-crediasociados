'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import {
  Person,
  Phone,
  LocationOn,
  Payment,
  OpenInNew,
  Receipt,
  Notes,
} from '@mui/icons-material';
import { CollectionRouteItem } from '@/services/collection-routes.service';
import { DateTime } from 'luxon';

interface RouteItemDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: CollectionRouteItem | null;
  onPayment?: (item: CollectionRouteItem) => void;
}

export function RouteItemDetailModal({
  open,
  onClose,
  item,
  onPayment,
}: RouteItemDetailModalProps) {
  if (!item) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `$${new Intl.NumberFormat('es', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const formatDate = (dateString: string) => {
    return DateTime.fromISO(dateString).setLocale('es').toFormat("dd 'de' MMMM, yyyy");
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'PENDING':
        return 'default';
      case 'OVERDUE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'Pagado';
      case 'PARTIAL':
        return 'Parcial';
      case 'PENDING':
        return 'Pendiente';
      case 'OVERDUE':
        return 'Vencido';
      default:
        return status;
    }
  };

  const pendingAmount = item.subLoan.totalAmount - item.subLoan.paidAmount;
  const isPaid = item.subLoan.status === 'PAID';

  const openGoogleMaps = () => {
    if (item.clientAddress) {
      const encodedAddress = encodeURIComponent(item.clientAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          m: { xs: 1, sm: 2 },
        },
      }}
    >
      <DialogTitle
        sx={{
          pt: 2.5,
          px: 3,
          pb: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Person />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {item.clientName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Detalle del Cliente
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(item.subLoan.status)}
            color={getStatusColor(item.subLoan.status)}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Contact Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone fontSize="small" color="primary" />
            Contacto
          </Typography>
          <Box sx={{ pl: 3.5 }}>
            {item.clientPhone ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {item.clientPhone}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ mb: 0.5 }}>
                Sin teléfono registrado
              </Typography>
            )}
            {item.clientAddress && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
                onClick={openGoogleMaps}
              >
                <LocationOn sx={{ fontSize: 16, color: 'primary.main', mt: 0.2 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                  }}
                >
                  {item.clientAddress}
                </Typography>
                <OpenInNew sx={{ fontSize: 14, color: 'primary.main', mt: 0.3 }} />
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Loan Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt fontSize="small" color="primary" />
            Información del Préstamo
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Código
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {item.subLoan.loan.loanTrack}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Cuota
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                #{item.subLoan.paymentNumber}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Cuota
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(item.subLoan.totalAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Ya Pagado
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                {formatCurrency(item.subLoan.paidAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Pendiente
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="error.main">
                {formatCurrency(pendingAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Vencimiento
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatDate(item.subLoan.dueDate)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Loan Notes */}
        {item.subLoan.loan.notes && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notes fontSize="small" color="primary" />
                Notas del Préstamo
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#fffde7',
                  borderRadius: 2,
                  border: '1px solid #fff9c4',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {item.subLoan.loan.notes}
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Collected Today */}
        {item.amountCollected > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                p: 2,
                bgcolor: '#e8f5e9',
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" fontWeight="medium">
                Cobrado Hoy
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {formatCurrency(item.amountCollected)}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ flex: 1 }}>
          Cerrar
        </Button>
        {!isPaid && onPayment && (
          <Button
            variant="contained"
            startIcon={<Payment />}
            onClick={() => {
              onPayment(item);
              onClose();
            }}
            sx={{
              flex: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
            }}
          >
            Registrar Pago
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default RouteItemDetailModal;
