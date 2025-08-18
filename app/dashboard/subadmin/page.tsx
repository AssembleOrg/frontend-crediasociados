'use client';

import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { People } from '@mui/icons-material';
import { useStats } from '@/hooks/useStats';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function SubadminDashboard() {
  const { stats } = useStats();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='h4'
          component='h1'
          gutterBottom
        >
          Dashboard Sub-Administrativo
        </Typography>
        <Typography
          variant='body1'
          color='text.secondary'
        >
          Gestión de prestamistas en tu región
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr',
            lg: '1fr',
          },
          gap: 3,
          mb: 4,
          maxWidth: 400,
        }}
      >
        <StatsCard
          title='Prestamistas'
          value={stats?.users?.prestamista || 0}
          subtitle='prestamistas activos en tu región'
          icon={<People />}
          color='primary'
        />
      </Box>

      {/* Simple Info */}
      <Paper sx={{ p: 3 }}>
        <Typography
          variant='h6'
          gutterBottom
        >
          Gestión de Prestamistas
        </Typography>
        <Typography
          variant='body1'
          color='text.secondary'
        >
          Para gestionar los prestamistas de tu región, visita la sección
          &ldquo;Managers&rdquo; en el menú lateral.
        </Typography>
      </Paper>
    </Box>
  );
}
