'use client'

import { Box, Typography } from '@mui/material'
import { useClients } from '@/hooks/useClients'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Client } from '@/types/auth'

interface DeleteClientConfirmDialogProps {
  open: boolean
  onClose: () => void
  client: Client | null
  onConfirm?: (id: string) => Promise<boolean>
}

export function DeleteClientConfirmDialog({ 
  open, 
  onClose, 
  client,
  onConfirm
}: DeleteClientConfirmDialogProps) {
  const { deleteClient, isLoading, error } = useClients()

  const handleConfirmDelete = async () => {
    if (!client) return
    
    // Use provided onConfirm or default deleteClient
    const deleteMethod = onConfirm || deleteClient
    await deleteMethod(client.id)
  }

  if (!client) return null

  const message = (
    <>
      <Typography variant="body1" sx={{ mb: 2 }}>
        ¿Estás seguro que deseas eliminar al cliente <strong>{client.fullName}</strong>?
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al cliente.
      </Typography>

      {client.dni && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2">
            <strong>DNI:</strong> {client.dni}
          </Typography>
          {client.email && (
            <Typography variant="body2">
              <strong>Email:</strong> {client.email}
            </Typography>
          )}
        </Box>
      )}
    </>
  )

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirmDelete}
      title="Confirmar Eliminación"
      message={message}
      confirmText="Eliminar Cliente"
      isLoading={isLoading}
      error={error}
      confirmColor="error"
    />
  )
}