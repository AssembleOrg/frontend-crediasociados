'use client'

import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { People } from '@mui/icons-material'
import { useStats } from '@/hooks/useStats'
import { StatsCard } from '@/components/dashboard/StatsCard'
import PageHeader from '@/components/ui/PageHeader'
import StatsGrid from '@/components/ui/StatsGrid'

export default function SubadminDashboard() {
  const { stats } = useStats()

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <PageHeader
        title="Dashboard Sub-Administrativo"
        subtitle="Gestión de prestamistas en tu región"
      />

      {/* Stats Grid */}
      <StatsGrid columns={{ xs: 1, sm: 1, lg: 1 }} minWidth="400px">
        <StatsCard
          title="Prestamistas"
          value={stats?.users?.prestamista || 0}
          subtitle="prestamistas activos en tu región"
          icon={<People />}
          color="primary"
        />
      </StatsGrid>

      {/* Simple Info */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Gestión de Prestamistas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Para gestionar los prestamistas de tu región, visita la sección
          &ldquo;Managers&rdquo; en el menú lateral.
        </Typography>
      </Paper>
    </Box>
  )
}