'use client';

import { useState } from 'react';
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
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';

export default function SubadminsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSubadmin, setSelectedSubadmin] = useState<number | null>(null);

  const mockSubadmins = [
    {
      id: 1,
      nombre: 'Ana Rodríguez',
      email: 'ana@prestamito.com',
      managersActivos: 8,
      montoTotal: 1250000,
      estado: 'activo',
      fechaCreacion: '2024-01-15',
      ultimaActividad: '2024-01-20',
    },
    {
      id: 2,
      nombre: 'Carlos Mendoza',
      email: 'carlos@prestamito.com',
      managersActivos: 12,
      montoTotal: 1890000,
      estado: 'activo',
      fechaCreacion: '2024-01-10',
      ultimaActividad: '2024-01-20',
    },
    {
      id: 3,
      nombre: 'Laura Fernández',
      email: 'laura@prestamito.com',
      managersActivos: 6,
      montoTotal: 780000,
      estado: 'inactivo',
      fechaCreacion: '2024-01-05',
      ultimaActividad: '2024-01-18',
    },
    {
      id: 4,
      nombre: 'Miguel Torres',
      email: 'miguel@prestamito.com',
      managersActivos: 15,
      montoTotal: 2100000,
      estado: 'activo',
      fechaCreacion: '2024-01-20',
      ultimaActividad: '2024-01-20',
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const getEstadoColor = (estado: string) => {
    return estado === 'activo' ? 'success' : 'default';
  };

  const filteredSubadmins = mockSubadmins.filter(
    (subadmin) =>
      subadmin.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subadmin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubadmin(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSubadmin(null);
  };

  return (
    <Box>
      {/* Header */}
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
            Sub-Administradores
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
          >
            Gestiona los sub-administradores y sus equipos de managers
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
          Crear Sub-Admin
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Sub-Administradores Table */}
      <Paper elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sub-Administrador</TableCell>
                <TableCell align='right'>Volumen Gestionado</TableCell>
                <TableCell align='center'>Estado</TableCell>
                <TableCell align='center' sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  Managers
                </TableCell>
                <TableCell align='center' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  Fecha Creación
                </TableCell>
                <TableCell align='center' sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  Última Actividad
                </TableCell>
                <TableCell align='center'>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubadmins.map((subadmin) => (
                <TableRow
                  key={subadmin.id}
                  hover
                >
                  <TableCell>
                    <Typography
                      variant='subtitle2'
                      sx={{ fontWeight: 500 }}
                    >
                      {subadmin.nombre}
                    </Typography>
                    <Typography 
                      variant='caption' 
                      color='text.secondary'
                    >
                      {subadmin.email}
                    </Typography>
                    {/* Info adicional en mobile */}
                    <Typography 
                      variant='caption' 
                      color='text.secondary'
                      sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}
                    >
                      {subadmin.managersActivos} managers • Creado: {subadmin.fechaCreacion}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography
                      variant='body2'
                      sx={{ fontWeight: 500 }}
                    >
                      {formatCurrency(subadmin.montoTotal)}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Chip
                      label={subadmin.estado}
                      color={getEstadoColor(subadmin.estado)}
                      size='small'
                    />
                  </TableCell>
                  <TableCell align='center' sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Typography variant='body2'>
                      {subadmin.managersActivos}
                    </Typography>
                  </TableCell>
                  <TableCell align='center' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant='body2' color='text.secondary'>
                      {subadmin.fechaCreacion}
                    </Typography>
                  </TableCell>
                  <TableCell align='center' sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Typography variant='body2' color='text.secondary'>
                      {subadmin.ultimaActividad}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <IconButton
                      size='small'
                      onClick={(e) => handleMenuOpen(e, subadmin.id)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Empty State */}
        {filteredSubadmins.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              No se encontraron sub-administradores que coincidan con la búsqueda
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 160 }
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Visibility sx={{ mr: 1, fontSize: 20 }} />
          Ver Detalle
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          Eliminar
        </MenuItem>
      </Menu>
    </Box>
  );
}