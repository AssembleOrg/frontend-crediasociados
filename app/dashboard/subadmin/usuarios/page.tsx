'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Alert,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
} from '@mui/icons-material'
import { useUsers } from '@/hooks/useUsers'
import { UserFormModal } from '@/components/users/UserFormModal'
import { DeleteUserConfirmDialog } from '@/components/users/DeleteUserConfirmDialog'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import type { User } from '@/types/auth'
import { useAuth } from '@/hooks/useAuth'

// Helper function to determine quota chip color based on available quota
const getQuotaChipColor = (availableQuota?: number): 'success' | 'warning' | 'error' | 'default' => {
  if (availableQuota === undefined || availableQuota === 0) {
    return 'error'
  }
  if (availableQuota <= 5) {
    return 'warning'
  }
  return 'success'
}

// Helper function to format quota display
const formatQuotaDisplay = (manager: User): string => {
  const clientQuota = manager.clientQuota ?? 0
  const usedQuota = manager.usedClientQuota ?? 0
  const availableQuota = manager.availableClientQuota ?? 0

  if (clientQuota === 0) {
    return 'Sin cuota'
  }

  return `${usedQuota}/${clientQuota} (${availableQuota} disponibles)`
}

export default function ManagersPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

  const {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    clearError
  } = useUsers()

  const { user: currentSubadmin } = useAuth()
  
  // Filter prestamistas directly (MANAGER from API becomes 'prestamista' in frontend)
  const managers = useMemo(() => {
    console.log('🔍 [DEBUG] All users received:', users.map(u => ({ id: u.id, name: u.fullName, role: u.role })))
    const filtered = users.filter(user => user.role === 'prestamista')
    console.log('🔍 [DEBUG] Filtered prestamistas:', filtered.map(u => ({ id: u.id, name: u.fullName, role: u.role })))
    return filtered
  }, [users])
  const totalManagers = managers.length
  
  // Calculate available client quota for current subadmin
  const creatorAvailableQuota = useMemo(() => {
    if (!currentSubadmin) return 0
    const total = currentSubadmin.clientQuota ?? 0
    const used = currentSubadmin.usedClientQuota ?? 0
    return Math.max(0, total - used)
  }, [currentSubadmin])

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleCloseModals = () => {
    setCreateModalOpen(false)
    setEditModalOpen(false)
    setDeleteDialogOpen(false)
    setSelectedUser(null)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestión de Cobradores
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra los cobradores
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateModalOpen(true)}
        >
          Crear Cobrador
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {/* Desktop Table View */}
      {!isMobile && (
        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Cuota de Clientes</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && managers.length === 0 ? (
                  <TableSkeleton columns={6} rows={8} />
                ) : managers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No hay cobradores registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  managers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((manager) => (
                    <TableRow key={manager.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {manager.fullName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {manager.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Cobrador"
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatQuotaDisplay(manager)}
                          color={getQuotaChipColor(manager.availableClientQuota)}
                          size="small"
                          variant={manager.clientQuota === 0 ? 'outlined' : 'filled'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Activo"
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(manager)}
                          sx={{ mr: 1 }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(manager)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalManagers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      )}

      {/* Mobile Card View */}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          {isLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Cargando cobradores...
            </Typography>
          ) : managers.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay cobradores registrados
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {managers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((manager) => (
                <Grid size={{ xs: 12 }} key={manager.id}>
                  <Card>
                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {manager.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {manager.email}
                          </Typography>
                        </Box>
                        <Chip
                          label="Activo"
                          color="success"
                          size="small"
                        />
                      </Box>

                      {/* Info Grid */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Rol
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Cobrador
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Cuota Disponible
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: getQuotaChipColor(manager.availableClientQuota) === 'error' ? 'error.main' : 'success.main' }}>
                            {formatQuotaDisplay(manager)}
                          </Typography>
                        </Grid>
                      </Grid>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit />}
                          fullWidth
                          onClick={() => handleEdit(manager)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleDelete(manager)}
                          sx={{ minWidth: 'auto' }}
                        >
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Mobile Pagination */}
          {!isLoading && managers.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalManagers)} de {totalManagers}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  disabled={page === 0}
                  onClick={() => handleChangePage({}, page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="small"
                  disabled={(page + 1) * rowsPerPage >= totalManagers}
                  onClick={() => handleChangePage({}, page + 1)}
                >
                  Siguiente
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      <UserFormModal
        open={createModalOpen}
        onClose={handleCloseModals}
        targetRole="manager"
        mode="create"
        createUser={createUser}
        updateUser={updateUser}
        isLoading={isLoading}
        error={error}
        creatorAvailableQuota={creatorAvailableQuota}
        creatorTotalQuota={currentSubadmin?.clientQuota}
      />

      {selectedUser && (
        <>
          <UserFormModal
            open={editModalOpen}
            onClose={handleCloseModals}
            user={selectedUser}
            mode="edit"
            createUser={createUser}
            updateUser={updateUser}
            isLoading={isLoading}
            error={error}
          />
          <DeleteUserConfirmDialog
            open={deleteDialogOpen}
            onClose={handleCloseModals}
            user={selectedUser}
            deleteUser={deleteUser}
            isLoading={isLoading}
            error={error}
            onConfirm={deleteUser}
          />
        </>
      )}
    </Box>
  )
}