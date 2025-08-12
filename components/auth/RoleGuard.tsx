'use client';

import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

/**
 * Simplified RoleGuard - Server-side auth should handle security
 * This is just for UX and preventing unnecessary API calls
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  // No autenticado
  if (!isAuthenticated || !user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography
          variant='h5'
          sx={{ mb: 2 }}
        >
          Acceso requerido
        </Typography>
        <Typography sx={{ mb: 3 }}>
          Necesitas iniciar sesión para ver esta sección.
        </Typography>
        <Button
          variant='contained'
          onClick={() => (window.location.href = '/login')}
        >
          Ir a Login
        </Button>
      </Box>
    );
  }

  // Autenticado pero sin permisos
  if (!allowedRoles.includes(user.role)) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography
          variant='h5'
          color='error'
          sx={{ mb: 2 }}
        >
          Acceso denegado
        </Typography>
        <Typography>
          Tu rol ({user.role}) no tiene permisos para acceder a esta sección.
        </Typography>
      </Box>
    );
  }

  // Todo correcto - mostrar contenido
  return <>{children}</>;
}
