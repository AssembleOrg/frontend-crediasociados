'use client';

import React from 'react';
import { Typography, Box, Paper, Button } from '@mui/material';
import { People, AccountBalance, TrendingUp } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useClients } from '@/hooks/useClients';
import { StandaloneLoanSimulator } from '@/components/loans/StandaloneLoanSimulator';

export default function PrestamistaDashboard() {
  const router = useRouter();
  const { getTotalClients, isLoading } = useClients();

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
          title='Préstamos Activos'
          value='$0'
          subtitle='próximamente'
          icon={<AccountBalance />}
          color='warning'
        />
        <StatsCard
          title='Ingresos del Mes'
          value='$0'
          subtitle='próximamente'
          icon={<TrendingUp />}
          color='success'
        />
      </Box>

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
