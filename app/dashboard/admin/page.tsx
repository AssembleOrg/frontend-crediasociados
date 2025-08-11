'use client';

import { useEffect } from 'react';
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

export default function AdminDashboard() {
  const { stats, loading, actualizarStats } = useStatsStore();

  useEffect(() => {
    actualizarStats();
  }, [actualizarStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const mockPrestamistas = [
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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <Typography>Cargando estadísticas...</Typography>
      </Box>
    );
  }

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
            Dashboard Administrativo
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
          >
            Resumen general del sistema y gestión de prestamistas
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
          Nuevo Prestamista
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
          title='Prestamistas'
          value={stats.prestamistasCantidad}
          subtitle='usuarios activos en el sistema'
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
            Prestamistas Registrados
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Prestamista</TableCell>
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
                {mockPrestamistas.map((prestamista) => (
                  <TableRow
                    key={prestamista.id}
                    hover
                  >
                    <TableCell>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 500 }}
                      >
                        {prestamista.nombre}
                      </Typography>
                      {/* Info adicional en mobile */}
                      <Typography 
                        variant='caption' 
                        color='text.secondary'
                        sx={{ display: { xs: 'block', sm: 'none' } }}
                      >
                        {prestamista.clientesActivos} clientes • {prestamista.email}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 500 }}
                      >
                        {formatCurrency(prestamista.montoTotal)}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={prestamista.estado}
                        color={getEstadoColor(prestamista.estado)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell align='center' sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {prestamista.clientesActivos}
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
