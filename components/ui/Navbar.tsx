'use client';

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Logo } from './Logo';

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const currentUser = useCurrentUser();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleDashboard = () => {
    if (user?.role === 'admin') router.push('/dashboard/admin');
    else if (user?.role === 'subadmin') router.push('/dashboard/subadmin');
    else if (user?.role === 'prestamista') router.push('/dashboard/prestamista');
  };

  return (
    <AppBar
      position='sticky'
      elevation={1}
    >
      <Toolbar sx={{ px: 0 }}>
        <Container
          maxWidth='md'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              width={150}
              height={100}
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
                  Hola, {currentUser?.fullName || 'Usuario'}
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
              <>
                <Button
                  variant='outlined'
                  color='primary'
                  onClick={() => router.push('/consulta')}
                  sx={{ px: 3, py: 1 }}
                >
                  Consultar Préstamo
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleLogin}
                  sx={{ px: 3, py: 1 }}
                >
                  Iniciar Sesión
                </Button>
              </>
            )}
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
