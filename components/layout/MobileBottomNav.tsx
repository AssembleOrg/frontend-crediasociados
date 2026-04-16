'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  ButtonBase,
  Typography,
  Badge,
  SwipeableDrawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import {
  Dashboard,
  Route as RouteIcon,
  Payment,
  People,
  AccountBalance,
  MoreHoriz,
  Analytics,
  AttachMoney,
  EventNote,
  Close,
  VerifiedUser,
  PersonOff,
  Warning,
  Block,
} from '@mui/icons-material'
import { useRouter, usePathname } from 'next/navigation'
import { iosColors } from '@/lib/theme'
import { useBottomSheet } from '@/hooks/useBottomSheet'
import { useAuth } from '@/hooks/useAuth'
import { useSubadminStore } from '@/stores/subadmin'

// ─── Nav items per role ───────────────────────────────────────────────────────

interface NavItem {
  label:   string
  icon:    React.ReactNode
  path:    string
  badge?:  number
}

const MANAGER_PRIMARY: NavItem[] = [
  { label: 'Dashboard',  icon: <Dashboard sx={{ fontSize: 24 }} />,      path: '/dashboard/prestamista' },
  { label: 'Ruta',       icon: <RouteIcon sx={{ fontSize: 24 }} />,      path: '/dashboard/prestamista/rutas' },
  { label: 'Cobros',     icon: <Payment sx={{ fontSize: 24 }} />,        path: '/dashboard/prestamista/cobros' },
  { label: 'Clientes',   icon: <People sx={{ fontSize: 24 }} />,         path: '/dashboard/prestamista/clientes' },
  { label: 'Préstamos',  icon: <AccountBalance sx={{ fontSize: 24 }} />, path: '/dashboard/prestamista/prestamos' },
]
const MANAGER_MORE: NavItem[] = [
  { label: 'Reportes',   icon: <Analytics />,   path: '/dashboard/prestamista/reportes' },
  { label: 'Finanzas',   icon: <AttachMoney />, path: '/dashboard/prestamista/finanzas' },
  { label: 'Cierre Día', icon: <EventNote />,   path: '/dashboard/prestamista/cierre-dia' },
]

const SUBADMIN_PRIMARY: NavItem[] = [
  { label: 'Dashboard',   icon: <Dashboard sx={{ fontSize: 24 }} />,  path: '/dashboard/subadmin' },
  { label: 'Reportes',    icon: <Analytics sx={{ fontSize: 24 }} />,  path: '/dashboard/subadmin/reportes' },
  { label: 'Cobradores',  icon: <People sx={{ fontSize: 24 }} />,     path: '/dashboard/subadmin/usuarios' },
  { label: 'Operativa',   icon: <EventNote sx={{ fontSize: 24 }} />,  path: '/dashboard/subadmin/operativo' },
]
const SUBADMIN_MORE: NavItem[] = [
  { label: 'No Verificados', icon: <VerifiedUser />, path: '/dashboard/subadmin?modal=unverified' },
  { label: 'Inactivos',      icon: <PersonOff />,    path: '/dashboard/subadmin?modal=inactive' },
  { label: 'Vencidos',       icon: <Warning />,      path: '/dashboard/subadmin?modal=overdue' },
  { label: 'Lista Negra',    icon: <Block />,         path: '/dashboard/subadmin?modal=blacklist' },
  { label: 'Prést. Activos', icon: <AccountBalance />, path: '/dashboard/subadmin?modal=activeloans' },
]

const ADMIN_PRIMARY: NavItem[] = [
  { label: 'Dashboard',  icon: <Dashboard sx={{ fontSize: 24 }} />, path: '/dashboard/admin' },
  { label: 'Reportes',   icon: <Analytics sx={{ fontSize: 24 }} />, path: '/dashboard/admin/reportes' },
  { label: 'Asociados',  icon: <People sx={{ fontSize: 24 }} />,    path: '/dashboard/admin/subadmins' },
]

function getNavItems(role: string | null | undefined): { primary: NavItem[]; more: NavItem[] } {
  if (role === 'subadmin') return { primary: SUBADMIN_PRIMARY, more: SUBADMIN_MORE }
  if (role === 'admin')    return { primary: ADMIN_PRIMARY,    more: [] }
  return { primary: MANAGER_PRIMARY, more: MANAGER_MORE }
}

// ─── Single nav button ────────────────────────────────────────────────────────

interface NavButtonProps {
  item:      NavItem
  isActive:  boolean
  onClick:   () => void
}

