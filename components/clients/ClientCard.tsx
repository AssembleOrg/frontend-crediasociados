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
      sx={{
        mb: 2,
        opacity: client.verified === false ? 0.7 : 1,
        bgcolor: client.verified === false ? 'grey.50' : 'background.paper',
        '&:hover': {
          transform: 'scale(1.01)',
          boxShadow: 3,
        },
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        {/* Header: Nombre + Estado + Notas */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" fontSize="small" />
            <Typography
              variant="h6"
              component="h3"
              fontWeight="bold"
              sx={{
                color: client.verified === false ? 'text.disabled' : 'text.primary',
                opacity: client.verified === false ? 0.6 : 1
              }}
            >
              {client.fullName || 'Sin nombre'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Notas del préstamo">
              <IconButton
                size="medium"
                onClick={handleNotesClick}
                disabled={loadingNotes}
                sx={{
                  color: 'text.secondary',
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                {loadingNotes ? <CircularProgress size={24} /> : <Description />}
              </IconButton>
            </Tooltip>
            {getStatusChip()}
          </Box>
        </Box>

        {/* Info Grid - 2 columnas en sm+, 1 en mobile */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: { xs: 0.5, sm: 1 },
          mb: 2
        }}>
          {/* Col 1: DNI + Teléfono + CUIT */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {client.dni && (
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge sx={{ fontSize: 16, mr: 0.5 }} />
                {client.dni}
              </Typography>
            )}
            {client.phone && (
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Phone sx={{ fontSize: 16, mr: 0.5 }} />
                {client.phone}
              </Typography>
            )}
            {client.cuit && (
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Numbers sx={{ fontSize: 16, mr: 0.5 }} />
                {client.cuit}
              </Typography>
            )}
          </Box>

          {/* Col 2: Email + Dirección + Ocupación */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {client.email && (
              <Typography variant="body2" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center' }}>
                <Email sx={{ fontSize: 16, mr: 0.5, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.email}</span>
              </Typography>
            )}
            {client.address && (
              <Typography variant="body2" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ fontSize: 16, mr: 0.5, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.address}</span>
              </Typography>
            )}
            {client.job && (
              <Typography variant="body2" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center' }}>
                <Work sx={{ fontSize: 16, mr: 0.5, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.job}</span>
              </Typography>
            )}
          </Box>
        </Box>

        {/* Actions: Touch-friendly buttons */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          pt: 1,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<Edit />}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(client)
            }}
            sx={{
              flex: 1,
              minHeight: 44, // Touch target minimum
              borderRadius: 2
            }}
          >
            Editar
          </Button>

          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<Delete />}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(client)
            }}
            sx={{
              flex: 1,
              minHeight: 44, // Touch target minimum
              borderRadius: 2
            }}
          >
            Eliminar
          </Button>
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