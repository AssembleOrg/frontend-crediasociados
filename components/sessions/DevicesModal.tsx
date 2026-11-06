'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Close,
  Computer,
  ExpandLess,
  ExpandMore,
  PhoneAndroid,
  PhoneIphone,
  PlaceOutlined,
  TabletMac,
} from '@mui/icons-material'
import { GoogleMap, InfoWindowF, MarkerF, useLoadScript } from '@react-google-maps/api'
import { sessionsService, type DeviceSession } from '@/services/sessions.service'
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from '@/lib/google-maps'

interface DevicesModalProps {
  open: boolean
  onClose: () => void
}

const TZ = 'America/Argentina/Buenos_Aires'

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 10) return 'activa ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return days === 1 ? 'ayer' : `hace ${days} días`
}

function placeLabel(s: DeviceSession) {
  const main = s.area || s.locality
  if (!main) return s.latitude != null ? 'Ubicación sin nombre' : 'Ubicación desconocida'
  const sub = s.locality && s.locality !== main ? ` (${s.locality})` : ''
  const region = s.region && s.region !== main && s.region !== 'CABA' ? ` · ${s.region}` : ''
  return `${main}${sub}${region}`
}

function DeviceIcon({ device }: { device: string | null }) {
  const d = device || ''
  if (d.startsWith('iPhone')) return <PhoneIphone />
  if (d.startsWith('iPad')) return <TabletMac />
  if (d.startsWith('Android')) return <PhoneAndroid />
  return <Computer />
}

function SessionRow({
  session,
  onRevoke,
  revoking,
}: {
  session: DeviceSession
  onRevoke?: (id: string) => void
  revoking?: boolean
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 1.25 }}>
      <Box sx={{ color: session.active ? 'primary.main' : 'text.disabled', pt: 0.25 }}>
        <DeviceIcon device={session.device} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant='body2' sx={{ fontWeight: 600 }}>
            {session.device || 'Dispositivo'}
          </Typography>
          {session.current && <Chip label='Este dispositivo' size='small' color='primary' />}
        </Box>
        <Typography variant='body2' color='text.secondary' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PlaceOutlined sx={{ fontSize: 16 }} />
          {placeLabel(session)}
          {session.locationSource === 'ip' && ' · aprox.'}
        </Typography>
        <Typography variant='caption' color='text.secondary' display='block'>
          Entró el {formatDateTime(session.createdAt)}
          {session.active
            ? ` · ${session.current ? 'activa ahora' : timeAgo(session.lastSeenAt)}`
            : session.revokedAt
              ? ` · cerrada el ${formatDateTime(session.revokedAt)}`
              : ''}
        </Typography>
      </Box>
      {onRevoke && session.active && !session.current && (
        <Button
          size='small'
          color='error'
          variant='outlined'
          onClick={() => onRevoke(session.id)}
          disabled={revoking}
          aria-label={`Cerrar sesión en ${session.device || 'el dispositivo'}`}
          sx={{ flexShrink: 0 }}
        >
          {revoking ? <CircularProgress size={16} /> : 'Cerrar'}
        </Button>
      )}
    </Box>
  )
}

