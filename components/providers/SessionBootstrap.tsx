'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { sessionsService } from '@/services/sessions.service'
import { usersService } from '@/services/users.service'
import { apiUserToUser } from '@/types/transforms'
import { captureSessionLocation } from '@/lib/session-location'

/**
 * Al abrir el panel (una vez por carga de página):
 * - Si la sesión es de antes de "Dispositivos", el backend la registra como
 *   dispositivo y renueva la cookie, sin volver a pedir login.
 * - Si la cookie sigue viva pero el navegador borró los datos locales
 *   (iOS lo hace con apps que no se abren en días), se recarga el usuario en
 *   vez de dejar el panel vacío.
 */
export function SessionBootstrap() {
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    sessionsService
      .ensure()
      .then(async (res) => {
        if (res?.upgraded) captureSessionLocation()

        const auth = useAuthStore.getState()
        if (res?.userId && (!auth.isAuthenticated || auth.userId !== res.userId)) {
          const user = apiUserToUser(await usersService.getUserById(res.userId))
          auth.setUser(user)
          auth.setTokens(null, null)
          auth.setAuthentication(true)
          useUsersStore.getState().upsertUsers([user])
        }
      })
      .catch(() => undefined) // 401 lo maneja el interceptor de api
  }, [])

  return null
}
