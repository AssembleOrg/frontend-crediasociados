'use client';

import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { People, Assessment } from '@mui/icons-material';
import { useStats } from '@/hooks/useStats';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function AdminDashboard() {
  const { stats, totalUsers } = useStats();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='h4'
          component='h1'
          gutterBottom
        >
          Dashboard Principal
        </Typography>
        <Typography
          variant='body1'
          color='text.secondary'
        >
          Vista global del sistema y gestión de usuarios
        </Typography>
      </Box>

      {/* Stats Grids */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        <StatsCard
          title='Total Usuarios'
          value={totalUsers}
          subtitle='en toda la plataforma'
          icon={<People />}
          color='primary'
        />

        <StatsCard
          title='Sub-Administradores'
          value={stats?.users?.subadmin || 0}
          subtitle='gestores regionales'
          icon={<People />}
          color='success'
        />

        <StatsCard
          title='Prestamistas'
          value={stats?.users?.prestamista || 0}
          subtitle='gestores de préstamos'
          icon={<Assessment />}
          color='warning'
        />
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography
          variant='h6'
          gutterBottom
        >
          Gestión de Usuarios
        </Typography>
        <Typography
          variant='body1'
          color='text.secondary'
        >
          Para gestionar sub-administradores, visita la sección
          &ldquo;Sub-Admins&rdquo; en el menú lateral.
        </Typography>
      </Paper>
    </Box>
  );
}
