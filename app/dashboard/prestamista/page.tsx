'use client';

import React from 'react';
import { Typography, Box, Paper, Button, Alert } from '@mui/material';
import { People, AccountBalance, TrendingUp } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useClients } from '@/hooks/useClients';
import { useSubLoans } from '@/hooks/useSubLoans';
import { StandaloneLoanSimulator } from '@/components/loans/StandaloneLoanSimulator';

export default function PrestamistaDashboard() {
  const router = useRouter();
  const { getTotalClients, isLoading } = useClients();
  const { 
    getTotalDueToday,
    getOverdueCount,
    isLoading: subLoansLoading,
    error: subLoansError 
  } = useSubLoans();

  const clientsCount = getTotalClients();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='h4'
          component='h1'
          gutterBottom
        >
          Dashboard Prestamista
        </Typography>
        <Typography
          variant='body1'
          color='text.secondary'
        >
          Gestión de clientes y préstamos de tu cartera
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        <StatsCard
          title='Clientes Activos'
          value={clientsCount}
          subtitle={`cliente${clientsCount !== 1 ? 's' : ''} en tu cartera`}
          icon={<People />}
          color='primary'
          isLoading={isLoading}
        />
        <StatsCard
          title='Vencimientos Hoy'
          value={getTotalDueToday()}
          subtitle='préstamos que vencen hoy'
          icon={<AccountBalance />}
          color='warning'
          isLoading={subLoansLoading}
        />
        <StatsCard
          title='Vencidos'
          value={getOverdueCount()}
          subtitle='requieren atención'
          icon={<TrendingUp />}
          color='error'
          isLoading={subLoansLoading}
        />
      </Box>

      {/* Error de SubLoans */}
      {subLoansError && (
        <Alert severity="error" sx={{ mb: 4 }}>
          <Typography variant="subtitle2">Error al cargar vencimientos:</Typography>
          <Typography variant="body2">{subLoansError}</Typography>
        </Alert>
      )}

      {/* Acceso Rápido a Cobros */}
      {getTotalDueToday() > 0 && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'warning.light' }}>
          <Typography variant="h6" gutterBottom>
            ⚠️ Tienes {getTotalDueToday()} pagos que vencen hoy
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {getOverdueCount() > 0 && `${getOverdueCount()} están vencidos y requieren atención inmediata.`}
          </Typography>
          <Button 
            variant="contained" 
            color="warning"
            onClick={() => router.push('/dashboard/prestamista/cobros')}
          >
            Ir a Cobros del Día
          </Button>
        </Paper>
      )}

      {/* Simulador de Préstamos */}
      <Box sx={{ mb: 4 }}>
        <StandaloneLoanSimulator />
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant='h6'
            gutterBottom
          >
            Gestión de Clientes
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ mb: 2 }}
          >
            {clientsCount > 0 
              ? `Tienes ${clientsCount} cliente${clientsCount !== 1 ? 's' : ''} registrado${clientsCount !== 1 ? 's' : ''} en tu cartera.`
              : 'Aún no tienes clientes registrados en tu cartera.'
            }
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          fullWidth
          onClick={() => router.push('/dashboard/prestamista/clientes')}
        >
          Ir a la sección de Clientes
        </Button>
      </Paper>
    </Box>
  );
}
