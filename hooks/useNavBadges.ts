'use client'

import { useEffect, useState } from 'react'
import collectionRoutesService from '@/services/collection-routes.service'
import { subLoansService } from '@/services/sub-loans.service'

interface NavBadges {
  '/dashboard/prestamista/rutas': number
  '/dashboard/prestamista/cobros': number
}

/**
 * Fetches lightweight badge counts for the mobile bottom nav.
 * Only runs for MANAGER role (prestamista). Gracefully returns 0 on error.
 */
export function useNavBadges(role: string | null | undefined): Partial<NavBadges> {
  const [badges, setBadges] = useState<Partial<NavBadges>>({})

  useEffect(() => {
    if (role !== 'MANAGER') return

    // Ruta badge: pending items in today's route
    collectionRoutesService
      .getTodayRoute(undefined)
      .then((route) => {
        const pending = route?.items?.filter(
          (item) => item.subLoan && item.subLoan.status !== 'PAID',
        ).length ?? 0
        setBadges((prev) => ({ ...prev, '/dashboard/prestamista/rutas': pending || 0 }))
      })
      .catch(() => { /* graceful — badge stays 0 */ })

    // Cobros badge: clients with overdue installments
    subLoansService
      .getOverdueClients()
      .then((res) => {
        const count = res?.clients?.length ?? 0
        setBadges((prev) => ({ ...prev, '/dashboard/prestamista/cobros': count || 0 }))
      })
      .catch(() => { /* graceful — badge stays 0 */ })
  }, [role])

  return badges
}
