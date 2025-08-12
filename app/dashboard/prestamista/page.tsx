'use client';

import { Typography, Box, Paper } from '@mui/material';
import { People, AccountBalance, TrendingUp } from '@mui/icons-material';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function PrestamistaDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography
        variant='h4'
        component='h1'
        gutterBottom
      >
        Dashboard Prestamista
      </Typography>

      {/* Stats Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        <StatsCard
          title='Clientes Activos'
          value='0'
          icon={<People />}
          color='primary'
        />
        <StatsCard
          title='Préstamos Activos'
          value='$0'
          icon={<AccountBalance />}
          color='warning'
        />
        <StatsCard
          title='Ingresos del Mes'
          value='$0'
          icon={<TrendingUp />}
          color='success'
        />
      </Box>

      {/* Content */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography
          variant='h6'
          gutterBottom
        >
          Gestión de Clientes y Préstamos
        </Typography>
        <Typography
          variant='body1'
          color='text.secondary'
        >
          A desarrollar
        </Typography>
      </Paper>
    </Box>
  );
}
