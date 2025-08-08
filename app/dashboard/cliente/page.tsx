/* eslint-disable @typescript-eslint/no-explicit-any */
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
  LinearProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  AccountBalance,
  Warning,
  CheckCircle,
  TrendingDown,
} from '@mui/icons-material';
import { usePrestamosStore } from '@/stores/prestamos';
import { useAuthStore } from '@/stores/auth';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function ClienteDashboard() {
  const { prestamos, setPrestamos } = usePrestamosStore();
  const { user } = useAuthStore();

  // Mock data para el cliente demo
  useEffect(() => {
    if (prestamos.length === 0 && user?.id === '3') {
      const mockPrestamos = [
        {
          id: 'prestamo-cliente-1',
          clienteId: user.id,
          prestamistaId: 'prestamista-1',
          monto: 50000,
          interes: 20,
          tipoInteres: 'mensual' as const,
          cuotas: 6,
          montoTotal: 60000,
          valorCuota: 10000,
          fechaInicio: new Date('2024-01-15'),
          fechaVencimiento: new Date('2024-07-15'),
          estado: 'activo' as const,
          pagos: [
            {
              id: 'pago-1',
              prestamoId: 'prestamo-cliente-1',
              numeroCuota: 1,
              monto: 10000,
              fechaPago: new Date('2024-01-15'),
              fechaVencimiento: new Date('2024-01-15'),
              estado: 'pagado' as const,
            },
            {
              id: 'pago-2',
              prestamoId: 'prestamo-cliente-1',
              numeroCuota: 2,
              monto: 10000,
              fechaPago: new Date('2024-02-15'),
              fechaVencimiento: new Date('2024-02-15'),
              estado: 'pagado' as const,
            },
            {
              id: 'pago-3',
              prestamoId: 'prestamo-cliente-1',
              numeroCuota: 3,
              monto: 10000,
              fechaPago: new Date(),
              fechaVencimiento: new Date('2024-03-15'),
              estado: 'pendiente' as const,
            },
            {
              id: 'pago-4',
              prestamoId: 'prestamo-cliente-1',
              numeroCuota: 4,
              monto: 10000,
              fechaPago: new Date(),
              fechaVencimiento: new Date('2024-04-15'),
              estado: 'pendiente' as const,
            },
          ],
        },
        {
          id: 'prestamo-cliente-2',
          clienteId: user.id,
          prestamistaId: 'prestamista-2',
          monto: 30000,
          interes: 15,
          tipoInteres: 'mensual' as const,
          cuotas: 3,
          montoTotal: 34500,
          valorCuota: 11500,
          fechaInicio: new Date('2024-02-01'),
          fechaVencimiento: new Date('2024-05-01'),
          estado: 'completado' as const,
          pagos: [],
        },
      ];

      setPrestamos(mockPrestamos);
    }
  }, [prestamos.length, user?.id, setPrestamos]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR');
  };

  const misPrestamos = prestamos.filter((p) => p.clienteId === user?.id);
  const prestamosActivos = misPrestamos.filter((p) => p.estado === 'activo');
  const deudaTotal = prestamosActivos.reduce((sum, p) => {
    const pagosPendientes = p.pagos.filter(
      (pago) => pago.estado === 'pendiente'
    );
    return sum + pagosPendientes.length * p.valorCuota;
  }, 0);

  const totalPagado = misPrestamos.reduce((sum, p) => {
    const pagosPagados = p.pagos.filter((pago) => pago.estado === 'pagado');
    return sum + pagosPagados.length * p.valorCuota;
  }, 0);

  const cuotasVencidas = prestamosActivos.reduce((count, p) => {
    const vencidas = p.pagos.filter(
      (pago) =>
        pago.estado === 'pendiente' &&
        new Date(pago.fechaVencimiento) < new Date()
    );
    return count + vencidas.length;
  }, 0);

  const getEstadoPagoColor = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'vencido':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProgresoCredito = (prestamo: any) => {
    const pagosPagados = prestamo.pagos.filter(
      (p: any) => p.estado === 'pagado'
    ).length;
    return Math.round((pagosPagados / prestamo.cuotas) * 100);
  };

  return (
    <Box>
      {/* Header - Responsive */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='h4'
          sx={{
            fontWeight: 600,
            mb: 1,
            fontSize: { xs: '1.5rem', sm: '2.125rem' },
          }}
        >
          Mi Dashboard
        </Typography>
        <Typography
          variant='body1'
          color='text.secondary'
        >
          Bienvenido {user?.name}, aquí puedes ver el estado de tus préstamos
        </Typography>
      </Box>

      {/* Alert for overdue payments */}
      {cuotasVencidas > 0 && (
        <Alert
          severity='warning'
          sx={{ mb: 4 }}
          icon={<Warning />}
        >
          Tienes {cuotasVencidas} cuota{cuotasVencidas > 1 ? 's' : ''} vencida
          {cuotasVencidas > 1 ? 's' : ''}. Contacta a tu prestamista para
          regularizar tu situación.
        </Alert>
      )}

      {/* Stats Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        <StatsCard
          title='Préstamos Activos'
          value={prestamosActivos.length}
          subtitle='préstamos vigentes'
          icon={<AccountBalance />}
          color='primary'
        />

        <StatsCard
          title='Deuda Total'
          value={formatCurrency(deudaTotal)}
          subtitle='monto pendiente'
          icon={<TrendingDown />}
          color={deudaTotal > 0 ? 'error' : 'success'}
        />

        <StatsCard
          title='Total Pagado'
          value={formatCurrency(totalPagado)}
          subtitle='pagos realizados'
          icon={<CheckCircle />}
          color='success'
        />

        <StatsCard
          title='Cuotas Vencidas'
          value={cuotasVencidas}
          subtitle='requieren atención'
          icon={<Warning />}
          color={cuotasVencidas > 0 ? 'error' : 'success'}
        />
      </Box>

      {/* Prestamos Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        {prestamosActivos.map((prestamo) => {
          const progreso = getProgresoCredito(prestamo);
          const cuotasPagadas = prestamo.pagos.filter(
            (p) => p.estado === 'pagado'
          ).length;
          const proximaCuota = prestamo.pagos.find(
            (p) => p.estado === 'pendiente'
          );

          return (
            <Card
              sx={{ height: '100%' }}
              key={prestamo.id}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant='h6'
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Préstamo #{prestamo.id.slice(-4)}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                    >
                      {formatCurrency(prestamo.monto)} - {prestamo.interes}%{' '}
                      {prestamo.tipoInteres}
                    </Typography>
                  </Box>
                  <Chip
                    label={prestamo.estado}
                    color={prestamo.estado === 'activo' ? 'success' : 'default'}
                    size='small'
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant='body2'>
                      Progreso: {cuotasPagadas}/{prestamo.cuotas} cuotas
                    </Typography>
                    <Typography variant='body2'>{progreso}%</Typography>
                  </Box>
                  <LinearProgress
                    variant='determinate'
                    value={progreso}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor:
                          progreso === 100 ? 'success.main' : 'primary.main',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>

                {proximaCuota && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant='subtitle2'
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Próxima Cuota
                    </Typography>
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography variant='body2'>
                        {formatCurrency(proximaCuota.monto)}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                      >
                        Vence: {formatDate(proximaCuota.fechaVencimiento)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                    >
                      Valor cuota
                    </Typography>
                    <Typography
                      variant='h6'
                      sx={{ fontWeight: 600 }}
                    >
                      {formatCurrency(prestamo.valorCuota)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                    >
                      Total a pagar
                    </Typography>
                    <Typography
                      variant='h6'
                      sx={{ fontWeight: 600 }}
                    >
                      {formatCurrency(prestamo.montoTotal)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Historial de Pagos */}
      <Paper elevation={1}>
        <Box sx={{ p: 3 }}>
          <Typography
            variant='h6'
            sx={{ mb: 3, fontWeight: 600 }}
          >
            Historial de Cuotas
          </Typography>

          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Préstamo</TableCell>
                  <TableCell align='right'>Monto</TableCell>
                  <TableCell align='center'>Estado</TableCell>
                  <TableCell
                    align='center'
                    sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                  >
                    Vencimiento
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ display: { xs: 'none', md: 'table-cell' } }}
                  >
                    Fecha Pago
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prestamosActivos.flatMap((prestamo) =>
                  prestamo.pagos.map((pago) => (
                    <TableRow
                      key={pago.id}
                      hover
                    >
                      <TableCell>
                        <Typography
                          variant='subtitle2'
                          sx={{ fontWeight: 500 }}
                        >
                          #{prestamo.id.slice(-4)} - Cuota {pago.numeroCuota}
                        </Typography>
                        {/* Info adicional en mobile */}
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: { xs: 'block', sm: 'none' } }}
                        >
                          Vence: {formatDate(pago.fechaVencimiento)}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        {formatCurrency(pago.monto)}
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={pago.estado}
                          color={getEstadoPagoColor(pago.estado)}
                          size='small'
                        />
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                      >
                        {formatDate(pago.fechaVencimiento)}
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', md: 'table-cell' } }}
                      >
                        {pago.estado === 'pagado'
                          ? formatDate(pago.fechaPago)
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {prestamosActivos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align='center'
                    >
                      <Typography
                        variant='body2'
                        color='text.secondary'
                      >
                        No tienes préstamos activos
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Box>
  );
}
