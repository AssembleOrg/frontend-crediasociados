'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box, Grid, CircularProgress, Typography, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  AccountBalance,
  Savings,
} from '@mui/icons-material';
import PageHeader from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useFinanzas } from '@/hooks/useFinanzas';
import { useUsers } from '@/hooks/useUsers';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { useMemo } from 'react';

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

  const { users } = useUsers();

  // Filter cobradores
  const cobradores = useMemo(() => {
    return users.filter(u => u.role === 'prestamista')
  }, [users])

  // Wallet management
  const {
    wallet,
    isLoading: walletIsLoading,
    refetchWallet,
  } = useUsers(); // Changed from useWallet to useUsers

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

      {/* Wallet Balance Section */}
      {/* Removed WalletBalanceCard */}

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

      {/* Cobradores Summary Table */}
      <Paper sx={{ mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Cobrador</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Capital Asignado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Dinero Prestado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Balance Actual</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cobradores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary">
                      No hay cobradores registrados aún
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cobradores.map((cobrador) => {
                  const assignedCapital = cobrador.wallet?.balance ?? 0
                  const loanedAmount = 0 // This would come from actual loan data
                  const availableBalance = assignedCapital - loanedAmount
                  
                  return (
                    <TableRow key={cobrador.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {cobrador.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cobrador.email}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          ${assignedCapital?.toLocaleString('es-AR') ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 500 }}>
                          ${loanedAmount?.toLocaleString('es-AR') ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                          ${availableBalance?.toLocaleString('es-AR') ?? 0}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
