'use client';

import { Box } from '@mui/material';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { AuthLoadingOverlay } from '@/components/ui/AuthLoadingOverlay';
import DolarBlueTicker from '@/components/ui/DolarBlueTicker';
import { Footer } from '@/components/ui/Footer';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <DashboardNav />
      <DolarBlueTicker />
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
      <Footer />
      
      {/* Global auth loading overlay */}
      <AuthLoadingOverlay 
        open={isLoading} 
        message="Procesando autenticación..."
      />
    </Box>
  );
}
