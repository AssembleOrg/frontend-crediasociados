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
import type { User } from '@/types/auth'
import { getRoleDisplayName } from '@/types/transforms'

interface DeleteUserConfirmDialogProps {
  open: boolean
  onClose: () => void
  user: User | null
  onConfirm?: (id: string) => Promise<boolean>
  // Functions passed from parent to avoid duplicate useUsers hooks
  deleteUser?: (id: string) => Promise<boolean>
  isLoading?: boolean
  error?: string | null
}

export function DeleteUserConfirmDialog({
  open,
  onClose,
  user,
  onConfirm,
  deleteUser,
  isLoading = false,
  error = null
}: DeleteUserConfirmDialogProps) {

  const handleConfirmDelete = async () => {
    if (!user) return

    // Use provided onConfirm or default deleteUser
    const deleteMethod = onConfirm || deleteUser

    if (deleteMethod) {
      const result = await deleteMethod(user.id)

      if (result) {
        onClose()
      }
    }
  }

  if (!user) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
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
          ¿Estás seguro de que deseas eliminar este usuario?
        </Typography>

        <Box sx={{ 
          p: 2, 
          bgcolor: 'grey.100', 
          borderRadius: 1,
          mb: 2
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rol: {getRoleDisplayName(user.role)}
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Esta acción no se puede deshacer. El usuario será eliminado de forma permanente 
            del sistema junto con todos sus datos asociados.
          </Typography>
        </Alert>
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
          {isLoading ? 'Eliminando...' : 'Eliminar Usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}