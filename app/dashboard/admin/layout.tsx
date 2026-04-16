'use client';

import { useEffect } from 'react';
import {
  Box,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material';
import { Dashboard, People, Analytics } from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useUsers } from '@/hooks/useUsers';
import { iosColors } from '@/lib/theme';

const adminMenuItems = [
  { label: 'Dashboard',  icon: <Dashboard />, path: '/dashboard/admin' },
  { label: 'Reportes',   icon: <Analytics />, path: '/dashboard/admin/reportes' },
  { label: 'Asociados',  icon: <People />,    path: '/dashboard/admin/subadmins' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const { fetchUsers } = useUsers();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
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
          {adminMenuItems.map((item) => {
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
  );
}
