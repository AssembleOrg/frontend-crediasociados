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

export default function ManagersPage() {
  const {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    clearError
  } = useUsers()
  
  // Filter prestamistas directly (MANAGER from API becomes 'prestamista' in frontend)
  const managers = useMemo(() => {
    console.log('🔍 [DEBUG] All users received:', users.map(u => ({ id: u.id, name: u.fullName, role: u.role })))
    const filtered = users.filter(user => user.role === 'prestamista')
    console.log('🔍 [DEBUG] Filtered prestamistas:', filtered.map(u => ({ id: u.id, name: u.fullName, role: u.role })))
    return filtered
  }, [users])
  const totalManagers = managers.length

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

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && managers.length === 0 ? (
                <TableSkeleton columns={5} rows={8} />
              ) : managers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay cobradores registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                managers.map((manager) => (
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

      <UserFormModal
        open={createModalOpen}
        onClose={handleCloseModals}
        targetRole="manager"
        mode="create"
        createUser={createUser}
        updateUser={updateUser}
        isLoading={isLoading}
        error={error}
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