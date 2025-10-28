'use client'

import { useState, useCallback } from 'react'
import {
  Box,
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
import { useClients } from '@/hooks/useClients'
import { ClientFormModal } from '@/components/clients/ClientFormModal'
import { DeleteClientConfirmDialog } from '@/components/clients/DeleteClientConfirmDialog'
import { ClientCard } from '@/components/clients/ClientCard'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import PageHeader from '@/components/ui/PageHeader'
import type { Client } from '@/types/auth'

export default function ClientesPage() {
  const {
    clients,
    pagination,
    isLoading,
    error,
    fetchClients,
    deleteClient,
    clearError
  } = useClients()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Use server-side pagination from the store
  const page = (pagination?.page || 1) - 1 // MUI uses 0-based indexing
  const rowsPerPage = pagination?.limit || 10
  const totalClients = pagination?.total || 0

  const handleChangePage = (event: unknown, newPage: number) => {
    // Fetch new page from backend (MUI is 0-based, backend is 1-based)
    fetchClients({ page: newPage + 1, limit: rowsPerPage })
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10)
    // Fetch with new limit from page 1
    fetchClients({ page: 1, limit: newLimit })
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setEditModalOpen(true)
  }

  const handleDelete = (client: Client) => {
    setSelectedClient(client)
    setDeleteDialogOpen(true)
  }

  const handleCloseModals = useCallback(async () => {
    setCreateModalOpen(false)
    setEditModalOpen(false)
    setDeleteDialogOpen(false)
    setSelectedClient(null)
    
    // ✅ REHIDRATACIÓN: Refrescar datos después de cerrar modales
    await fetchClients()
  }, [fetchClients])

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <PageHeader
        title="Gestión de Clientes"
        subtitle="Administra los clientes de tu cartera"
        actions={[
          {
            label: 'Crear Cliente',
            onClick: () => setCreateModalOpen(true),
            startIcon: <Add />,
            variant: 'contained'
          }
        ]}
      />

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={clearError}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Clients - Responsive Layout */}
      <Paper sx={{ overflow: 'hidden' }}>
        {/* Desktop Table - lg+ */}
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Nombre Completo</strong></TableCell>
                  <TableCell><strong>DNI</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Teléfono</strong></TableCell>
                  <TableCell><strong>Ocupación</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton columns={7} />
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id} hover>
                      <TableCell>{client.fullName}</TableCell>
                      <TableCell>{client.dni || 'N/A'}</TableCell>
                      <TableCell>{client.email || 'N/A'}</TableCell>
                      <TableCell>{client.phone || 'N/A'}</TableCell>
                      <TableCell>{client.job || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label="Activo"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(client)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(client)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile Cards - xs to lg */}
        <Box sx={{ display: { xs: 'block', lg: 'none' }, p: 2 }}>
          {isLoading ? (
            // Loading skeleton for mobile
            <Box>
              {[...Array(3)].map((_, i) => (
                <Box key={i} sx={{
                  height: 120,
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  mb: 2,
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              ))}
            </Box>
          ) : (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </Box>

        {/* Pagination - Shared for both layouts */}
        <TablePagination
          component="div"
          count={totalClients}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      {/* Modals */}
      <ClientFormModal
        open={createModalOpen}
        onClose={handleCloseModals}
        mode="create"
      />

      <ClientFormModal
        open={editModalOpen}
        onClose={handleCloseModals}
        mode="edit"
        client={selectedClient}
      />

      <DeleteClientConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseModals}
        client={selectedClient}
        onConfirm={async (id: string) => {
          const success = await deleteClient(id)
          if (success) {
            handleCloseModals()
          }
          return success
        }}
      />
    </Box>
  )
}