'use client';

import { useState, useEffect } from 'react';
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
  // Fix hydration: only render auth-dependent content after client mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
              width={120}
              height={80}
              priority
            />
          </Box>

          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
            {!mounted ? (
              <>
                <Button
                  variant='outlined'
                  color='primary'
                  onClick={() => router.push('/consulta')}
                  sx={{ px: { xs: 1.5, sm: 3 }, py: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
                >
                  Consultar
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleLogin}
                  sx={{ px: { xs: 1.5, sm: 3 }, py: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
                >
                  Ingresar
                </Button>
              </>
            ) : isAuthenticated && user ? (
              <>
                <Typography
                  variant='body2'
                  sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
                >
                  Hola, {currentUser?.fullName || 'Usuario'}
                </Typography>
                <Button
                  variant='outlined'
                  color='primary'
                  onClick={handleDashboard}
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
                >
                  Mi Panel
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleLogout}
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
                >
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant='outlined'
                  color='primary'
                  onClick={() => router.push('/consulta')}
                  sx={{ px: { xs: 1.5, sm: 3 }, py: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
                >
                  Consultar
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleLogin}
                  sx={{ px: { xs: 1.5, sm: 3 }, py: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
                >
                  Ingresar
                </Button>
              </>
            )}
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
