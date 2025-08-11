'use client';

import { useEffect, useState, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from '@mui/material';
import {
  People,
  AccountBalance,
  TrendingUp,
  Add,
  Person,
} from '@mui/icons-material';
import { useClientesStore, usePrestamosStore } from '@/stores';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function PrestamistaDashboard() {
  const { clientes, agregarCliente } = useClientesStore();
  const { prestamos, agregarPrestamo } = usePrestamosStore();
  const initializedRef = useRef(false);
  const [openClienteDialog, setOpenClienteDialog] = useState(false);
  const [openPrestamoDialog, setOpenPrestamoDialog] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    ocupacion: '',
    prestamistaId: 'prestamista-1',
  });

  const [nuevoPrestamo, setNuevoPrestamo] = useState({
    clienteId: '',
    prestamistaId: 'prestamista-1',
    monto: 0,
    interes: 0,
    tipoInteres: 'mensual' as 'diario' | 'mensual',
    cuotas: 0,
    fechaInicio: new Date(),
    fechaVencimiento: new Date(),
  });

  // Mock data para mostrar funcionalidad - solo una vez
  useEffect(() => {
    if (!initializedRef.current && clientes.length === 0) {
      initializedRef.current = true;
      
      // Agregar clientes de ejemplo
      agregarCliente({
        nombre: 'Ana García',
        dni: '12345678',
        email: 'ana@email.com',
        telefono: '+54911234567',
        direccion: 'Av. Corrientes 1234',
        ocupacion: 'Comerciante',
        prestamistaId: 'prestamista-1',
      });

      agregarCliente({
        nombre: 'Roberto Fernández',
        dni: '87654321',
        email: 'roberto@email.com',
        telefono: '+54917654321',
        direccion: 'San Martín 567',
        ocupacion: 'Empleado',
        prestamistaId: 'prestamista-1',
      });
    }
  }, [clientes.length, agregarCliente]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const handleAgregarCliente = () => {
    if (nuevoCliente.nombre && nuevoCliente.dni) {
      agregarCliente(nuevoCliente);
      setNuevoCliente({
        nombre: '',
        dni: '',
        email: '',
        telefono: '',
        direccion: '',
        ocupacion: '',
        prestamistaId: 'prestamista-1',
      });
      setOpenClienteDialog(false);
    }
  };
  //* TESTEAR Y MOVERLOGICA
  const handleAgregarPrestamo = () => {
    if (
      nuevoPrestamo.clienteId &&
      nuevoPrestamo.monto > 0 &&
      nuevoPrestamo.cuotas > 0
    ) {
      // 1. Calcula los valores que faltan
      // Nota: Este es un cálculo de interés simple. Ajústalo si tu lógica es diferente.
      const montoTotalCalculado =
        nuevoPrestamo.monto * (1 + nuevoPrestamo.interes / 100);
      const valorCuotaCalculado = montoTotalCalculado / nuevoPrestamo.cuotas;

      // 2. Crea el objeto completo que cumple con el tipo `Prestamo`
      const prestamoParaAgregar = {
        ...nuevoPrestamo,
        montoTotal: montoTotalCalculado,
        valorCuota: valorCuotaCalculado,
        estado: 'activo' as const,
      };

      agregarPrestamo(prestamoParaAgregar);

      setNuevoPrestamo({
        clienteId: '',
        prestamistaId: 'prestamista-1',
        monto: 0,
        interes: 0,
        tipoInteres: 'mensual',
        cuotas: 0,
        fechaInicio: new Date(),
        fechaVencimiento: new Date(),
      });
      setOpenPrestamoDialog(false);
    }
  };

  const prestamosActivos = prestamos.filter((p) => p.estado === 'activo');
  const montoTotalPrestado = prestamosActivos.reduce(
    (sum, p) => sum + p.monto,
    0
  );
  const montoTotalCobrar = prestamosActivos.reduce(
    (sum, p) => sum + p.montoTotal,
    0
  );

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
          gap: { xs: 3, sm: 0 },
        }}
      >
        <Box>
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
            Gestiona tus clientes y préstamos activos
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Button
            variant='outlined'
            startIcon={<Person />}
            onClick={() => setOpenClienteDialog(true)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Nuevo Cliente
          </Button>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => setOpenPrestamoDialog(true)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Nuevo Préstamo
          </Button>
        </Box>
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
          title='Mis Clientes'
          value={clientes.length}
          subtitle='clientes registrados'
          icon={<People />}
          color='primary'
        />

        <StatsCard
          title='Préstamos Activos'
          value={prestamosActivos.length}
          subtitle='préstamos vigentes'
          icon={<AccountBalance />}
          color='success'
        />

        <StatsCard
          title='Capital Prestado'
          value={formatCurrency(montoTotalPrestado)}
          subtitle='monto total prestado'
          icon={<TrendingUp />}
          color='warning'
        />

        <StatsCard
          title='A Cobrar'
          value={formatCurrency(montoTotalCobrar)}
          subtitle='monto total con intereses'
          icon={<TrendingUp />}
          color='error'
        />
      </Box>

      {/* Recent Activity */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
          gap: 3,
        }}
      >
        {/* Clientes Table */}
        <Paper elevation={1}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography
                variant='h6'
                sx={{ fontWeight: 600 }}
              >
                Mis Clientes Recientes
              </Typography>
              <Button
                size='small'
                variant='text'
                onClick={() => setOpenClienteDialog(true)}
              >
                Ver Todos
              </Button>
            </Box>

            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell
                      sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                    >
                      DNI
                    </TableCell>
                    <TableCell>Ocupación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientes.slice(0, 5).map((cliente) => (
                    <TableRow
                      key={cliente.id}
                      hover
                    >
                      <TableCell>
                        <Typography
                          variant='subtitle2'
                          sx={{ fontWeight: 500 }}
                        >
                          {cliente.nombre}
                        </Typography>
                        {/* Mostrar DNI en mobile como subtitle */}
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: { xs: 'block', sm: 'none' } }}
                        >
                          DNI: {cliente.dni}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                      >
                        {cliente.dni}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cliente.ocupacion}
                          size='small'
                          variant='outlined'
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>

        {/* Prestamos Table */}
        <Paper elevation={1}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography
                variant='h6'
                sx={{ fontWeight: 600 }}
              >
                Préstamos Activos
              </Typography>
              <Button
                size='small'
                variant='text'
                onClick={() => setOpenPrestamoDialog(true)}
              >
                Ver Todos
              </Button>
            </Box>

            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell align='right'>Monto</TableCell>
                    <TableCell align='center'>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prestamosActivos.slice(0, 5).map((prestamo) => {
                    const cliente = clientes.find(
                      (c) => c.id === prestamo.clienteId
                    );
                    return (
                      <TableRow
                        key={prestamo.id}
                        hover
                      >
                        <TableCell>
                          <Typography
                            variant='subtitle2'
                            sx={{ fontWeight: 500 }}
                          >
                            {cliente?.nombre || 'Cliente no encontrado'}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(prestamo.monto)}
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={prestamo.estado}
                            color='success'
                            size='small'
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {prestamosActivos.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align='center'
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          No hay préstamos activos
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

      {/* Dialog Nuevo Cliente */}
      <Dialog
        open={openClienteDialog}
        onClose={() => setOpenClienteDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Nuevo Cliente</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label='Nombre Completo'
              value={nuevoCliente.nombre}
              onChange={(e) =>
                setNuevoCliente((prev) => ({ ...prev, nombre: e.target.value }))
              }
              required
            />
            <TextField
              label='DNI'
              value={nuevoCliente.dni}
              onChange={(e) =>
                setNuevoCliente((prev) => ({ ...prev, dni: e.target.value }))
              }
              required
            />
            <TextField
              label='Email'
              type='email'
              value={nuevoCliente.email}
              onChange={(e) =>
                setNuevoCliente((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <TextField
              label='Teléfono'
              value={nuevoCliente.telefono}
              onChange={(e) =>
                setNuevoCliente((prev) => ({
                  ...prev,
                  telefono: e.target.value,
                }))
              }
            />
            <TextField
              label='Dirección'
              value={nuevoCliente.direccion}
              onChange={(e) =>
                setNuevoCliente((prev) => ({
                  ...prev,
                  direccion: e.target.value,
                }))
              }
            />
            <TextField
              label='Ocupación'
              value={nuevoCliente.ocupacion}
              onChange={(e) =>
                setNuevoCliente((prev) => ({
                  ...prev,
                  ocupacion: e.target.value,
                }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClienteDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleAgregarCliente}
            variant='contained'
          >
            Crear Cliente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Nuevo Préstamo */}
      <Dialog
        open={openPrestamoDialog}
        onClose={() => setOpenPrestamoDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Nuevo Préstamo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              label='Cliente'
              value={nuevoPrestamo.clienteId}
              onChange={(e) =>
                setNuevoPrestamo((prev) => ({
                  ...prev,
                  clienteId: e.target.value,
                }))
              }
              SelectProps={{ native: true }}
              required
            >
              <option value=''>Seleccionar cliente</option>
              {clientes.map((cliente) => (
                <option
                  key={cliente.id}
                  value={cliente.id}
                >
                  {cliente.nombre} - {cliente.dni}
                </option>
              ))}
            </TextField>
            <TextField
              label='Monto'
              type='number'
              value={nuevoPrestamo.monto}
              onChange={(e) =>
                setNuevoPrestamo((prev) => ({
                  ...prev,
                  monto: parseFloat(e.target.value),
                }))
              }
              required
            />
            <TextField
              label='Interés (%)'
              type='number'
              value={nuevoPrestamo.interes}
              onChange={(e) =>
                setNuevoPrestamo((prev) => ({
                  ...prev,
                  interes: parseFloat(e.target.value),
                }))
              }
              required
            />
            <TextField
              select
              label='Tipo de Interés'
              value={nuevoPrestamo.tipoInteres}
              onChange={(e) =>
                setNuevoPrestamo((prev) => ({
                  ...prev,
                  tipoInteres: e.target.value as 'diario' | 'mensual',
                }))
              }
              SelectProps={{ native: true }}
              required
            >
              <option value='mensual'>Mensual</option>
              <option value='diario'>Diario</option>
            </TextField>
            <TextField
              label='Número de Cuotas'
              type='number'
              value={nuevoPrestamo.cuotas}
              onChange={(e) =>
                setNuevoPrestamo((prev) => ({
                  ...prev,
                  cuotas: parseInt(e.target.value),
                }))
              }
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPrestamoDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleAgregarPrestamo}
            variant='contained'
          >
            Crear Préstamo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
