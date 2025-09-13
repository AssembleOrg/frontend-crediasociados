'use client'

import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { People, Assessment } from '@mui/icons-material'
import { useStats } from '@/hooks/useStats'
import { StatsCard } from '@/components/dashboard/StatsCard'
import PageHeader from '@/components/ui/PageHeader'
import StatsGrid from '@/components/ui/StatsGrid'

export default function AdminDashboard() {
  const { stats, totalUsers } = useStats()

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <PageHeader
        title="Dashboard Principal"
        subtitle="Vista global del sistema y gestión de usuarios"
      />

      {/* Stats Grid */}
      <StatsGrid columns={{ xs: 1, sm: 2, lg: 3 }}>
        <StatsCard
          title="Total Usuarios"
          value={totalUsers}
          subtitle="en toda la plataforma"
          icon={<People />}
          color="primary"
        />

        <StatsCard
          title="Sub-Administradores"
          value={stats?.users?.subadmin || 0}
          subtitle="gestores regionales"
          icon={<People />}
          color="success"
        />

        <StatsCard
          title="Prestamistas"
          value={stats?.users?.prestamista || 0}
          subtitle="gestores de préstamos"
          icon={<Assessment />}
          color="warning"
        />
      </StatsGrid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Gestión de Usuarios
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Para gestionar sub-administradores, visita la sección
          &ldquo;Sub-Admins&rdquo; en el menú lateral.
        </Typography>
      </Paper>
    </Box>
  )
}