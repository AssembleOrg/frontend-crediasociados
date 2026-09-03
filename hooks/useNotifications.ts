'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import {
  notificationsService,
  type AppNotification,
} from '@/services/notifications.service'

/**
 * Bandeja de notificaciones in-app + updates en tiempo real.
 *
 * El socket entra por el rewrite /api de Next (same-origin) para que viaje la
 * cookie de sesión httpOnly; el backend sirve socket.io en /api/v1/socket.io.
 * Transporte polling: el rewrite de Next no proxya upgrades de websocket.
 */
export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const page = await notificationsService.getMine({ page: 1, limit: 20 })
      setNotifications(page.items ?? [])
      setUnreadCount(page.unreadCount ?? 0)
    } catch {
      // graceful — la campanita no debe romper el dashboard
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    refresh()

    const socket = io('/notifications', {
      path: '/api/socket.io',
      transports: ['polling'],
      withCredentials: true,
      reconnectionDelayMax: 30000,
      // Sin trailing slash: Next redirige /api/socket.io/ → /api/socket.io
      // (308) y ese redirect rompía el handshake con un 404 en el backend.
      addTrailingSlash: false,
    })
    socketRef.current = socket

    socket.on('notification', (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50))
      setUnreadCount((prev) => prev + 1)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled, refresh])

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id && !n.readAt
          ? { ...n, readAt: new Date().toISOString() }
          : n,
      ),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await notificationsService.markRead(id)
    } catch {
      // optimista — si falla, el próximo refresh corrige
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
    )
    setUnreadCount(0)
    try {
      await notificationsService.markAllRead()
    } catch {
      // optimista
    }
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markRead,
    markAllRead,
  }
}
