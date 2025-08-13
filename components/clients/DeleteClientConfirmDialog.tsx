'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
} from '@mui/material'
import { Warning } from '@mui/icons-material'
import { useClients } from '@/hooks/useClients'
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

    const result = await deleteMethod(client.id)

    if (result) {
      onClose()
    }
  }

  if (!client) return null

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          <Typography variant="h6" component="div">
            Confirmar Eliminación
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 2 }}>
          ¿Estás seguro que deseas eliminar al cliente <strong>{client.fullName}</strong>?
        </Typography>

        <Typography variant="body2" color="text.secondary">
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
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirmDelete}
          color="error"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Eliminando...' : 'Eliminar Cliente'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}