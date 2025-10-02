'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Box, CircularProgress, Typography, Alert, Grid, Button, useMediaQuery } from '@mui/material'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import PageHeader from '@/components/ui/PageHeader'
import { useSubadminDashboardData } from '@/hooks/useSubadminDashboardData'
import { useSubadminCharts } from '@/hooks/useSubadminCharts'
import { ChartSkeleton, BarChartSkeleton } from '@/components/ui/ChartSkeleton'
import type { ManagerAnalytics } from '@/services/analytics.service'

// Lazy load charts to reduce initial bundle size
const ClientesPerAsociadoChart = dynamic(
  () => import('@/components/charts/ClientesPerAsociadoChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Clientes por Manager" />
  }
)

const ClientsEvolutionChart = dynamic(
  () => import('@/components/charts/ClientsEvolutionChart'),
  {
    ssr: false,
    loading: () => <BarChartSkeleton title="Clientes Nuevos por Semana" />
  }
)

const ManagerPerformanceChart = dynamic(
  () => import('@/components/charts/ManagerPerformanceChart'),
  {
    ssr: false,
    loading: () => <BarChartSkeleton title="Rendimiento por Manager" />
  }
)

export default function SubadminDashboard() {
  const {
    detailedManagers,
    isLoading,
    error
  } = useSubadminDashboardData()

  const chartData = useSubadminCharts()

  // Responsive logic for mobile
  const isMobile = useMediaQuery('(max-width:600px)')
  const [showAllCharts, setShowAllCharts] = useState(false)

  const managersForChart: ManagerAnalytics[] = detailedManagers.map(manager => ({
    managerId: manager.id,
    managerName: manager.name,
    managerEmail: manager.email,
    totalClients: manager.totalClients,
    totalLoans: manager.totalLoans,
    totalAmountLent: manager.totalAmount,
    totalAmountPending: 0,
    collectionRate: 0,
    createdAt: new Date().toISOString()
  }))

  if (isLoading && detailedManagers.length === 0) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Cargando dashboard...
          </Typography>
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Dashboard Sub-Administrativo"
          subtitle="Gestión de prestamistas en tu región"
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Dashboard Sub-Administrativo"
        subtitle="Gestión de prestamistas en tu región"
      />

      <Grid container spacing={4}>
        {/* Mobile: ClientesPerAsociado first (always visible) */}
        {isMobile && (
          <Grid size={{ xs: 12 }}>
            <ClientesPerAsociadoChart
              data={chartData.clientesPerManager}
              isLoading={isLoading}
            />
          </Grid>
        )}

        {/* Mobile: "Ver Más" button */}
        {isMobile && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 1,
              mb: 1
            }}>
              <Button
                variant={showAllCharts ? 'outlined' : 'contained'}
                onClick={() => setShowAllCharts(!showAllCharts)}
                startIcon={showAllCharts ? <ExpandLess /> : <ExpandMore />}
                fullWidth
                sx={{ maxWidth: 400 }}
              >
                {showAllCharts ? 'Ocultar Estadísticas' : 'Ver Más Estadísticas'}
              </Button>
            </Box>
          </Grid>
        )}

        {/* Desktop or Mobile with showAllCharts: top row */}
        {(!isMobile || showAllCharts) && (
          <>
            {!isMobile && (
              <Grid size={{ xs: 12, lg: 6 }}>
                <ClientesPerAsociadoChart
                  data={chartData.clientesPerManager}
                  isLoading={isLoading}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, lg: 6 }}>
              <ClientsEvolutionChart
                data={chartData.clientsEvolution}
                isLoading={isLoading}
              />
            </Grid>
          </>
        )}

        {/* Desktop or Mobile with showAllCharts: ManagerPerformance */}
        {(!isMobile || showAllCharts) && (
          <Grid size={{ xs: 12 }}>
            <ManagerPerformanceChart
              managers={managersForChart}
              isLoading={isLoading}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  )
}