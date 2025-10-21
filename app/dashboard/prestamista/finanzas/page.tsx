'use client'

import React from 'react'
import { Box, Grid, Alert } from '@mui/material'
import { TrendingUp, AccountBalance, Savings, Receipt } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { WalletBalanceCard } from '@/components/wallet/WalletBalanceCard'
import { useFinanzas } from '@/hooks/useFinanzas'
import { useWallet } from '@/hooks/useWallet'

export default function PrestamistaFinanzasPage() {
  const router = useRouter()
  const { financialSummary, isLoading, error } = useFinanzas()
  const {
    wallet,
    isLoading: walletIsLoading,
    refetchWallet,
  } = useWallet()

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader title="Finanzas" subtitle="Estado financiero de tu cartera" />
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Finanzas"
        subtitle="Estado financiero de tu cartera"
        actions={[
          {
            label: 'Ver Operativa',
            onClick: () => router.push('/dashboard/prestamista/operativo'),
            variant: 'outlined',
            startIcon: <Receipt />
          }
        ]}
      />

      {/* Wallet Balance Section */}
      <Box sx={{ mb: 4 }}>
        <WalletBalanceCard
          wallet={wallet}
          isLoading={walletIsLoading}
          onRefresh={refetchWallet}
          showDetails={true}
        />
      </Box>

      {/* Stats Cards - 4 essential cards (2x2 mobile, 1x4 desktop) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Capital Disponible"
            value={`$${financialSummary?.capitalDisponible.toLocaleString('es-AR') || 0}`}
            subtitle="disponible para prestar"
            icon={<Savings />}
            color="success"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Prestado Activo"
            value={`$${financialSummary?.montoEnPrestamosActivos.toLocaleString('es-AR') || 0}`}
            subtitle="en préstamos activos"
            icon={<AccountBalance />}
            color="warning"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Recaudado Este Mes"
            value={`$${financialSummary?.recaudadoEsteMes.toLocaleString('es-AR') || 0}`}
            subtitle="pagos recibidos"
            icon={<TrendingUp />}
            color="success"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Valor de Cartera"
            value={`$${financialSummary?.valorCartera.toLocaleString('es-AR') || 0}`}
            subtitle="valor total de la cartera"
            icon={<TrendingUp />}
            color="primary"
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Info Box */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'info.lighter',
          borderRadius: 2,
          border: 1,
          borderColor: 'info.main'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Receipt color="info" />
          <Box sx={{ fontWeight: 600, color: 'info.main' }}>
            Registros Detallados
          </Box>
        </Box>
        <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Para ver el detalle completo de ingresos y egresos, visita la sección{' '}
          <Box
            component="span"
            onClick={() => router.push('/dashboard/prestamista/operativo')}
            sx={{
              color: 'primary.main',
              cursor: 'pointer',
              textDecoration: 'underline',
              '&:hover': {
                color: 'primary.dark'
              }
            }}
          >
            Operativa
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
