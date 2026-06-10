'use client';

import React from 'react';
import { Box, Grid, CircularProgress, Typography, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, useTheme, useMediaQuery, Chip } from '@mui/material';
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
import { useMemo } from 'react';

// Lazy load components (commented out - not used in MVP)
// const ManagersFinancialTable = dynamic(...)
// const PortfolioEvolutionChart = dynamic(...)
// const CapitalDistributionChart = dynamic(...)

export default function SubadminFinanzasPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const {
    financialSummary,
    isLoading,
    error,
  } = useFinanzas();

  const { users } = useUsers();

  // Filter cobradores
  const cobradores = useMemo(() => {
    return users.filter(u => u.role === 'prestamista')
  }, [users])

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

      {/* Cobradores Summary Table / Cards */}
      {/* Desktop Table View */}
      {!isMobile && (
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
                    const loanedAmount = 0
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
      )}

      {/* Mobile Card View */}
      {isMobile && (
        <Box sx={{ mb: 4 }}>
          {cobradores.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No hay cobradores registrados aún
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {cobradores.map((cobrador) => {
                const assignedCapital = cobrador.wallet?.balance ?? 0
                const loanedAmount = 0
                const availableBalance = assignedCapital - loanedAmount

                return (
                  <Grid size={{ xs: 12 }} key={cobrador.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {cobrador.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cobrador.email}
                          </Typography>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              Capital Asignado
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              ${assignedCapital?.toLocaleString('es-AR') ?? 0}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              Dinero Prestado
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                              ${loanedAmount?.toLocaleString('es-AR') ?? 0}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              Balance Actual
                            </Typography>
                            <Chip
                              label={`$${availableBalance?.toLocaleString('es-AR') ?? 0}`}
                              color="success"
                              sx={{ fontWeight: 600 }}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Box>
      )}

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
