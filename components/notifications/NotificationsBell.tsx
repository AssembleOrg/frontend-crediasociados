'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Badge,
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
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Close,
  DoneAll,
  MoneyOff,
  NotificationsNone,
  PersonAdd,
  ReceiptLong,
  Restore,
} from '@mui/icons-material'
import { DateTime } from 'luxon'
import { useNotifications } from '@/hooks/useNotifications'
import { clientLossesService } from '@/services/client-losses.service'
import type {
  AppNotification,
  NotificationType,
} from '@/services/notifications.service'

interface NotificationsBellProps {
  role?: string | null
}

const TYPE_META: Record<
  NotificationType,
  { icon: React.ReactNode; color: 'primary' | 'error' | 'warning' | 'success' }
> = {
  CLIENT_CREATED: { icon: <PersonAdd fontSize="small" />, color: 'primary' },
  CLIENT_LOSS: { icon: <MoneyOff fontSize="small" />, color: 'error' },
  CLIENT_LOSS_REVERTED: { icon: <Restore fontSize="small" />, color: 'success' },
  LOAN_FINISHED_EARLY: { icon: <ReceiptLong fontSize="small" />, color: 'warning' },
}

const formatMoney = (value: unknown) =>
  `$${Number(value ?? 0).toLocaleString('es-AR')}`

function relativeTime(iso: string): string {
  const dt = DateTime.fromISO(iso)
  return dt.isValid ? dt.toRelative({ locale: 'es' }) ?? '' : ''
}

