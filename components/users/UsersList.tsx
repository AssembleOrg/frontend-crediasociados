'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  TablePagination,
  TextField,
  InputAdornment
} from '@mui/material'
import { Search, Add, Edit, Delete } from '@mui/icons-material'
import { useUsers } from '@/hooks/useUsers'
import { getRoleDisplayName } from '@/types/transforms'
import type { User } from '@/types/auth'

interface UsersListProps {
  onEditUser?: (user: User) => void
  onCreateUser?: () => void
}

export const UsersList = ({ onEditUser, onCreateUser }: UsersListProps) => {
  const {
    isLoading,
    error,
    deleteUser,
    clearError,
    getFilteredUsers
  } = useUsers()

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Local filtering and pagination
  const filteredUsers = useMemo(() => {
    return getFilteredUsers({ search: searchTerm })
  }, [getFilteredUsers, searchTerm])

  const paginatedUsers = useMemo(() => {
    const start = currentPage * rowsPerPage
    const end = start + rowsPerPage
    return filteredUsers.slice(start, end)
  }, [filteredUsers, currentPage, rowsPerPage])

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setCurrentPage(0) // Reset to first page when searching
    }
  }

  const handlePageChange = (event: unknown, newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setCurrentPage(0)
  }

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${user.fullName}?`)) {
      const success = await deleteUser(user.id)
      if (success) {
        // No need to refresh - store automatically updates
      }
    }
  }

  const getRoleColor = (role: string): 'error' | 'primary' | 'default' => {
    switch (role) {
      case 'admin': return 'error'
      case 'prestamista': return 'primary'
      default: return 'default'
    }
  }

  if (isLoading && filteredUsers.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Gestión de Usuarios
        </Typography>
        {onCreateUser && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateUser}
          >
            Crear Usuario
          </Button>
        )}
      </Box>

      {/* Search */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          fullWidth
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre Completo</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>DNI/CUIT</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {user.fullName}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleDisplayName(user.role)}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.dni && <div>DNI: {user.dni}</div>}
                    {user.cuit && <div>CUIT: {user.cuit}</div>}
                    {!user.dni && !user.cuit && '-'}
                  </TableCell>
                  <TableCell>
                    {user.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      {onEditUser && (
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => onEditUser(user)}
                        >
                          Editar
                        </Button>
                      )}
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteUser(user)}
                        disabled={isLoading}
                      >
                        Eliminar
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={currentPage}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>

      {/* Loading Overlay */}
      {isLoading && filteredUsers.length > 0 && (
        <Box 
          position="absolute" 
          top={0} 
          left={0} 
          right={0} 
          bottom={0} 
          display="flex" 
          justifyContent="center" 
          alignItems="center"
          bgcolor="rgba(255,255,255,0.8)"
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  )
}