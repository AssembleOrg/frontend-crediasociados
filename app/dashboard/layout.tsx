'use client';

import { Box } from '@mui/material';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { SplashScreen } from '@/components/ui/SplashScreen';
import DolarBlueTicker from '@/components/ui/DolarBlueTicker';
import { Footer } from '@/components/ui/Footer';
import { VersionNotification } from '@/components/ui/VersionNotification';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import AuthProvider from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { useNavBadges } from '@/hooks/useNavBadges';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();
  const badges = useNavBadges(user?.role);

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}
    >
      <DashboardNav />
      <DolarBlueTicker />
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: 'background.default',
          p: { xs: 2, sm: 3 },
          pb: { xs: '88px', md: 3 },
        }}
      >
        {children}
      </Box>

      {/* Footer only on desktop — bottom nav replaces it on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Footer />
      </Box>

      <VersionNotification />
      <SplashScreen visible={isLoading} />

      {/* Mobile bottom navigation with glassmorphism + live badges */}
      <MobileBottomNav badges={badges} />
    </Box>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