function NavButton({ item, isActive, onClick }: NavButtonProps) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '2px',
        minWidth:       44,
        minHeight:      44,
        flex:           1,
        borderRadius:   12,
        px:             0.5,
        py:             0.75,
        color:          isActive ? iosColors.blue : iosColors.gray1,
        transition:     'color 0.15s ease',
        '&:active': { opacity: 0.6 },
      }}
    >
      <Badge
        badgeContent={item.badge ?? 0}
        color="error"
        max={99}
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.6rem',
            minWidth: 16,
            height:   16,
            top:      2,
            right:    2,
          },
        }}
      >
        {item.icon}
      </Badge>
      <Typography
        component="span"
        sx={{
          fontSize:    '0.625rem',
          fontWeight:  isActive ? 700 : 500,
          lineHeight:  1,
          color:       'inherit',
          letterSpacing: 0,
        }}
      >
        {item.label}
      </Typography>
    </ButtonBase>
  )
}

// ─── More Drawer ──────────────────────────────────────────────────────────────

interface MoreDrawerProps {
  open:     boolean
  onClose:  () => void
  onOpen:   () => void
  pathname: string
  onNav:    (path: string) => void
  items:    NavItem[]
}

function MoreDrawer({ open, onClose, onOpen, pathname, onNav, items }: MoreDrawerProps) {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderRadius:    '20px 20px 0 0',
          paddingBottom:   'env(safe-area-inset-bottom)',
          backgroundColor: iosColors.secondaryBackground,
        },
      }}
    >
      {/* Handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: iosColors.gray3 }} />
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Más opciones</Typography>
        <ButtonBase
          onClick={onClose}
          sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: iosColors.gray5, color: iosColors.gray1 }}
        >
          <Close sx={{ fontSize: 18 }} />
        </ButtonBase>
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            selected={pathname === item.path}
            onClick={() => onNav(item.path)}
            sx={{ borderRadius: 12, mb: 0.5, minHeight: 52 }}
          >
            <ListItemIcon sx={{ color: pathname === item.path ? iosColors.blue : iosColors.gray1, minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontWeight: 500, fontSize: '1rem' }}
            />
          </ListItemButton>
        ))}
      </List>
    </SwipeableDrawer>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MobileBottomNavProps {
  /** Badge counts — keyed by route path */
  badges?: Partial<Record<string, number>>
}

export function MobileBottomNav({ badges = {} }: MobileBottomNavProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user }  = useAuth()
  const setPendingModal = useSubadminStore((s) => s.setPendingModal)

  const { primary, more } = getNavItems(user?.role)
  const [moreOpen, setMoreOpen] = useState(false)
  const { handleOpen: openMore, handleClose: closeMore } = useBottomSheet(moreOpen, setMoreOpen)

  const isMoreActive = more.some((i) => i.path.split('?')[0] === pathname)

  const handleNav = (path: string) => {
    closeMore()
    const [basePath, query] = path.split('?')
    const modal = query ? new URLSearchParams(query).get('modal') : null
    if (modal) {
      setPendingModal(modal)
      router.push(basePath)
    } else {
      router.push(path)
    }
  }

  return (
    <>
      {/* ── Glassmorphism bar ──────────────────────────────────────── */}
      <Paper
        component="nav"
        elevation={0}
        sx={{
          display:              { xs: 'flex', md: 'none' },
          position:             'fixed',
          bottom:               0,
          left:                 0,
          right:                0,
          zIndex:               (t) => t.zIndex.appBar + 1,

          backdropFilter:       'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor:      'rgba(242, 242, 247, 0.85)',
          borderTop:            `0.5px solid ${iosColors.separator}`,
          borderRadius:         0,
          boxShadow:            'none',

          alignItems:           'center',
          paddingBottom:        'env(safe-area-inset-bottom)',
          paddingX:             1,
          paddingTop:           0.5,
          gap:                  0,
          overflowX:            'auto',
          scrollbarWidth:       'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {primary.map((item) => (
          <NavButton
            key={item.path}
            item={{ ...item, badge: badges[item.path] }}
            isActive={pathname === item.path}
            onClick={() => router.push(item.path)}
          />
        ))}

        {/* More button — only if this role has overflow items */}
        {more.length > 0 && (
          <NavButton
            item={{ label: 'Más', icon: <MoreHoriz sx={{ fontSize: 24 }} />, path: '' }}
            isActive={isMoreActive}
            onClick={openMore}
          />
        )}
      </Paper>

      {/* ── More Drawer ────────────────────────────────────────────── */}
      {more.length > 0 && (
        <MoreDrawer
          open={moreOpen}
          onClose={closeMore}
          onOpen={openMore}
          pathname={pathname}
          onNav={handleNav}
          items={more}
        />
      )}
    </>
  )
}
