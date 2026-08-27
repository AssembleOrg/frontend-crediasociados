'use client'

import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { Block, Close, MoneyOff, Restore } from '@mui/icons-material'
import { clientsService } from '@/services/clients.service'
import { clientLossesService } from '@/services/client-losses.service'
import type { Client } from '@/types/auth'

interface ClientLossDialogProps {
  open: boolean
  onClose: () => void
  client: Client | null
  /** Callback tras registrar la pérdida con éxito (refrescar listado). */
  onSuccess?: () => void
}

interface ActiveLoanRow {
  id: string
  loanTrack?: string
  amount?: number | string
  status: string
}

const ACTIVE_STATUSES = ['PENDING', 'APPROVED', 'ACTIVE', 'DEFAULTED']

/**
 * Modal de baja de cliente por pérdida (deuda incobrable), para el cobrador.
 * La deuda pendiente se descuenta del dinero en calle, el cliente entra a la
 * lista negra y el subadmin queda notificado (puede revertir hasta 96hs).
 */
export function ClientLossDialog({
  open,
  onClose,
  client,
  onSuccess,
}: ClientLossDialogProps) {
  const theme = useTheme()

  const [loans, setLoans] = useState<ActiveLoanRow[]>([])
  const [loadingLoans, setLoadingLoans] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !client) return
    setNotes('')
    setError(null)
    setLoadingLoans(true)
    clientsService
      .getClientById(client.id)
      .then((detail) => {
        const activeLoans = (
          (detail as { loans?: ActiveLoanRow[] })?.loans ?? []
        ).filter((loan) => ACTIVE_STATUSES.includes(loan.status))
        setLoans(activeLoans)
      })
      .catch(() => setLoans([]))
      .finally(() => setLoadingLoans(false))
  }, [open, client])

  const handleConfirm = async () => {
    if (!client) return
    setSubmitting(true)
    setError(null)
    try {
      await clientLossesService.markAsLoss(client.id, notes.trim() || undefined)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(
        (err as { message?: string })?.message ||
          'No se pudo registrar la pérdida',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!client) return null

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: { xs: 2, sm: 3 }, m: { xs: 2, sm: 4 } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        <MoneyOff color="error" />
        Dar de baja por pérdida
        <IconButton
          onClick={onClose}
          disabled={submitting}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Vas a dar por perdida la deuda de{' '}
          <strong>{client.fullName}</strong>
          {client.dni ? ` (DNI ${client.dni})` : ''}.
        </Typography>

        {/* Préstamos afectados */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.error.main, 0.05),
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Préstamos que se darán de baja
          </Typography>
          {loadingLoans ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
              <CircularProgress size={20} />
            </Box>
          ) : loans.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              El cliente no tiene préstamos activos. Se dará de baja solo el
              cliente.
            </Typography>
          ) : (
            loans.map((loan) => (
              <Box
                key={loan.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                }}
              >
                <Typography variant="body2">
                  {loan.loanTrack || loan.id}
                </Typography>
                <Chip
                  size="small"
                  color="error"
                  variant="outlined"
                  label={`$${Number(loan.amount ?? 0).toLocaleString('es-AR')}`}
                />
              </Box>
            ))
          )}
        </Box>

        <TextField
          label="Notas (opcional)"
          placeholder="Motivo o detalle de la pérdida…"
          multiline
          minRows={2}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
          inputProps={{ maxLength: 1000 }}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Block fontSize="small" color="error" sx={{ mt: 0.25 }} />
            <Typography variant="body2" color="text.secondary">
              El cliente entra a la <strong>lista negra</strong> y no podrá
              volver a cargarse.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Restore fontSize="small" color="warning" sx={{ mt: 0.25 }} />
            <Typography variant="body2" color="text.secondary">
              Tu subadmin será notificado y puede revertir esta baja dentro de
              las <strong>96 horas</strong>.
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={submitting || loadingLoans}
          startIcon={
            submitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <MoneyOff />
            )
          }
        >
          Confirmar pérdida
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ClientLossDialog
