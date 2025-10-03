'use client'

import React from 'react'
import { Box, Grid, Alert } from '@mui/material'
import { AttachMoney, TrendingUp, AccountBalance, Savings, Receipt, TrendingDown } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { useFinanzas } from '@/hooks/useFinanzas'

export default function PrestamistaFinanzasPage() {
  const router = useRouter()
  const { financialSummary, isLoading, error } = useFinanzas()

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

      {/* Stats Cards - 6 cards in 3x2 grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Row 1 */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            title="Capital Asignado"
            value={`$${financialSummary?.capitalAsignado.toLocaleString('es-AR') || 0}`}
            subtitle="capital total asignado"
            icon={<AttachMoney />}
            color="primary"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            title="Capital Disponible"
            value={`$${financialSummary?.capitalDisponible.toLocaleString('es-AR') || 0}`}
            subtitle="disponible para prestar"
            icon={<Savings />}
            color="success"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            title="Prestado Activo"
            value={`$${financialSummary?.montoEnPrestamosActivos.toLocaleString('es-AR') || 0}`}
            subtitle="en préstamos activos"
            icon={<AccountBalance />}
            color="warning"
            isLoading={isLoading}
          />
        </Grid>

        {/* Row 2 */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            title="Recaudado Este Mes"
            value={`$${financialSummary?.recaudadoEsteMes.toLocaleString('es-AR') || 0}`}
            subtitle="pagos recibidos"
            icon={<TrendingUp />}
            color="success"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            title="Gastos Este Mes"
            value={`$${financialSummary?.gastosEsteMes.toLocaleString('es-AR') || 0}`}
            subtitle="egresos operativos"
            icon={<TrendingDown />}
            color="error"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
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
