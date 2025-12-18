'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Button,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Phone,
  LocationOn,
  ExpandMore,
  Payment,
  DragIndicator,
  OpenInNew,
  Refresh,
} from '@mui/icons-material';
import { CollectionRouteItem } from '@/services/collection-routes.service';
import { DateTime } from 'luxon';

export interface RouteItemCardProps {
  item: CollectionRouteItem;
  index: number;
  onPayment?: (item: CollectionRouteItem) => void;
  onReset?: (item: CollectionRouteItem) => void;
  onCardClick?: (item: CollectionRouteItem) => void;
  isActive: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
  resettingSubloanId?: string | null;
}

/**
 * RouteItemCard - Compact and efficient design
 * Shows essential info with expandable details
 */
export function RouteItemCard({
  item,
  index,
  onPayment,
  onReset,
  onCardClick,
  isActive,
  isDragging,
  dragHandleProps,
  resettingSubloanId
}: RouteItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatCurrency = (amount: number) => {
    // Formato genérico sin especificar país o moneda
    return `$${new Intl.NumberFormat('es', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const formatDate = (dateString: string) => {
    return DateTime.fromISO(dateString).setLocale('es').toFormat('dd MMM');
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
  const isResetting = resettingSubloanId === item.subLoanId;

  const openGoogleMaps = () => {
    if (item.clientAddress) {
      const encodedAddress = encodeURIComponent(item.clientAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(item);
    }
  };

  return (
    <Card
      elevation={isDragging ? 8 : 1}
      onClick={handleCardClick}
      sx={{
        mb: { xs: 1, sm: 1 },
        borderLeft: { xs: 4, sm: 3 },
        borderLeftColor: isActive ? 'primary.main' : 'grey.300',
        transition: 'all 0.2s ease',
        opacity: isDragging ? 0.9 : 1,
        transform: isDragging ? 'rotate(2deg)' : 'none',
        cursor: onCardClick ? 'pointer' : 'default',
        '&:hover': {
          boxShadow: 2,
          borderLeftWidth: { xs: 4, sm: 4 },
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 2 } } }}>
        {/* Main Row - Compact Layout */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 1.5 },
            flexWrap: 'nowrap',
            overflow: 'visible', // Ensure nothing is cut off
          }}
        >
          {/* Drag Handle */}
          {dragHandleProps && (
            <Box
              {...dragHandleProps}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              sx={{
                cursor: 'grab',
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                touchAction: 'none', // Only prevent touch on drag handle
                '&:active': {
                  cursor: 'grabbing',
                },
              }}
            >
              <DragIndicator fontSize="small" />
            </Box>
          )}

          {/* Order Badge */}
          <Chip
            label={`#${index + 1}`}
            size="small"
            color="primary"
            sx={{
              fontWeight: 'bold',
              minWidth: 45,
              height: 28,
              flexShrink: 0,
            }}
          />

          {/* Client Name */}
          <Box sx={{ flex: '1 1 auto', minWidth: { xs: 0, sm: 180 }, maxWidth: { xs: '40%', sm: 'none' } }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              {item.clientName}
            </Typography>
            {isMobile && item.clientPhone && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Phone sx={{ fontSize: 12 }} />
                {item.clientPhone}
              </Typography>
            )}
          </Box>

          {/* Amount Info - Desktop */}
          {!isMobile && (
            <>
              <Box sx={{ minWidth: 70, textAlign: 'center', flexShrink: 0 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Cuota
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  #{item.subLoan.paymentNumber}
                </Typography>
              </Box>

              <Box sx={{ minWidth: 110, textAlign: 'right', flexShrink: 0 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  A Cobrar
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="error.main">
                  {formatCurrency(pendingAmount)}
                </Typography>
              </Box>

              <Box sx={{ minWidth: 70, textAlign: 'center', flexShrink: 0 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Vence
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatDate(item.subLoan.dueDate)}
                </Typography>
              </Box>
            </>
          )}

          {/* Status Chip */}
          <Chip
            label={getStatusLabel(item.subLoan.status)}
            color={getStatusColor(item.subLoan.status)}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.75rem',
              flexShrink: 0,
            }}
          />

          {/* Actions */}
          {isActive && (
            <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 0.5 }, flexShrink: 0 }}>
              {isPaid && onReset ? (
                <Button
                  variant="outlined"
                  color="warning"
                  size={isMobile ? 'medium' : 'small'}
                  startIcon={<Refresh sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onReset) {
                      onReset(item);
                    }
                  }}
                  disabled={isResetting}
                  sx={{
                    textTransform: 'none',
                    minWidth: { xs: 85, sm: 120 },
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.75, sm: 0.5 },
                    fontSize: { xs: '0.813rem', sm: '0.813rem' },
                    fontWeight: { xs: 600, sm: 500 },
                    borderWidth: 1.5,
                    '&:active': {
                      transform: 'scale(0.97)',
                    },
                  }}
                >
                  {isResetting ? (isMobile ? 'Reseteando...' : 'Reseteando...') : (isMobile ? 'Resetear' : 'Resetear')}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size={isMobile ? 'medium' : 'small'}
                  startIcon={<Payment sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPayment) {
                      onPayment(item);
                    }
                  }}
                  sx={{
                    textTransform: 'none',
                    minWidth: { xs: 85, sm: 120 },
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.75, sm: 0.5 },
                    fontSize: { xs: '0.813rem', sm: '0.813rem' },
                    fontWeight: { xs: 600, sm: 500 },
                    boxShadow: { xs: 2, sm: 1 },
                    '&:active': {
                      transform: 'scale(0.97)', // Feedback on touch
                    },
                  }}
                >
                  {isMobile ? 'Pagar' : 'Registrar'}
                </Button>
              )}
              <IconButton
                size={isMobile ? 'medium' : 'small'}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                  flexShrink: 0,
                  width: { xs: 40, sm: 32 },
                  height: { xs: 40, sm: 32 },
                  bgcolor: { xs: 'action.hover', sm: 'transparent' },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ExpandMore sx={{ fontSize: { xs: 24, sm: 20 } }} />
              </IconButton>
            </Box>
          )}

          {!isActive && (
            <IconButton
              size={isMobile ? 'medium' : 'small'}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                flexShrink: 0,
                width: { xs: 40, sm: 32 },
                height: { xs: 40, sm: 32 },
                bgcolor: { xs: 'action.hover', sm: 'transparent' },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ExpandMore sx={{ fontSize: { xs: 24, sm: 20 } }} />
            </IconButton>
          )}
        </Box>

        {/* Mobile Amount Info */}
        {isMobile && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
              mt: 1,
              pt: 1,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Cuota
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                #{item.subLoan.paymentNumber}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                A Cobrar
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="error.main">
                {formatCurrency(pendingAmount)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Vence
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatDate(item.subLoan.dueDate)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Expandable Details */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            {/* Contact & Address */}
            <Stack spacing={1} sx={{ mb: 2 }}>
              {!isMobile && item.clientPhone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {item.clientPhone}
                  </Typography>
                </Box>
              )}
              {item.clientAddress && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    },
                    p: 0.5,
                    ml: -0.5,
                    transition: 'all 0.2s',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openGoogleMaps();
                  }}
                  title="Abrir en Google Maps"
                >
                  <LocationOn sx={{ fontSize: 16, color: 'primary.main', mt: 0.2 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'primary.main',
                      flex: 1,
                      textDecoration: 'underline',
                      textDecorationStyle: 'dotted',
                    }}
                  >
                    {item.clientAddress}
                  </Typography>
                  <OpenInNew sx={{ fontSize: 14, color: 'primary.main', mt: 0.3 }} />
                </Box>
              )}
            </Stack>

            {/* Financial Details Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 2,
                p: 1.5,
                bgcolor: 'grey.50',
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Cuota:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(item.subLoan.totalAmount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Ya Pagado:
                </Typography>
                <Typography variant="body2" fontWeight="medium" color="success.main">
                  {formatCurrency(item.subLoan.paidAmount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Cobrado Hoy:
                </Typography>
                <Typography variant="body2" fontWeight="medium" color="success.main">
                  {formatCurrency(item.amountCollected)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Código:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {item.subLoan.loan.loanTrack}
                </Typography>
              </Box>
            </Box>

            {/* Notas del Préstamo - SOLO LECTURA */}
            {item.subLoan.loan.notes && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fffde7', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.5 }}>
                  Notas del Préstamo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.subLoan.loan.notes}
                </Typography>
              </Box>
            )}

            {/* Expenses */}
            {item.expenseDetails && item.expenseDetails.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Gastos ({item.expenseDetails.length})
                </Typography>
                <Stack spacing={0.5}>
                  {item.expenseDetails.map((expense) => (
                    <Box
                      key={expense.transactionId}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        bgcolor: 'error.light',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" fontSize="0.813rem">
                        {expense.description}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        -{formatCurrency(expense.amount)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
