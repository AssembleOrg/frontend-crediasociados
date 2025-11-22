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
  Chip,
} from '@mui/material'
import { Warning } from '@mui/icons-material'
import { useLoans } from '@/hooks/useLoans'
import { useClients } from '@/hooks/useClients'
import type { Loan } from '@/types/auth'
import { formatCurrency, translateLoanStatus, getLoanStatusColor } from '@/lib/loan-utils'

interface DeleteLoanConfirmDialogProps {
  open: boolean
  onClose: () => void
  loan: Loan | null
}

export function DeleteLoanConfirmDialog({ 
  open, 
  onClose, 
  loan
}: DeleteLoanConfirmDialogProps) {
  const { deleteLoan, isLoading, error } = useLoans()
  const { clients } = useClients()

  const handleConfirmDelete = async () => {
    if (!loan) return

    try {
      await deleteLoan(loan.id)
      onClose()
    } catch (error) {
      
    }
  }

  if (!loan) return null

  const client = clients.find(c => c.id === loan.clientId)
  
  // Determinar si el préstamo puede ser eliminado según su estado
  const canDelete = loan.status === 'PENDING' || loan.status === 'REJECTED'
  const isActive = loan.status === 'ACTIVE' || loan.status === 'APPROVED'

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

        <Typography variant="body1" gutterBottom>
          ¿Estás seguro que deseas eliminar este préstamo?
        </Typography>

        {/* Información del Préstamo */}
        <Box sx={{ 
          bgcolor: 'grey.50', 
          p: 2, 
          borderRadius: 1, 
          mt: 2,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Typography variant="subtitle2" gutterBottom>
            Información del Préstamo
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography variant="body2">
              <strong>Código:</strong> {loan.loanTrack}
            </Typography>
            <Typography variant="body2">
              <strong>Cliente:</strong> {client?.fullName || 'No encontrado'}
            </Typography>
            <Typography variant="body2">
              <strong>Monto:</strong> {formatCurrency(loan.amount)}
            </Typography>
            <Typography variant="body2">
              <strong>Total Cuotas:</strong> {loan.totalPayments}
            </Typography>
            <Typography variant="body2">
              <strong>Creado:</strong> {loan.createdAt.toLocaleDateString()}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={translateLoanStatus(loan.status)}
                color={getLoanStatusColor(loan.status)}
                size="small"
              />
            </Box>
          </Box>
        </Box>

        {/* Advertencias según el estado */}
        {isActive && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>⚠️ Préstamo Activo:</strong> Este préstamo está activo o aprobado. 
              Eliminarlo podría afectar el historial de pagos y generar inconsistencias.
            </Typography>
          </Alert>
        )}

        {loan.status === 'COMPLETED' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>⚠️ Préstamo Completado:</strong> Este préstamo ya fue completado. 
              Eliminarlo eliminará todo el historial de pagos asociado.
            </Typography>
          </Alert>
        )}

        {canDelete && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Este préstamo puede ser eliminado de forma segura ya que está en estado 
              &ldquo;{translateLoanStatus(loan.status)}&rdquo;.
            </Typography>
          </Alert>
        )}

        <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 500 }}>
          Esta acción no se puede deshacer.
        </Typography>
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
          variant="contained"
          color="error"
          disabled={isLoading}
          startIcon={<Warning />}
        >
          {isLoading ? 'Eliminando...' : 'Eliminar Préstamo'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}