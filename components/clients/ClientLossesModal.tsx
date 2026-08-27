'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { Close, MoneyOff, Restore } from '@mui/icons-material'
import { DateTime } from 'luxon'
import {
  clientLossesService,
  type ClientLoss,
} from '@/services/client-losses.service'

interface ClientLossesModalProps {
  open: boolean
  onClose: () => void
}

const formatMoney = (value: unknown) =>
  `$${Number(value ?? 0).toLocaleString('es-AR')}`

function remainingLabel(revertibleUntil?: string): string {
  if (!revertibleUntil) return ''
  const diff = DateTime.fromISO(revertibleUntil).diffNow(['hours', 'minutes'])
  if (diff.as('milliseconds') <= 0) return 'Expirada'
  const hours = Math.floor(diff.hours)
  const minutes = Math.floor(diff.minutes)
  return `${hours}h ${minutes}m restantes`
}

/**
 * Listado de bajas por pérdida para el subadmin, con reversión dentro
 * de la ventana de 96hs.
 */
export default function ClientLossesModal({
  open,
  onClose,
}: ClientLossesModalProps) {
  const theme = useTheme()

  const [losses, setLosses] = useState<ClientLoss[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revertingId, setRevertingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await clientLossesService.getAll({ page: 1, limit: 50 })
      setLosses(page.items ?? [])
    } catch (err) {
      setError(
        (err as { message?: string })?.message ||
          'No se pudieron cargar las pérdidas',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setFeedback(null)
      loadData()
    }
  }, [open, loadData])

  const handleRevert = async (loss: ClientLoss) => {
    setRevertingId(loss.id)
    setError(null)
    setFeedback(null)
    try {
      await clientLossesService.revert(loss.id)
      setFeedback(
        `Pérdida de ${loss.client?.fullName ?? 'cliente'} revertida: cliente y préstamos restaurados.`,
      )
      await loadData()
    } catch (err) {
      setError(
        (err as { message?: string })?.message ||
          'No se pudo revertir la pérdida',
      )
    } finally {
      setRevertingId(null)
    }
  }

  const totalLost = losses
    .filter((loss) => !loss.revertedAt)
    .reduce((sum, loss) => sum + Number(loss.lostAmount ?? 0), 0)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: { xs: 2, sm: 3 }, m: { xs: 1, sm: 4 } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        <MoneyOff color="error" />
        Pérdidas registradas
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Clientes dados de baja por deuda incobrable. Podés revertir una
            baja hasta 96hs después de registrada.
          </Typography>
          <Chip
            color="error"
            variant="outlined"
            size="small"
            label={`Total perdido: ${formatMoney(totalLost)}`}
          />
        </Box>

        {feedback && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
            {feedback}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={28} />
          </Box>
        ) : losses.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <MoneyOff sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No hay pérdidas registradas
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.error.main, 0.04) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cobrador</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Deuda perdida
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Acción
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {losses.map((loss) => {
                  const created = DateTime.fromISO(loss.createdAt)
                  return (
                    <TableRow key={loss.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {loss.client?.fullName ?? '—'}
                        </Typography>
                        {loss.client?.dni && (
                          <Typography variant="caption" color="text.secondary">
                            DNI {loss.client.dni}
                          </Typography>
                        )}
                        {loss.notes && (
                          <Tooltip title={loss.notes}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                maxWidth: 180,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              “{loss.notes}”
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {loss.manager?.fullName ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color="error.main"
                          sx={{ fontWeight: 700 }}
                        >
                          {formatMoney(loss.lostAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {created.isValid
                            ? created.setLocale('es').toFormat('dd/MM/yy HH:mm')
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {loss.revertedAt ? (
                          <Chip
                            size="small"
                            color="success"
                            variant="outlined"
                            icon={<Restore fontSize="small" />}
                            label={`Revertida${loss.revertedBy?.fullName ? ` por ${loss.revertedBy.fullName}` : ''}`}
                          />
                        ) : loss.canRevert ? (
                          <Chip
                            size="small"
                            color="warning"
                            variant="outlined"
                            label={remainingLabel(loss.revertibleUntil)}
                          />
                        ) : (
                          <Chip size="small" variant="outlined" label="Definitiva" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {!loss.revertedAt && loss.canRevert && (
                          <Button
                            size="small"
                            color="warning"
                            variant="outlined"
                            disabled={revertingId === loss.id}
                            startIcon={
                              revertingId === loss.id ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <Restore fontSize="small" />
                              )
                            }
                            onClick={() => handleRevert(loss)}
                            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                          >
                            Revertir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  )
}
