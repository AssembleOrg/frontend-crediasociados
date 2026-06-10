'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Box, Paper, List, ListItemButton, ListItemIcon, ListItemText, alpha } from '@mui/material'
import {
  Dashboard, People, AccountBalance, Analytics, Route, Payment,
} from '@mui/icons-material'
import { useRouter, usePathname } from 'next/navigation'
import DashboardDataProvider from '@/components/providers/DashboardDataProvider'
import { iosColors } from '@/lib/theme'
import { useManagerStore } from '@/stores/manager'

const SimuladorModal          = dynamic(() => import('@/components/manager/SimuladorModal'), { ssr: false })
const InactiveClientsModal    = dynamic(() => import('@/components/clients/InactiveClientsModal'), { ssr: false })
const ActiveLoansClientsModal = dynamic(() => import('@/components/clients/ActiveLoansClientsModal'), { ssr: false })

const prestamistaMenuItems = [
  { label: 'Dashboard',   icon: <Dashboard />,       path: '/dashboard/prestamista' },
  { label: 'Reportes',    icon: <Analytics />,       path: '/dashboard/prestamista/reportes' },
  { label: 'Clientes',    icon: <People />,          path: '/dashboard/prestamista/clientes' },
  { label: 'Préstamos',   icon: <AccountBalance />,  path: '/dashboard/prestamista/prestamos' },
  { label: 'Ruta del Día',icon: <Route />,           path: '/dashboard/prestamista/rutas' },
  { label: 'Cobros',      icon: <Payment />,         path: '/dashboard/prestamista/cobros' },
]

export default function PrestamistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router   = useRouter()
  const pathname = usePathname()

  const pendingModal    = useManagerStore((s) => s.pendingModal)
  const setPendingModal = useManagerStore((s) => s.setPendingModal)
  const [simuladorOpen,    setSimuladorOpen]    = useState(false)
  const [inactiveOpen,     setInactiveOpen]     = useState(false)
  const [activeLoansOpen,  setActiveLoansOpen]  = useState(false)

  useEffect(() => {
    if (!pendingModal) return
    if (pendingModal === 'simulador')   setSimuladorOpen(true)
    if (pendingModal === 'inactive')    setInactiveOpen(true)
    if (pendingModal === 'activeloans') setActiveLoansOpen(true)
    setPendingModal(null)
  }, [pendingModal, setPendingModal])

  return (
    <DashboardDataProvider>
      <Box sx={{
        display:       'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap:           { xs: 0, md: 3 },
        minHeight:     0,
      }}>
        {/* ── Sidebar — Desktop only ──────────────────────────────── */}
        <Paper
          elevation={1}
          sx={{
            width:    240,
            p:        1.5,
            height:   'fit-content',
            position: 'sticky',
            top:      16,
            display:  { xs: 'none', md: 'block' },
            flexShrink: 0,
          }}
        >
          <List disablePadding>
            {prestamistaMenuItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <ListItemButton
                  key={item.path}
                  selected={isActive}
                  onClick={() => router.push(item.path)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    minHeight: 44,
                    color: isActive ? iosColors.blue : 'text.primary',
                    bgcolor: isActive ? alpha(iosColors.blue, 0.1) : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: alpha(iosColors.blue, 0.1),
                      '&:hover': { bgcolor: alpha(iosColors.blue, 0.15) },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.9375rem' }}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Paper>

        {/* ── Main content ────────────────────────────────────────── */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {children}
        </Box>
      </Box>

      <SimuladorModal          open={simuladorOpen}    onClose={() => setSimuladorOpen(false)} />
      <InactiveClientsModal    open={inactiveOpen}     onClose={() => setInactiveOpen(false)} />
      <ActiveLoansClientsModal open={activeLoansOpen}  onClose={() => setActiveLoansOpen(false)} />
    </DashboardDataProvider>
  )
}