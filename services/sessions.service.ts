import api from './api'

export interface DeviceSession {
  id: string
  device: string | null
  ip: string | null
  locality: string | null
  area: string | null
  region: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  locationSource: 'gps' | 'ip' | null
  createdAt: string
  lastSeenAt: string
  revokedAt: string | null
  active: boolean
  current: boolean
}

class SessionsService {
  async list(): Promise<DeviceSession[]> {
    const res = await api.get('/auth/sessions')
    return res.data.data ?? []
  }

  /** Registra este dispositivo si la sesión es de antes de los dispositivos. */
  async ensure(): Promise<{ upgraded: boolean; userId: string; role: string }> {
    const res = await api.post('/auth/sessions/ensure')
    return res.data.data
  }

  async setLocation(loc: { latitude: number; longitude: number; accuracy?: number }) {
    const res = await api.post('/auth/sessions/current/location', loc)
    return res.data.data
  }

  async revoke(id: string) {
    await api.delete(`/auth/sessions/${id}`)
  }

  async revokeOthers(): Promise<{ closed: number }> {
    const res = await api.post('/auth/sessions/revoke-others')
    return res.data.data
  }
}

export const sessionsService = new SessionsService()
