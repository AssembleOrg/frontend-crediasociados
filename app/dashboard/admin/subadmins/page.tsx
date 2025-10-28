'use client';

import { useState, useMemo, useCallback } from 'react';
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
  useTheme,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useUsers } from '@/hooks/useUsers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { RoleUtils, type UserRole } from '@/lib/role-utils';
import { UserFormModal } from '@/components/users/UserFormModal';
import { DeleteUserConfirmDialog } from '@/components/users/DeleteUserConfirmDialog';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

export default function SubadminsPage() {
  useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSubadmin, setSelectedSubadmin] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { users, isLoading, error, createUser, updateUser, deleteUser, fetchUsers } = useUsers();
  const currentAdmin = useCurrentUser(); // Get current admin user
  const { refreshCurrentUser } = useAuth();
  
  const subadmins = useMemo(() => 
    users.filter(user => user.role === 'subadmin'), 
    [users]
  );

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

  const handleCloseModals = useCallback(async () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedSubadmin(null);
    
    // ✅ REHIDRATACIÓN: Refrescar datos después de cerrar modales
    await Promise.all([
      fetchUsers(), // Actualiza lista de subadmins
      refreshCurrentUser(), // Actualiza cuotas del admin actual
    ]);
  }, [fetchUsers, refreshCurrentUser]);

  const calculateQuotaPercentage = (used: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  const getQuotaColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  // Calculate admin's available quota (for creating subadmins)
  const adminAvailableQuota = useMemo(() => {
    if (!currentAdmin) return undefined;
    const total = currentAdmin.clientQuota ?? 0;
    const used = currentAdmin.usedClientQuota ?? 0;
    return Math.max(0, total - used);
  }, [currentAdmin]);

  const adminTotalQuota = useMemo(() => {
    if (!currentAdmin) return undefined;
    return currentAdmin.clientQuota ?? 0;
  }, [currentAdmin]);

  // const totalAvailableQuota = subadmins.reduce(
  //   (sum, subadmin) => sum + ((subadmin.clientQuota ?? 0) - (subadmin.usedClientQuota ?? 0)),
  //   0
  // );

  return (
    <Box>
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
            Asociados
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ mb: 1 }}
          >
            Gestiona los asociados que crean y supervisan cobradores
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant='body2' color='text.secondary'>
              Clientes disponibles para asignar:
            </Typography>
            <Chip
              label={
                adminAvailableQuota !== undefined && adminTotalQuota !== undefined
                  ? `${adminAvailableQuota} / ${adminTotalQuota}`
                  : '0 / 0'
              }
              color={adminAvailableQuota && adminAvailableQuota > 0 ? 'success' : 'default'}
              size='small'
              sx={{ fontWeight: 600 }}
            />
          </Box>
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
          Crear Asociados
        </Button>
      </Box>

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
                  Cuota Total
                </TableCell>
                <TableCell
                  align='center'
                  sx={{ display: { xs: 'none', md: 'table-cell' } }}
                >
                  Cuota Usada
                </TableCell>
                <TableCell
                  align='center'
                  sx={{ display: { xs: 'none', lg: 'table-cell' } }}
                >
                  Cuota Disponible
                </TableCell>
                <TableCell
                  align='center'
                  sx={{ display: { xs: 'none', md: 'table-cell' } }}
                >
                  Teléfono
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
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}
                        >
                          Rol: {RoleUtils.getRoleDisplayName(subadmin.role as UserRole)} • Creado:{' '}
                          {formatDate(subadmin.createdAt.toISOString())}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={RoleUtils.getRoleDisplayName(subadmin.role as UserRole)}
                          color='warning'
                          size='small'
                        />
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                      >
                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                          {subadmin.clientQuota ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', md: 'table-cell' } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {subadmin.usedClientQuota ?? 0}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            ({calculateQuotaPercentage(subadmin.usedClientQuota ?? 0, subadmin.clientQuota ?? 0)}%)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', lg: 'table-cell' } }}
                      >
                        <Chip
                          label={(subadmin.clientQuota ?? 0) - (subadmin.usedClientQuota ?? 0)}
                          color={getQuotaColor(calculateQuotaPercentage(subadmin.usedClientQuota ?? 0, subadmin.clientQuota ?? 0))}
                          variant='outlined'
                          size='small'
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', md: 'table-cell' } }}
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          {subadmin.phone || 'No especificado'}
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
                        colSpan={7}
                        sx={{ textAlign: 'center', py: 4 }}
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          {subadmins.length === 0
                            ? 'No hay asociados registrados todavía'
                            : 'No se encontraron asociados que coincidan con la búsqueda'}
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 160 },
        }}
      >
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

      <UserFormModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        targetRole='subadmin'
        mode='create'
        createUser={createUser}
        updateUser={updateUser}
        isLoading={isLoading}
        error={error}
        creatorAvailableQuota={adminAvailableQuota}
        creatorTotalQuota={adminTotalQuota}
      />

      <UserFormModal
        open={isEditModalOpen}
        onClose={handleCloseModals}
        user={getSelectedUser()}
        mode='edit'
        createUser={createUser}
        updateUser={updateUser}
        isLoading={isLoading}
        error={error}
        allowRoleChange={false}
        creatorAvailableQuota={adminAvailableQuota}
        creatorTotalQuota={adminTotalQuota}
      />

      <DeleteUserConfirmDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseModals}
        user={getSelectedUser()}
        deleteUser={deleteUser}
        isLoading={isLoading}
        error={error}
      />
    </Box>
  );
}
