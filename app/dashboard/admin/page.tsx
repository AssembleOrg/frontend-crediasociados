'use client'

import React from 'react'
import { Box, Grid, Alert } from '@mui/material'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import PageHeader from '@/components/ui/PageHeader'
import ManagersPerSubadminChart from '@/components/charts/ManagersPerSubadminChart'
import AmountPerSubadminChart from '@/components/charts/AmountPerSubadminChart'
import ClientsEvolutionChart from '@/components/charts/ClientsEvolutionChart'

export default function AdminDashboard() {
  const {
    chartData,
    isBasicLoading,
    isDetailedLoading,
    error
  } = useAdminDashboard()

  const isLoading = isBasicLoading || isDetailedLoading

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


      {/* Main Charts Row 1 - Larger charts for desktop */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ManagersPerSubadminChart
            data={chartData.managersPerSubadmin}
            isLoading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <AmountPerSubadminChart
            data={chartData.amountPerSubadmin}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Main Charts Row 2 - Full width evolution chart */}
      <Grid container spacing={4}>
        <Grid size={12}>
          <ClientsEvolutionChart
            data={chartData.clientsEvolution}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>
    </Box>
  )
}