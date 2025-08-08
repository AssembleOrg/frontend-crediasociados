'use client';

import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Logo } from './Logo';

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleDashboard = () => {
    const route = useAuthStore.getState().getDashboardRoute();
    router.push(route);
  };

  return (
    <AppBar
      position='sticky'
      elevation={1}
    >
      <Toolbar sx={{ px: 0 }}>
        <Container 
          maxWidth="lg" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between' 
          }}
        >
          <Box
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => router.push('/')}
          >
            <Logo
              width={140}
              height={70}
              mobileWidth={120}
              mobileHeight={60}
              priority
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {isAuthenticated && user ? (
              <>
                <Typography
                  variant='body2'
                  sx={{ color: 'text.secondary' }}
                >
                  Hola, {user.name}
                </Typography>
                <Button
                  variant='outlined'
                  color='primary'
                  onClick={handleDashboard}
                >
                  Mi Panel
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Button
                variant='contained'
                color='primary'
                onClick={handleLogin}
                sx={{ px: 3, py: 1 }}
              >
                Iniciar Sesión
              </Button>
            )}
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
