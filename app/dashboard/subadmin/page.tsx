'use client';

import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  People,
  AccountBalance,
  Assessment,
  Add,
} from '@mui/icons-material';
import { useStatsStore } from '@/stores/stats';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function SubadminDashboard() {
  const { dashboardStats: stats } = useStatsStore();


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const mockManagers = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan@prestamito.com',
      clientesActivos: 15,
      montoTotal: 450000,
      estado: 'activo',
    },
    {
      id: 2,
      nombre: 'María González',
      email: 'maria@prestamito.com',
      clientesActivos: 23,
      montoTotal: 680000,
      estado: 'activo',
    },
    {
      id: 3,
      nombre: 'Carlos López',
      email: 'carlos@prestamito.com',
      clientesActivos: 8,
      montoTotal: 220000,
      estado: 'inactivo',
    },
  ];

  const getEstadoColor = (estado: string) => {
    return estado === 'activo' ? 'success' : 'default';
  };


  return (
    <Box>
      {/* Header - Responsive */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 3, sm: 0 }
        }}
      >
        <Box>
          <Typography
            variant='h4'
            sx={{ 
              fontWeight: 600, 
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2.125rem' }
            }}
          >
            Dashboard Sub-Administrativo
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
          >
            Resumen general y gestión de managers
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<Add />}
          sx={{ 
            height: 'fit-content',
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Nuevo Manager
        </Button>
      </Box>

      {/* Stats Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        <StatsCard
          title='Total Préstamos'
          value={stats.totalPrestamos}
          subtitle='préstamos registrados'
          icon={<AccountBalance />}
          color='primary'
          trend={{ value: 12, label: 'vs mes anterior', isPositive: true }}
        />

        <StatsCard
          title='Monto Total'
          value={formatCurrency(stats.montoTotalPrestado)}
          subtitle='capital prestado'
          icon={<TrendingUp />}
          color='success'
          trend={{ value: 8, label: 'vs mes anterior', isPositive: true }}
        />

        <StatsCard
          title='Clientes Activos'
          value={stats.clientesActivos}
          subtitle='clientes con préstamos'
          icon={<People />}
          color='warning'
          progress={Math.round((stats.clientesActivos / 120) * 100)}
        />

        <StatsCard
          title='Tasa de Cobranza'
          value={`${stats.tasaCobranza}%`}
          subtitle='efectividad de cobros'
          icon={<Assessment />}
          color={stats.tasaCobranza > 70 ? 'success' : 'error'}
          progress={stats.tasaCobranza}
        />
      </Box>

      {/* Additional Stats Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        <StatsCard
          title='Managers'
          value={stats.prestamistasCantidad}
          subtitle='usuarios activos bajo su gestión'
          icon={<People />}
          color='primary'
        />

        <StatsCard
          title='Préstamos Vencidos'
          value={stats.prestamosVencidos}
          subtitle='requieren seguimiento'
          icon={<AccountBalance />}
          color='error'
        />
      </Box>

      {/* Prestamistas Table */}
      <Paper elevation={1}>
        <Box sx={{ p: 3 }}>
          <Typography
            variant='h6'
            sx={{ mb: 3, fontWeight: 600 }}
          >
            Managers Registrados
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Manager</TableCell>
                  <TableCell align='right'>Monto Total</TableCell>
                  <TableCell align='center'>Estado</TableCell>
                  <TableCell align='center' sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    Clientes
                  </TableCell>
                  <TableCell align='center' sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockManagers.map((manager) => (
                  <TableRow
                    key={manager.id}
                    hover
                  >
                    <TableCell>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 500 }}
                      >
                        {manager.nombre}
                      </Typography>
                      {/* Info adicional en mobile */}
                      <Typography 
                        variant='caption' 
                        color='text.secondary'
                        sx={{ display: { xs: 'block', sm: 'none' } }}
                      >
                        {manager.clientesActivos} clientes • {manager.email}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 500 }}
                      >
                        {formatCurrency(manager.montoTotal)}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={manager.estado}
                        color={getEstadoColor(manager.estado)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell align='center' sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {manager.clientesActivos}
                    </TableCell>
                    <TableCell align='center' sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      <Button
                        size='small'
                        variant='outlined'
                      >
                        Ver Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Box>
  );
}
