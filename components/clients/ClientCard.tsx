'use client'

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'
import {
  Edit,
  Delete,
  Person,
  Email,
  Phone,
  Badge,
  Work,
  Description,
  LocationOn,
  Numbers
} from '@mui/icons-material'
import type { Client } from '@/types/auth'
import { clientsService } from '@/services/clients.service'
import { loansService } from '@/services/loans.service'

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [currentLoanId, setCurrentLoanId] = useState<string | null>(null)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  })

  const handleNotesClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingNotes(true)
    try {
      const fullClient = await clientsService.getClientById(client.id)
      const activeLoan = fullClient.loans?.find((l: { status: string }) => l.status === 'ACTIVE')

      if (activeLoan) {
        setCurrentLoanId(activeLoan.id)
        setNotesValue(activeLoan.description || '')
        setNotesDialogOpen(true)
      } else {
        setSnackbar({
          open: true,
          message: 'Este cliente no tiene préstamo activo',
          severity: 'info'
        })
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Error al cargar los datos del cliente',
        severity: 'error'
      })
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!currentLoanId) return

    setSavingNotes(true)
    try {
      await loansService.updateLoanDescription(currentLoanId, notesValue)
      setSnackbar({
        open: true,
        message: 'Notas guardadas correctamente',
        severity: 'success'
      })
      setNotesDialogOpen(false)
    } catch {
      setSnackbar({
        open: true,
        message: 'Error al guardar las notas',
        severity: 'error'
      })
    } finally {
      setSavingNotes(false)
    }
  }

  const getStatusChip = () => {
    if (client.verified === false) {
      return (
        <Chip
          label="No Verificado"
          color="warning"
          size="small"
          variant="outlined"
        />
      )
    }
    // Assuming client has an active status based on business logic
    const isActive = client.id && !('deletedAt' in client && client.deletedAt) // Simple active logic

    return (
      <Chip
        label={isActive ? "Activo" : "Inactivo"}
        color={isActive ? "success" : "default"}
        size="small"
        variant="outlined"
      />
    )
  }

  return (
    <Card
      onClick={() => onEdit(client)}
      variant="outlined"
      sx={{
        mb: 1.5,
        opacity: client.verified === false ? 0.7 : 1,
        bgcolor: client.verified === false ? 'grey.50' : 'background.paper',
        cursor: 'pointer',
      }}
    >
      <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Name */}
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ color: client.verified === false ? 'text.disabled' : 'text.primary', mb: 0.5 }}
        >
          {client.fullName || 'Sin nombre'}
        </Typography>

        {/* Status */}
        <Box sx={{ mb: 1 }}>
          {getStatusChip()}
        </Box>

        {/* Info - each on its own line */}
        {client.dni && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
            <Badge sx={{ fontSize: 16, mr: 0.75, color: 'text.disabled' }} />
            DNI: {client.dni}
          </Typography>
        )}
        {client.phone && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
            <Phone sx={{ fontSize: 16, mr: 0.75, color: 'text.disabled' }} />
            {client.phone}
          </Typography>
        )}
        {client.email && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.25, wordBreak: 'break-all' }}>
            <Email sx={{ fontSize: 16, mr: 0.75, flexShrink: 0, color: 'text.disabled', mt: '2px' }} />
            {client.email}
          </Typography>
        )}
        {client.job && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.25 }}>
            <Work sx={{ fontSize: 16, mr: 0.75, flexShrink: 0, color: 'text.disabled', mt: '2px' }} />
            {client.job}
          </Typography>
        )}
        {client.address && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.25 }}>
            <LocationOn sx={{ fontSize: 16, mr: 0.75, flexShrink: 0, color: 'text.disabled', mt: '2px' }} />
            {client.address}
          </Typography>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', borderTop: '1px solid', borderColor: 'divider', pt: 1, mt: 1 }}>
          <IconButton
            size="small"
            onClick={handleNotesClick}
            disabled={loadingNotes}
            color="info"
          >
            {loadingNotes ? <CircularProgress size={16} /> : <Description fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => { e.stopPropagation(); onEdit(client) }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => { e.stopPropagation(); onDelete(client) }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>

      {/* Dialog de Notas */}
      <Dialog
        open={notesDialogOpen}
        onClose={() => setNotesDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Notas del Préstamo - {client.fullName}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Agregar notas o información adicional..."
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSaveNotes}
            variant="contained"
            disabled={savingNotes}
          >
            {savingNotes ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}