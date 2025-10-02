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
  CircularProgress,
} from '@mui/material';
import { AccountCircle, ExitToApp } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import { RoleUtils, type UserRole } from '@/lib/role-utils';

export function DashboardNav() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    handleClose();
    
    try {
      await logout();
      // No necesitamos router.push() porque logout() ya maneja el redirect
    } catch (error) {
      console.error('Error during logout:', error);
      // En caso de error, forzar redirect
      router.replace('/login');
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const handleProfile = () => {
    // TODO: Implementar página de perfil
    handleClose();
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
                color: RoleUtils.getRoleColor((user?.role || '') as UserRole),
                fontWeight: 600,
              }}
            >
              {RoleUtils.getRoleDisplayName((user?.role || '') as UserRole)}
            </Typography>
          </Box>

          <Box
            sx={{ textAlign: 'right', display: { xs: 'block', sm: 'none' } }}
          >
            <Typography
              variant='body2'
              sx={{ fontWeight: 500 }}
            >
              Hola, {user?.fullName?.split(' ')[0]}
            </Typography>
            <Typography
              variant='caption'
              sx={{
                color: RoleUtils.getRoleColor((user?.role || '') as UserRole),
                fontWeight: 600,
              }}
            >
              {RoleUtils.getRoleDisplayName((user?.role || '') as UserRole)}
            </Typography>
          </Box>

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
            <MenuItem onClick={handleLogout} disabled={isLogoutLoading}>
              {isLogoutLoading ? (
                <CircularProgress size={16} sx={{ mr: 1 }} />
              ) : (
                <ExitToApp sx={{ mr: 1 }} />
              )}
              {isLogoutLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
