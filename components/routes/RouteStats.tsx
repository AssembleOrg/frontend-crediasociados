'use client';

import { Box, Paper, Typography, Stack } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance } from '@mui/icons-material';

interface RouteStatsProps {
  totalCollected: number;
  totalExpenses: number;
  netAmount: number;
  currency?: string;
}

/**
 * RouteStats - Mobile-first stats display
 * Shows collected, expenses, and net amount
 */
export function RouteStats({
  totalCollected,
  totalExpenses,
  netAmount,
  currency = 'ARS', // Mantenido para compatibilidad pero no usado visualmente
}: RouteStatsProps) {
  const formatCurrency = (amount: number) => {
    // Formato genérico sin especificar país o moneda
    return `$${new Intl.NumberFormat('es', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const stats = [
    {
      label: 'Cobrado',
      value: totalCollected,
      icon: <TrendingUp fontSize="small" />,
      color: 'success.main',
      bgColor: 'success.lighter',
    },
    {
      label: 'Gastos',
      value: totalExpenses,
      icon: <TrendingDown fontSize="small" />,
      color: 'error.main',
      bgColor: 'error.lighter',
    },
    {
      label: 'Neto',
      value: netAmount,
      icon: <AccountBalance fontSize="small" />,
      color: 'primary.main',
      bgColor: 'primary.lighter',
    },
  ];

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ width: '100%' }}
    >
      {stats.map((stat, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            flex: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            minHeight: { xs: 90, sm: 100 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box
              sx={{
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: stat.bgColor,
              }}
            >
              {stat.icon}
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.875rem', fontWeight: 500 }}
            >
              {stat.label}
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: stat.color,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            {formatCurrency(stat.value)}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}
