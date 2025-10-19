'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  AttachMoney,
  Lock,
  TrendingUp,
  Refresh,
  Info,
} from '@mui/icons-material';
import type { Wallet } from '@/types/auth';

interface WalletBalanceCardProps {
  wallet: Wallet | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  showDetails?: boolean;
}

/**
 * WalletBalanceCard - Muestra el saldo actual de la cartera del usuario
 *
 * Props:
 * - wallet: Datos de la cartera
 * - isLoading: Si está cargando datos
 * - onRefresh: Callback para refrescar datos
 * - showDetails: Si mostrar desglose de disponible/bloqueado
 */
export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  wallet,
  isLoading = false,
  onRefresh,
  showDetails = true,
}) => {
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Skeleton
              variant='text'
              width='40%'
            />
            <Skeleton
              variant='rectangular'
              height={60}
            />
            {showDetails && (
              <Grid
                container
                spacing={2}
              >
                <Grid
                  item
                  xs={6}
                >
                  <Skeleton
                    variant='rectangular'
                    height={40}
                  />
                </Grid>
                <Grid
                  item
                  xs={6}
                >
                  <Skeleton
                    variant='rectangular'
                    height={40}
                  />
                </Grid>
              </Grid>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card
        sx={{
          mb: 3,
          bgcolor: 'error.lighter',
          borderLeft: 4,
          borderColor: 'error.main',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Info color='error' />
            <Box>
              <Typography
                variant='subtitle2'
                sx={{ fontWeight: 600, color: 'error.main' }}
              >
                Billetera no disponible
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
              >
                Tu billetera aún no está configurada. Contacta al administrador
                para activarla.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header con título y botón refresh */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney sx={{ color: 'primary.main' }} />
              <Typography
                variant='subtitle2'
                sx={{ fontWeight: 600 }}
              >
                Tu Cartera
              </Typography>
              <Tooltip title='Saldo disponible en tu cartera'>
                <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Tooltip>
            </Box>
            {onRefresh && (
              <Tooltip title='Actualizar saldo'>
                <IconButton
                  size='small'
                  onClick={onRefresh}
                >
                  <Refresh sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Balance principal */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.lighter',
              borderRadius: 1,
              border: '2px solid',
              borderColor: 'primary.main',
            }}
          >
            <Typography
              variant='caption'
              sx={{ color: 'text.secondary' }}
            >
              Saldo Disponible
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant='h4'
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                }}
              >
                {formatCurrency(wallet.balance)}
              </Typography>
              <Typography
                variant='caption'
                sx={{ color: 'text.secondary' }}
              >
                {wallet.currency}
              </Typography>
            </Box>
          </Box>

          {/* Desglose si showDetails */}
          {showDetails && (
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              {/* Disponible para prestar */}
              <Tooltip title='Dinero que puedes prestar ahora'>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'success.lighter',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'success.light',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp
                      sx={{
                        fontSize: 16,
                        color: 'success.main',
                      }}
                    />
                    <Typography
                      variant='caption'
                      sx={{
                        color: 'success.main',
                        fontWeight: 600,
                      }}
                    >
                      Para Prestar
                    </Typography>
                  </Box>
                  <Typography
                    variant='subtitle2'
                    sx={{
                      fontWeight: 600,
                      color: 'success.main',
                      mt: 0.5,
                    }}
                  >
                    {formatCurrency(wallet.balance)}
                  </Typography>
                </Box>
              </Tooltip>

              {/* Bloqueado en préstamos */}
              <Tooltip title='Dinero comprometido en préstamos activos'>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'warning.lighter',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'warning.light',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Lock
                      sx={{
                        fontSize: 16,
                        color: 'warning.main',
                      }}
                    />
                    <Typography
                      variant='caption'
                      sx={{
                        color: 'warning.main',
                        fontWeight: 600,
                      }}
                    >
                      Bloqueado
                    </Typography>
                  </Box>
                  <Typography
                    variant='subtitle2'
                    sx={{
                      fontWeight: 600,
                      color: 'warning.main',
                      mt: 0.5,
                    }}
                  >
                    $0
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          )}

          {/* Metadata */}
          <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography
              variant='caption'
              sx={{ color: 'text.secondary' }}
            >
              Moneda: <strong>{wallet.currency}</strong>
            </Typography>
            <br />
            <Typography
              variant='caption'
              sx={{ color: 'text.secondary' }}
            >
              Actualizado:{' '}
              <strong>
                {new Date(wallet.updatedAt).toLocaleString('es-AR')}
              </strong>
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default WalletBalanceCard;
