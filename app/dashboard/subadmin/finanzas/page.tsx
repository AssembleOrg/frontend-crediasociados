'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box, Grid, CircularProgress, Typography, Alert } from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  AccountBalance,
  Savings,
} from '@mui/icons-material';
import PageHeader from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useFinanzas } from '@/hooks/useFinanzas';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';

// Lazy load components
const ManagersFinancialTable = dynamic(
  () => import('@/components/finanzas/ManagersFinancialTable'),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        Cargando tabla...
      </Box>
    ),
  }
);

const PortfolioEvolutionChart = dynamic(
  () => import('@/components/charts/PortfolioEvolutionChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton title='Evolución del Valor de Cartera' />,
  }
);

const CapitalDistributionChart = dynamic(
  () => import('@/components/charts/CapitalDistributionChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton title='Distribución de Capital' />,
  }
);

export default function SubadminFinanzasPage() {
  const {
    financialSummary,
    managersFinancial,
    portfolioEvolution,
    capitalDistribution,
    isLoading,
    error,
  } = useFinanzas();

  if (isLoading && !financialSummary) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress
            size={40}
            sx={{ mb: 2 }}
          />
          <Typography
            variant='body1'
            color='text.secondary'
          >
            Cargando datos financieros...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title='Finanzas'
          subtitle='Gestión financiera de tu equipo'
        />
        <Alert
          severity='error'
          sx={{ mt: 2 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title='Finanzas'
        subtitle='Gestión financiera de tu equipo'
      />

      {/* Stats Cards */}
      <Grid
        container
        spacing={3}
        sx={{ mb: 4 }}
      >
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title='Capital Asignado'
            value={`$${
              financialSummary?.capitalAsignado.toLocaleString('es-AR') || 0
            }`}
            subtitle='total asignado a cobradores'
            icon={<AttachMoney />}
            color='primary'
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title='Capital Disponible'
            value={`$${
              financialSummary?.capitalDisponible.toLocaleString('es-AR') || 0
            }`}
            subtitle='no prestado aún'
            icon={<Savings />}
            color='success'
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title='Prestado Activo'
            value={`$${
              financialSummary?.montoEnPrestamosActivos.toLocaleString(
                'es-AR'
              ) || 0
            }`}
            subtitle='en préstamos activos'
            icon={<AccountBalance />}
            color='warning'
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title='Valor de Cartera'
            value={`$${
              financialSummary?.valorCartera.toLocaleString('es-AR') || 0
            }`}
            subtitle='valor total de la cartera'
            icon={<TrendingUp />}
            color='primary'
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Managers Financial Table */}
      {/* <Box sx={{ mb: 4 }}>
        <ManagersFinancialTable
          managers={managersFinancial}
          isLoading={isLoading}
        />
      </Box> */}

      {/* Charts */}
      {/* <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <PortfolioEvolutionChart
            data={portfolioEvolution}
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <CapitalDistributionChart
            data={capitalDistribution}
            isLoading={isLoading}
          />
        </Grid>
      </Grid> */}
    </Box>
  );
}