/** Campanita de notificaciones con updates en tiempo real. */
export function NotificationsBell({ role }: NotificationsBellProps) {
  const theme = useTheme()
  const canRevert = ['subadmin', 'admin', 'superadmin'].includes(role || '')

  const {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications(true)

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [selected, setSelected] = useState<AppNotification | null>(null)
  const [reverting, setReverting] = useState(false)
  const [revertError, setRevertError] = useState<string | null>(null)
  const [revertSuccess, setRevertSuccess] = useState(false)

  const handleOpenItem = (notification: AppNotification) => {
    if (!notification.readAt) markRead(notification.id)
    setSelected(notification)
    setRevertError(null)
    setRevertSuccess(false)
  }

  const handleRevert = async () => {
    const lossId = selected?.data?.clientLossId as string | undefined
    if (!lossId) return
    setReverting(true)
    setRevertError(null)
    try {
      await clientLossesService.revert(lossId)
      setRevertSuccess(true)
    } catch (err) {
      setRevertError(
        (err as { message?: string })?.message ||
          'No se pudo revertir la pérdida',
      )
    } finally {
      setReverting(false)
    }
  }

  const selectedData = (selected?.data ?? {}) as Record<string, unknown>
  const selectedClient = (selectedData.client ?? null) as Record<
    string,
    unknown
  > | null
  const revertibleUntil = selectedData.revertibleUntil as string | undefined
  const revertWindowOpen = useMemo(
    () =>
      !!revertibleUntil &&
      DateTime.fromISO(revertibleUntil).diffNow().as('milliseconds') > 0,
    [revertibleUntil],
  )

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton
          size="medium"
          color="primary"
          onClick={(e) => {
            setAnchorEl(e.currentTarget)
            refresh()
          }}
          aria-label="notificaciones"
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsNone />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 'calc(100vw - 32px)', sm: 400 },
              maxWidth: 400,
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAll fontSize="small" />}
              onClick={markAllRead}
              sx={{ textTransform: 'none' }}
            >
              Marcar leídas
            </Button>
          )}
        </Box>
        <Divider />

        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          {isLoading && notifications.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <NotificationsNone
                sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Sin notificaciones por ahora
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((notification) => {
                const meta = TYPE_META[notification.type] ?? TYPE_META.CLIENT_CREATED
                const unread = !notification.readAt
                return (
                  <ListItemButton
                    key={notification.id}
                    onClick={() => handleOpenItem(notification)}
                    sx={{
                      alignItems: 'flex-start',
                      gap: 1,
                      py: 1.25,
                      bgcolor: unread
                        ? alpha(theme.palette.primary.main, 0.06)
                        : 'transparent',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        mt: 0.5,
                        color: `${meta.color}.main`,
                      }}
                    >
                      {meta.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.disabled"
                            sx={{ display: 'block', mt: 0.25 }}
                          >
                            {relativeTime(notification.createdAt)}
                          </Typography>
                        </>
                      }
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: unread ? 700 : 500,
                      }}
                    />
                  </ListItemButton>
                )
              })}
            </List>
          )}
        </Box>
      </Popover>

      {/* Detalle de notificación */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        maxWidth="xs"
        fullWidth
      >
        {selected && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pr: 6,
              }}
            >
              <Box
                sx={{
                  color: `${(TYPE_META[selected.type] ?? TYPE_META.CLIENT_CREATED).color}.main`,
                  display: 'flex',
                }}
              >
                {(TYPE_META[selected.type] ?? TYPE_META.CLIENT_CREATED).icon}
              </Box>
              {selected.title}
              <IconButton
                onClick={() => setSelected(null)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
                size="small"
              >
                <Close fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selected.message}
              </Typography>

              {/* Ficha completa del cliente (alta de cliente) */}
              {selected.type === 'CLIENT_CREATED' && selectedClient && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                  }}
                >
                  {(
                    [
                      ['Nombre', selectedClient.fullName],
                      ['DNI', selectedClient.dni],
                      ['CUIT', selectedClient.cuit],
                      ['Teléfono', selectedClient.phone],
                      ['Email', selectedClient.email],
                      ['Dirección', selectedClient.address],
                      ['Ocupación', selectedClient.job],
                      ['Trabajo', selectedClient.work],
                      ['Descripción', selectedClient.description],
                    ] as Array<[string, unknown]>
                  )
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <Typography key={label} variant="body2">
                        <strong>{label}:</strong> {String(value)}
                      </Typography>
                    ))}
                  <Typography variant="caption" color="text.secondary">
                    Cargado por {String(selectedData.managerName ?? '')}
                  </Typography>
                </Box>
              )}

              {/* Detalle de pérdida */}
              {selected.type === 'CLIENT_LOSS' && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Deuda perdida:</strong>{' '}
                    {formatMoney(selectedData.lostAmount)}
                  </Typography>
                  {Array.isArray(selectedData.loans) &&
                    (selectedData.loans as Array<Record<string, unknown>>).map(
                      (loan) => (
                        <Typography
                          key={String(loan.loanId)}
                          variant="caption"
                          sx={{ display: 'block' }}
                          color="text.secondary"
                        >
                          {String(loan.loanTrack)} — pendiente{' '}
                          {formatMoney(loan.pendingAmount)}
                        </Typography>
                      ),
                    )}
                  {revertibleUntil && (
                    <Chip
                      size="small"
                      sx={{ mt: 1.5 }}
                      color={revertWindowOpen ? 'warning' : 'default'}
                      label={
                        revertWindowOpen
                          ? `Reversible hasta ${DateTime.fromISO(revertibleUntil).setLocale('es').toFormat("dd/MM HH:mm 'hs'")}`
                          : 'Ventana de reversión expirada'
                      }
                    />
                  )}
                </Box>
              )}

              {/* Crédito finalizado con quita */}
              {selected.type === 'LOAN_FINISHED_EARLY' && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="body2">
                    <strong>Préstamo:</strong> {String(selectedData.loanTrack ?? '')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total pactado:</strong>{' '}
                    {formatMoney(selectedData.totalPactado)}
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    <strong>Monto condonado:</strong>{' '}
                    {formatMoney(selectedData.forgivenAmount)}
                  </Typography>
                </Box>
              )}

              {revertError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {revertError}
                </Alert>
              )}
              {revertSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Pérdida revertida: el cliente y sus préstamos vuelven a estar
                  activos.
                </Alert>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setSelected(null)} color="inherit">
                Cerrar
              </Button>
              {selected.type === 'CLIENT_LOSS' &&
                canRevert &&
                revertWindowOpen &&
                !revertSuccess && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={
                      reverting ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <Restore />
                      )
                    }
                    disabled={reverting}
                    onClick={handleRevert}
                  >
                    Revertir pérdida
                  </Button>
                )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}

export default NotificationsBell
