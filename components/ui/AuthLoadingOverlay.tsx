'use client';

import { 
  CircularProgress, 
  Typography, 
  Backdrop,
  alpha 
} from '@mui/material';

interface AuthLoadingOverlayProps {
  open: boolean;
  message?: string;
}

/**
 * Global loading overlay for auth operations
 * Prevents UI flashes during login/logout/token refresh
 */
export function AuthLoadingOverlay({ 
  open, 
  message = 'Procesando...' 
}: AuthLoadingOverlayProps) {
  return (
    <Backdrop
      sx={{
        color: 'primary.main',
        zIndex: (theme) => theme.zIndex.modal + 1,
        backgroundColor: alpha('#ffffff', 0.9),
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
      open={open}
    >
      <CircularProgress 
        color="primary" 
        size={48}
        thickness={4}
      />
      <Typography 
        variant="body1" 
        color="primary"
        fontWeight={500}
      >
        {message}
      </Typography>
    </Backdrop>
  );
}