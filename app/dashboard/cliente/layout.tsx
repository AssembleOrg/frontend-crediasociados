'use client'

import { Box, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { Dashboard, AccountBalance, Person, History } from '@mui/icons-material'
import { useRouter, usePathname } from 'next/navigation'
import { QuickActions } from '@/components/dashboard/QuickActions'

const clienteMenuItems = [
  { label: 'Mi Dashboard', icon: <Dashboard />, path: '/dashboard/cliente' },
  { label: 'Mis Préstamos', icon: <AccountBalance />, path: '/dashboard/cliente/prestamos' },
  { label: 'Mi Perfil', icon: <Person />, path: '/dashboard/cliente/perfil' },
  { label: 'Historial', icon: <History />, path: '/dashboard/cliente/historial' }
]

const clienteQuickActions = [
  { label: 'Mi Dashboard', icon: <Dashboard />, path: '/dashboard/cliente', variant: 'contained' as const },
  { label: 'Mis Préstamos', icon: <AccountBalance />, path: '/dashboard/cliente/prestamos' },
  { label: 'Mi Perfil', icon: <Person />, path: '/dashboard/cliente/perfil' },
  { label: 'Historial', icon: <History />, path: '/dashboard/cliente/historial' }
]

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
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
          {clienteMenuItems.map((item, index) => (
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
        minWidth: 0
      }}>
        {/* QuickActions - Solo Mobile */}
        <QuickActions actions={clienteQuickActions} />
        
        {children}
      </Box>
    </Box>
  )
}