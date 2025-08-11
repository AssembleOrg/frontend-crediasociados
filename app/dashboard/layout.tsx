'use client';

import { Box } from '@mui/material';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['admin', 'prestamista']}>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <DashboardNav />
        <Box
          component='main'
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </RoleGuard>
  );
}
