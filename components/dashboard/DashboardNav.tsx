'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
} from '@mui/material';
import { AccountCircle, ExitToApp } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';

export function DashboardNav() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    handleClose();
  };

  const handleProfile = () => {
    // TODO: Implementar página de perfil
    handleClose();
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrador',
      subadmin: 'Sub-Administrador',
      prestamista: 'Manager',
      cliente: 'Cliente',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      admin: '#d32f2f',
      subadmin: '#f57c00',
      prestamista: '#1976d2',
      cliente: '#388e3c',
    };
    return roleColors[role as keyof typeof roleColors] || '#666';
  };

  return (
    <AppBar
      position='sticky'
      elevation={1}
    >
      <Toolbar>
        <Box
          sx={{
            flexGrow: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={() => router.push('/')}
        >
          <Logo
            width={140}
            height={80}
            priority
          />
        </Box>

        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}
        >
          <Box
            sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}
          >
            <Typography
              variant='body2'
              sx={{ fontWeight: 500 }}
            >
              {user?.fullName}
            </Typography>
            <Typography
              variant='caption'
              sx={{
                color: getRoleColor(user?.role || ''),
                fontWeight: 600,
              }}
            >
              {getRoleDisplayName(user?.role || '')}
            </Typography>
          </Box>

          <Typography
            variant='body2'
            sx={{
              fontWeight: 500,
              display: { xs: 'block', sm: 'none' },
            }}
          >
            Hola, {user?.fullName?.split(' ')[0]}
          </Typography>

          <IconButton
            size='medium'
            aria-label='account of current user'
            aria-controls='menu-appbar'
            aria-haspopup='true'
            onClick={handleMenu}
            color='primary'
            sx={{
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              },
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 },
              }}
            >
              {user?.fullName?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            id='menu-appbar'
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleProfile}>
              <AccountCircle sx={{ mr: 1 }} />
              Mi Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
