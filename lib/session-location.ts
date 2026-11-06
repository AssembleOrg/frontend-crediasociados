import { sessionsService } from '@/services/sessions.service'

/**
 * Pide la ubicación UNA vez, al iniciar sesión en este dispositivo, para
 * mostrar en "Dispositivos" desde dónde se entró (ej. Florencio Varela).
 * No es seguimiento: no se vuelve a pedir mientras la sesión siga abierta.
 * Si el usuario no da permiso, queda la ubicación aproximada por conexión.
 */
export function captureSessionLocation(): void {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) return
  try {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sessionsService
          .setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : undefined,
          })
          .catch(() => undefined)
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    )
  } catch {
    // navegador sin permiso / contexto inseguro
  }
}
