'use client';

import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Dashboard, People, Analytics, AttachMoney, Receipt, Payment } from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { QuickActions } from '@/components/dashboard/QuickActions';
import DashboardDataProvider from '@/components/providers/DashboardDataProvider';

const subadminMenuItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/subadmin' },
  {
    label: 'Cobros',
    icon: <Payment />,
    path: '/dashboard/subadmin/cobros',
  },
  {
    label: 'Reportes',
    icon: <Analytics />,
    path: '/dashboard/subadmin/reportes',
  },
  {
    label: 'Cobradores',
    icon: <People />,
    path: '/dashboard/subadmin/usuarios',
  },
  // {
  //   label: 'Finanzas',
  //   icon: <AttachMoney />,
  //   path: '/dashboard/subadmin/finanzas',
  // },
  {
    label: 'Operativa',
    icon: <Receipt />,
    path: '/dashboard/subadmin/operativo',
  },
];

const subadminQuickActions = [
  {
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard/subadmin',
  },
  {
    label: 'Cobros',
    icon: <Payment />,
    path: '/dashboard/subadmin/cobros',
  },
  {
    label: 'Reportes',
    icon: <Analytics />,
    path: '/dashboard/subadmin/reportes',
  },
  {
    label: 'Cobradores',
    icon: <People />,
    path: '/dashboard/subadmin/usuarios',
  },
  // {
  //   label: 'Finanzas',
  //   icon: <AttachMoney />,
  //   path: '/dashboard/subadmin/finanzas',
  // },
  {
    label: 'Operativa',
    icon: <Receipt />,
    path: '/dashboard/subadmin/operativo',
  },
];

export default function SubadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DashboardDataProvider>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 0, md: 3 },
          height: '100%',
        }}
      >
        {/* Sidebar - Solo Desktop */}
        <Paper
          elevation={1}
          sx={{
            width: 280,
            p: 2,
            height: 'fit-content',
            position: 'sticky',
            top: 0,
            display: { xs: 'none', md: 'block' },
          }}
        >
          <List>
            {subadminMenuItems.map((item, index) => (
              <ListItem
                key={index}
                onClick={() => router.push(item.path)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor:
                    pathname === item.path ? 'primary.main' : 'transparent',
                  color: pathname === item.path ? 'white' : 'inherit',
                  '&:hover': {
                    bgcolor: pathname === item.path ? 'primary.dark' : 'grey.100',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: pathname === item.path ? 'white' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Content */}
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            minHeight: 'calc(100vh - 80px)'
          }}
        >
          {/* QuickActions - Solo Mobile */}
          <QuickActions actions={subadminQuickActions} />

          {children}
        </Box>
      </Box>
    </DashboardDataProvider>
  );
}
