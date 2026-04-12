'use client';

import { useState, useRef } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import { SplashScreen } from '@/components/ui/SplashScreen';

export default function LoginPage() {
  const { login, isLoading, error, navigateToDashboard, clearError } =
    useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const submitLock = useRef(false);

  const isBusy = isLoading || isRedirecting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submit
    if (submitLock.current) return;
    submitLock.current = true;

    clearError();

    if (!formData.email || !formData.password) {
      submitLock.current = false;
      return;
    }

    const success = await login(formData);

    if (success) {
      setIsRedirecting(true);
      navigateToDashboard();
      // Keep locked - page will unmount on navigation
    } else {
      submitLock.current = false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <>
    <SplashScreen visible={isRedirecting} />
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 4 },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 440,
          borderRadius: 3,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Logo
              width={300}
              height={180}
              mobileWidth={220}
              mobileHeight={140}
              priority
            />
          </Box>
          <Typography
            variant='h6'
            sx={{
              color: 'text.secondary',
              fontWeight: 400,
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            Inicia Sesion
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert
            severity='error'
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <Box
          component='form'
          onSubmit={handleSubmit}
        >
          <TextField
            fullWidth
            label='Email'
            name='email'
            type='email'
            value={formData.email}
            onChange={handleChange}
            disabled={isBusy}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Email color='action' />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
            required
          />

          <TextField
            fullWidth
            label='Contrasena'
            name='password'
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            disabled={isBusy}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Lock color='action' />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton
                    aria-label='toggle password visibility'
                    onClick={togglePasswordVisibility}
                    edge='end'
                    disabled={isBusy}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 4 }}
            required
          />

          <Button
            type='submit'
            fullWidth
            variant='contained'
            size='large'
            disabled={isBusy}
            sx={{
              py: 1.5,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              mb: 3,
            }}
          >
            {isBusy ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={20} color="inherit" />
                {isRedirecting ? 'Redirigiendo...' : 'Iniciando sesion...'}
              </Box>
            ) : (
              'Iniciar Sesion'
            )}
          </Button>
        </Box>

        {/* Back to Home */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            variant='text'
            onClick={() => (window.location.href = '/')}
            sx={{ textTransform: 'none' }}
            disabled={isBusy}
          >
            Volver al inicio
          </Button>
        </Box>
      </Paper>
    </Box>
    </>
  );
}
