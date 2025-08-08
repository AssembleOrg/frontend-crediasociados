'use client'

import { Box, Typography } from '@mui/material'
import { useAuthStore } from '@/stores/auth'
import { useNavigation } from '@/hooks/useNavigation'
import { useEffect } from 'react'
import type { UserRole } from '@/types/auth'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { navigateToLogin } = useNavigation()

  // MOCKUP - No hacer redirects automáticos, solo mostrar mensaje
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('⚠️ User not authenticated, but this is mockup - showing login message')
    }
  }, [isLoading, isAuthenticated])

  // Mientras carga
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography>Cargando...</Typography>
      </Box>
    )
  }

  // No autenticado - mostrar mensaje pero no redirigir
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Acceso requerido
        </Typography>
        <Typography sx={{ mb: 3 }}>
          Necesitas iniciar sesión para ver esta sección.
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ cursor: 'pointer', color: 'primary.main' }}
          onClick={() => navigateToLogin()}
        >
          Ir a Login
        </Typography>
      </Box>
    )
  }

  // Autenticado pero sin permisos
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          Acceso denegado
        </Typography>
        <Typography>
          Tu rol ({user.role}) no tiene permisos para acceder a esta sección.
        </Typography>
      </Box>
    )
  }

  // Todo correcto - mostrar contenido
  return <>{children}</>
}