'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material';
import { Dashboard, People, Analytics, Receipt } from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import DashboardDataProvider from '@/components/providers/DashboardDataProvider';
import { useUsers } from '@/hooks/useUsers';
import { iosColors } from '@/lib/theme';
import { useSubadminStore } from '@/stores/subadmin';

const InactiveClientsModal = dynamic(
  () => import('@/components/clients/InactiveClientsModal'),
  { ssr: false }
)
const ActiveLoansClientsModal = dynamic(
  () => import('@/components/clients/ActiveLoansClientsModal'),
  { ssr: false }
)
const UnverifiedClientsModal = dynamic(
  () => import('@/components/clients/UnverifiedClientsModal'),
  { ssr: false }
)
const OverdueClientsModal = dynamic(
  () => import('@/components/clients/OverdueClientsModal'),
  { ssr: false }
)
// commented by july
// const BlacklistModal = dynamic(
//   () => import('@/components/clients/BlacklistModal'),
//   { ssr: false }
// )

const subadminMenuItems = [
  { label: 'Dashboard',   icon: <Dashboard />,  path: '/dashboard/subadmin' },
  { label: 'Reportes',    icon: <Analytics />,  path: '/dashboard/subadmin/reportes' },
  { label: 'Cobradores',  icon: <People />,     path: '/dashboard/subadmin/usuarios' },
  { label: 'Operativa',   icon: <Receipt />,    path: '/dashboard/subadmin/operativo' },
];

export default function SubadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const { fetchUsers } = useUsers();
  const pendingModal    = useSubadminStore((s) => s.pendingModal)
  const setPendingModal = useSubadminStore((s) => s.setPendingModal)

  const [inactiveOpen, setInactiveOpen]       = useState(false)
  const [activeLoansOpen, setActiveLoansOpen] = useState(false)
  const [unverifiedOpen, setUnverifiedOpen]   = useState(false)
  const [overdueOpen, setOverdueOpen]         = useState(false)
  // commented by july
  // const [blacklistOpen, setBlacklistOpen]     = useState(false)

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pendingModal) return
    if (pendingModal === 'unverified')  setUnverifiedOpen(true)
    if (pendingModal === 'inactive')    setInactiveOpen(true)
    if (pendingModal === 'overdue')     setOverdueOpen(true)
    // commented by july
    // if (pendingModal === 'blacklist')   setBlacklistOpen(true)
    if (pendingModal === 'activeloans') setActiveLoansOpen(true)
    setPendingModal(null)
  }, [pendingModal, setPendingModal]);

  return (
    <DashboardDataProvider>
      <Box
        sx={{
          display:       'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap:           { xs: 0, md: 3 },
          minHeight:     0,
        }}
      >
        {/* ── Sidebar — Desktop only ── */}
        <Paper
          elevation={1}
          sx={{
            width:      240,
            p:          1.5,
            height:     'fit-content',
            position:   'sticky',
            top:        16,
            display:    { xs: 'none', md: 'block' },
            flexShrink: 0,
          }}
        >
          <List disablePadding>
            {subadminMenuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <ListItemButton
                  key={item.path}
                  selected={isActive}
                  onClick={() => router.push(item.path)}
                  sx={{
                    borderRadius: 2,
                    mb:           0.5,
                    minHeight:    44,
                    color:        isActive ? iosColors.blue : 'text.primary',
                    bgcolor:      isActive ? alpha(iosColors.blue, 0.1) : 'transparent',
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
              );
            })}
          </List>
        </Paper>

        {/* ── Main content ── */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {children}
        </Box>
      </Box>

      {/* ── Modales globales del área subadmin (accesibles desde cualquier subruta) ── */}
      <InactiveClientsModal    open={inactiveOpen}    onClose={() => setInactiveOpen(false)} />
      <ActiveLoansClientsModal open={activeLoansOpen} onClose={() => setActiveLoansOpen(false)} />
      <UnverifiedClientsModal  open={unverifiedOpen}  onClose={() => setUnverifiedOpen(false)} />
      <OverdueClientsModal     open={overdueOpen}     onClose={() => setOverdueOpen(false)} />
      {/* commented by july */}
      {/* <BlacklistModal          open={blacklistOpen}   onClose={() => setBlacklistOpen(false)} /> */}
    </DashboardDataProvider>
  );
}
