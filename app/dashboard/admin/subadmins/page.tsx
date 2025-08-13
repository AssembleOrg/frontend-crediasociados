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
import { useSubadmins } from '@/hooks/useSubadmins';
import { getRoleDisplayName } from '@/types/transforms';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import { EditUserModal } from '@/components/users/EditUserModal';
import { DeleteUserConfirmDialog } from '@/components/users/DeleteUserConfirmDialog';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

export default function SubadminsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSubadmin, setSelectedSubadmin] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { subadmins, isLoading, error } = useSubadmins();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const filteredSubadmins = subadmins.filter(
    (subadmin) =>
      subadmin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subadmin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubadmin(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getSelectedUser = () => {
    return subadmins.find((user) => user.id === selectedSubadmin) || null;
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsDeleteDialogOpen(false);
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
            Sub-Administradores
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
          >
            Gestiona los sub-administradores que crean y supervisan managers
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => setIsCreateModalOpen(true)}
          sx={{
            height: 'fit-content',
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          Crear Sub-Admin
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder='Buscar por nombre o email...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Error State */}
      {error && (
        <Paper
          elevation={1}
          sx={{
            p: 3,
            mb: 3,
            bgcolor: 'error.light',
            color: 'error.contrastText',
          }}
        >
          <Typography variant='body1'>Error: {error}</Typography>
        </Paper>
      )}

      {/* Sub-Administradores Table */}
      <Paper elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sub-Administrador</TableCell>
                <TableCell align='center'>Rol</TableCell>
                <TableCell
                  align='center'
                  sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                >
                  Teléfono
                </TableCell>
                <TableCell
                  align='center'
                  sx={{ display: { xs: 'none', md: 'table-cell' } }}
                >
                  Fecha Creación
                </TableCell>
                <TableCell
                  align='center'
                  sx={{ display: { xs: 'none', lg: 'table-cell' } }}
                >
                  Última Actualización
                </TableCell>
                <TableCell align='center'>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={6} rows={8} />
              ) : (
                <>
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
                          {subadmin.fullName}
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
                          Rol: {getRoleDisplayName(subadmin.role)} • Creado:{' '}
                          {formatDate(subadmin.createdAt.toISOString())}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={getRoleDisplayName(subadmin.role)}
                          color='warning'
                          size='small'
                        />
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          {subadmin.phone || 'No especificado'}
                        </Typography>
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', md: 'table-cell' } }}
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          {formatDate(subadmin.createdAt.toISOString())}
                        </Typography>
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', lg: 'table-cell' } }}
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          {formatDate(subadmin.updatedAt.toISOString())}
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

                  {filteredSubadmins.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ textAlign: 'center', py: 4 }}
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          {subadmins.length === 0
                            ? 'No hay sub-administradores registrados todavía'
                            : 'No se encontraron sub-administradores que coincidan con la búsqueda'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 160 },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Visibility sx={{ mr: 1, fontSize: 20 }} />
          Ver Detalle
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Editar
        </MenuItem>
        <MenuItem
          onClick={handleDelete}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Create User Modal */}
      <CreateUserModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        targetRole='subadmin'
        title='Crear Sub-Administrador'
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={isEditModalOpen}
        onClose={handleCloseModals}
        user={getSelectedUser()}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserConfirmDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseModals}
        user={getSelectedUser()}
      />
    </Box>
  );
}
