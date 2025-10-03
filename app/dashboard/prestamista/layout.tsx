'use client'

import { Box, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { Dashboard, People, AccountBalance, Payment, AttachMoney, Receipt, Analytics } from '@mui/icons-material'
import { useRouter, usePathname } from 'next/navigation'
import { QuickActions } from '@/components/dashboard/QuickActions'
import SubLoansProvider from '@/components/providers/SubLoansProvider'
import OperativaProvider from '@/components/providers/OperativaProvider'
import FinanzasProvider from '@/components/providers/FinanzasProvider'

const prestamistaMenuItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/prestamista' },
  { label: 'Reportes', icon: <Analytics />, path: '/dashboard/prestamista/reportes' },
  { label: 'Clientes', icon: <People />, path: '/dashboard/prestamista/clientes' },
  { label: 'Préstamos', icon: <AccountBalance />, path: '/dashboard/prestamista/prestamos' },
  { label: 'Cobros Diarios', icon: <Payment />, path: '/dashboard/prestamista/cobros' },
  { label: 'Finanzas', icon: <AttachMoney />, path: '/dashboard/prestamista/finanzas' },
  { label: 'Operativa', icon: <Receipt />, path: '/dashboard/prestamista/operativo' },
]

const quickActions = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/prestamista' },
  { label: 'Reportes', icon: <Analytics />, path: '/dashboard/prestamista/reportes' },
  { label: 'Clientes', icon: <People />, path: '/dashboard/prestamista/clientes' },
  { label: 'Préstamos', icon: <AccountBalance />, path: '/dashboard/prestamista/prestamos' },
  { label: 'Cobros', icon: <Payment />, path: '/dashboard/prestamista/cobros' },
  { label: 'Finanzas', icon: <AttachMoney />, path: '/dashboard/prestamista/finanzas' },
  { label: 'Operativa', icon: <Receipt />, path: '/dashboard/prestamista/operativo' },
]

export default function PrestamistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <SubLoansProvider>
      <OperativaProvider>
        <FinanzasProvider>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 0, md: 3 },
            height: '100%'
          }}>
            {/* Sidebar - Solo Desktop */}
            <Paper
              elevation={1}
              sx={{
                width: 280,
                p: 2,
                height: 'fit-content',
                position: 'sticky',
                top: 0,
                display: { xs: 'none', md: 'block' }
              }}
            >
              <List>
                {prestamistaMenuItems.map((item, index) => (
                  <ListItem
                    key={index}
                    onClick={() => router.push(item.path)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: pathname === item.path ? 'primary.main' : 'transparent',
                      color: pathname === item.path ? 'white' : 'inherit',
                      '&:hover': {
                        bgcolor: pathname === item.path ? 'primary.dark' : 'grey.100'
                      }
                    }}
                  >
                    <ListItemIcon sx={{
                      color: pathname === item.path ? 'white' : 'inherit'
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Content */}
            <Box sx={{
              flexGrow: 1,
              minWidth: 0,
              minHeight: 'calc(100vh - 80px)'
            }}>
              {/* QuickActions - Solo Mobile */}
              <QuickActions actions={quickActions} />

              {children}
            </Box>
          </Box>
        </FinanzasProvider>
      </OperativaProvider>
    </SubLoansProvider>
  )
}