function SessionsMap({ sessions }: { sessions: DeviceSession[] }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selected, setSelected] = useState<DeviceSession | null>(null)
  const points = useMemo(
    () => sessions.filter((s) => s.latitude != null && s.longitude != null),
    [sessions],
  )

  useEffect(() => {
    if (!map || points.length === 0) return
    if (points.length === 1) {
      map.setCenter({ lat: points[0].latitude!, lng: points[0].longitude! })
      map.setZoom(13)
      return
    }
    const bounds = new google.maps.LatLngBounds()
    points.forEach((p) => bounds.extend({ lat: p.latitude!, lng: p.longitude! }))
    map.fitBounds(bounds, 40)
  }, [map, points])

  if (points.length === 0) {
    return (
      <Alert severity='info' sx={{ mb: 2 }}>
        Todavía no hay ubicaciones para mostrar en el mapa.
      </Alert>
    )
  }
  if (!GOOGLE_MAPS_API_KEY || loadError) return null
  if (!isLoaded) {
    return (
      <Box sx={{ height: 220, display: 'grid', placeItems: 'center', mb: 2 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  return (
    <Box sx={{ height: { xs: 220, sm: 280 }, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        onLoad={setMap}
        options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false, gestureHandling: 'cooperative' }}
      >
        {points.map((s) => (
          <MarkerF
            key={s.id}
            position={{ lat: s.latitude!, lng: s.longitude! }}
            onClick={() => setSelected(s)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: s.current ? 9 : 7,
              fillColor: s.active ? '#1976d2' : '#9e9e9e',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        ))}
        {selected && (
          <InfoWindowF
            position={{ lat: selected.latitude!, lng: selected.longitude! }}
            onCloseClick={() => setSelected(null)}
          >
            <Box sx={{ color: '#222', fontSize: 13 }}>
              <strong>{selected.device}</strong>
              <br />
              {placeLabel(selected)}
              <br />
              {formatDateTime(selected.createdAt)}
            </Box>
          </InfoWindowF>
        )}
      </GoogleMap>
    </Box>
  )
}

export function DevicesModal({ open, onClose }: DevicesModalProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [sessions, setSessions] = useState<DeviceSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const [closingAll, setClosingAll] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSessions(await sessionsService.list())
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar los dispositivos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setNotice(null)
      setConfirmAll(false)
      load()
    }
  }, [open, load])

  const current = sessions.find((s) => s.current)
  const others = sessions.filter((s) => s.active && !s.current)
  const history = sessions.filter((s) => !s.active)

  const handleRevoke = async (id: string) => {
    setRevokingId(id)
    setError(null)
    try {
      await sessionsService.revoke(id)
      setNotice('Listo, ese dispositivo quedó desconectado.')
      await load()
    } catch (e: any) {
      setError(e?.message || 'No se pudo cerrar la sesión')
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeOthers = async () => {
    setClosingAll(true)
    setError(null)
    try {
      await sessionsService.revokeOthers()
      setConfirmAll(false)
      setNotice('Listo, se cerró la sesión en todos los demás dispositivos.')
      await load()
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cerrar las sesiones')
    } finally {
      setClosingAll(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        Dispositivos y sesiones
        <IconButton onClick={onClose} aria-label='Cerrar ventana'>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && sessions.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
            {notice && <Alert severity='success' sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}

            <SessionsMap sessions={sessions.filter((s) => s.active || showHistory)} />

            <Typography variant='overline' color='text.secondary'>Este dispositivo</Typography>
            {current ? (
              <SessionRow session={current} />
            ) : (
              <Typography variant='body2' color='text.secondary' sx={{ py: 1 }}>
                Registrando este dispositivo… volvé a abrir esta pantalla en unos segundos.
              </Typography>
            )}

            <Divider sx={{ my: 1.5 }} />

            <Typography variant='overline' color='text.secondary'>
              Otras sesiones abiertas ({others.length})
            </Typography>
            {others.length === 0 ? (
              <Typography variant='body2' color='text.secondary' sx={{ py: 1 }}>
                No hay otros dispositivos con la sesión abierta.
              </Typography>
            ) : (
              others.map((s) => (
                <SessionRow key={s.id} session={s} onRevoke={handleRevoke} revoking={revokingId === s.id} />
              ))
            )}

            <Box sx={{ mt: 1.5 }}>
              {!confirmAll ? (
                <Button fullWidth color='error' variant='outlined' onClick={() => setConfirmAll(true)}>
                  Cerrar sesión en todos los demás dispositivos
                </Button>
              ) : (
                <Alert
                  severity='warning'
                  action={
                    <Stack direction='row' spacing={1}>
                      <Button size='small' color='inherit' onClick={() => setConfirmAll(false)} disabled={closingAll}>
                        No
                      </Button>
                      <Button size='small' color='error' variant='contained' onClick={handleRevokeOthers} disabled={closingAll}>
                        {closingAll ? <CircularProgress size={16} color='inherit' /> : 'Sí, cerrar'}
                      </Button>
                    </Stack>
                  }
                >
                  Se va a cerrar la sesión en todos los teléfonos y computadoras menos este.
                </Alert>
              )}
            </Box>

            {history.length > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Button
                  size='small'
                  onClick={() => setShowHistory((v) => !v)}
                  endIcon={showHistory ? <ExpandLess /> : <ExpandMore />}
                  sx={{ px: 0 }}
                >
                  Historial de sesiones cerradas ({history.length})
                </Button>
                <Collapse in={showHistory}>
                  {history.map((s) => (
                    <SessionRow key={s.id} session={s} />
                  ))}
                </Collapse>
              </>
            )}

            <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 2 }}>
              La ubicación se toma una sola vez, al iniciar sesión, si el teléfono da permiso. No es
              seguimiento en vivo. &quot;aprox.&quot; = calculada por la conexión a internet.
            </Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
