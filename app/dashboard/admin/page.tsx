'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Box, Grid, Alert, Button, useMediaQuery } from '@mui/material'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData'
import PageHeader from '@/components/ui/PageHeader'
import { ChartSkeleton, BarChartSkeleton } from '@/components/ui/ChartSkeleton'

// Lazy load charts to reduce initial bundle size
const ManagersPerSubadminChart = dynamic(
  () => import('@/components/charts/ManagersPerSubadminChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Managers por Sub-Administrador" />
  }
)

const ClientsEvolutionChart = dynamic(
  () => import('@/components/charts/ClientsEvolutionChart'),
  {
    ssr: false,
    loading: () => <BarChartSkeleton title="Clientes Nuevos por Semana" />
  }
)

export default function AdminDashboard() {
  const {
    chartData,
    isLoading,
    error
  } = useAdminDashboardData()

  // Responsive logic for mobile
  const isMobile = useMediaQuery('(max-width:600px)')
  const [showAllCharts, setShowAllCharts] = useState(false)

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Dashboard Principal"
          subtitle="Gestión de red y análisis"
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <PageHeader
        title="Dashboard Principal"
        subtitle="Gestión de red y análisis"
      />


      {/* Main Charts - Responsive Grid */}
      <Grid container spacing={4}>
        {/* Mobile: ManagersPerSubadmin first (always visible) */}
        {isMobile && (
          <Grid size={{ xs: 12 }}>
            <ManagersPerSubadminChart
              data={chartData.managersPerSubadmin}
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

        {/* Desktop or Mobile with showAllCharts */}
        {(!isMobile || showAllCharts) && (
          <>
            {!isMobile && (
              <Grid size={{ xs: 12, lg: 6 }}>
                <ManagersPerSubadminChart
                  data={chartData.managersPerSubadmin}
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
      </Grid>
    </Box>
  )
}