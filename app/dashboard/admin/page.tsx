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


      {/* Main Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <ManagersPerSubadminChart
            data={chartData.managersPerSubadmin}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <AmountPerSubadminChart
            data={chartData.amountPerSubadmin}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Main Charts Row 2 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ClientsEvolutionChart
            data={chartData.clientsEvolution}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>
    </Box>
  )
}