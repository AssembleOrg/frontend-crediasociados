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
  LockReset,
} from '@mui/icons-material';
import { useUsers } from '@/hooks/useUsers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { RoleUtils, type UserRole } from '@/lib/role-utils';
import { UserFormModal } from '@/components/users/UserFormModal';
import { DeleteUserConfirmDialog } from '@/components/users/DeleteUserConfirmDialog';
import { ChangePasswordModal } from '@/components/users/ChangePasswordModal';
import { authService } from '@/services/auth.service';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

export default function ManagersPage() {
  useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  const { users, isLoading, error, createUser, updateUser, deleteUser, fetchUsers } = useUsers();
  const currentSubadmin = useCurrentUser();
  const { refreshCurrentUser } = useAuth();
  
  // Filter prestamistas directly (MANAGER from API becomes 'prestamista' in frontend)
  const managers = useMemo(() => 
    users.filter(user => user.role === 'prestamista'), 
    [users]
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const filteredManagers = managers.filter(
    (manager) =>
      manager.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedManagerId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getSelectedUser = () => {
    return managers.find((user) => user.id === selectedManagerId) || null;
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleChangePassword = () => {
    setIsChangePasswordModalOpen(true);
    handleMenuClose();
  };

  const handleChangePasswordSubmit = async (userId: string, newPassword: string): Promise<boolean> => {
    setChangePasswordLoading(true);
    setChangePasswordError(null);

    try {
      await authService.changePassword({ userId, newPassword });
      return true;
    } catch (err: any) {
      setChangePasswordError(err?.response?.data?.message || 'Error al cambiar la contraseña');
      return false;
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleCloseModals = useCallback(async () => {
    // handleCloseModals called
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteDialogOpen(false);
    setIsChangePasswordModalOpen(false);
    setChangePasswordError(null);
    setSelectedManagerId(null);
    
    // ✅ REHIDRATACIÓN: Refrescar datos después de cerrar modales
    // Starting data refresh
    await Promise.all([
      fetchUsers(), // Actualiza lista de cobradores
      refreshCurrentUser(), // Actualiza cuotas del subadmin actual
    ]);
    // Data refresh completed
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

  // Calculate subadmin's available quota (for creating managers)
  // This should be based on the total quota ASSIGNED to managers, not the quota USED by managers
  const creatorAvailableQuota = useMemo(() => {
    if (!currentSubadmin) return undefined;
    const total = currentSubadmin.clientQuota ?? 0;
    // Sum all clientQuota assigned to managers (not usedClientQuota)
    const assigned = managers.reduce((sum, manager) => sum + (manager.clientQuota ?? 0), 0);
    return Math.max(0, total - assigned);
  }, [currentSubadmin, managers]);

  const creatorTotalQuota = useMemo(() => {
    if (!currentSubadmin) return undefined;
    return currentSubadmin.clientQuota ?? 0;
  }, [currentSubadmin]);

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
            Cobradores
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ mb: 1 }}
          >
            Gestiona los cobradores que crean y gestionan clientes
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant='body2' color='text.secondary'>
              Clientes disponibles para asignar:
            </Typography>
            <Chip
              label={
                creatorAvailableQuota !== undefined && creatorTotalQuota !== undefined
                  ? `${creatorAvailableQuota} / ${creatorTotalQuota}`
                  : '0 / 0'
              }
              color={creatorAvailableQuota && creatorAvailableQuota > 0 ? 'success' : 'default'}
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
          Crear Cobrador
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
                <TableCell>Cobrador</TableCell>
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
                <TableSkeleton columns={7} rows={8} />
              ) : (
                <>
                  {filteredManagers.map((manager) => (
                    <TableRow
                      key={manager.id}
                      hover
                    >
                      <TableCell>
                        <Typography
                          variant='subtitle2'
                          sx={{ fontWeight: 500 }}
                        >
                          {manager.fullName}
                        </Typography>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                        >
                          {manager.email}
                        </Typography>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}
                        >
                          Rol: {RoleUtils.getRoleDisplayName(manager.role as UserRole)} • Creado:{' '}
                          {formatDate(manager.createdAt.toISOString())}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={RoleUtils.getRoleDisplayName(manager.role as UserRole)}
                          color='primary'
                          size='small'
                        />
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                      >
                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                          {manager.clientQuota ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', md: 'table-cell' } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {manager.usedClientQuota ?? 0}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            ({calculateQuotaPercentage(manager.usedClientQuota ?? 0, manager.clientQuota ?? 0)}%)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        align='center'
                        sx={{ display: { xs: 'none', lg: 'table-cell' } }}
                      >
                        <Chip
                          label={(manager.clientQuota ?? 0) - (manager.usedClientQuota ?? 0)}
                          color={getQuotaColor(calculateQuotaPercentage(manager.usedClientQuota ?? 0, manager.clientQuota ?? 0))}
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
                          {manager.phone || 'No especificado'}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <IconButton
                          size='small'
                          onClick={(e) => handleMenuOpen(e, manager.id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredManagers.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        sx={{ textAlign: 'center', py: 4 }}
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          {managers.length === 0
                            ? 'No hay cobradores registrados todavía'
                            : 'No se encontraron cobradores que coincidan con la búsqueda'}
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
          sx: { minWidth: 180 },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleChangePassword}>
          <LockReset sx={{ mr: 1, fontSize: 20 }} />
          Cambiar Contraseña
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
        onClose={handleCloseModals}
        targetRole='manager'
        mode='create'
        createUser={createUser}
        updateUser={updateUser}
        isLoading={isLoading}
        error={error}
        creatorAvailableQuota={creatorAvailableQuota}
        creatorTotalQuota={creatorTotalQuota}
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
        creatorAvailableQuota={creatorAvailableQuota}
        creatorTotalQuota={creatorTotalQuota}
      />

      <DeleteUserConfirmDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseModals}
        user={getSelectedUser()}
        deleteUser={deleteUser}
        isLoading={isLoading}
        error={error}
      />

      <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onClose={handleCloseModals}
        user={getSelectedUser()}
        onChangePassword={handleChangePasswordSubmit}
        isLoading={changePasswordLoading}
        error={changePasswordError}
      />
    </Box>
  );
}
