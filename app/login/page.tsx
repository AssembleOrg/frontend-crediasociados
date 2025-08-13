'use client';

import { useState } from 'react';
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
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import { AuthLoadingOverlay } from '@/components/ui/AuthLoadingOverlay';

export default function LoginPage() {
  const { login, isLoading, error, navigateToDashboard, clearError } =
    useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!formData.email || !formData.password) {
      return;
    }

    const success = await login(formData);

    if (success) {
      await navigateToDashboard();
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

  // Demo accounts removed - use real backend credentials

  return (
    <Container maxWidth='sm'>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 3,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Logo
                width={400}
                height={250}
                mobileWidth={280}
                mobileHeight={175}
                priority
              />
            </Box>
            <Typography
              variant='h6'
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
              }}
            >
              Inicia Sesión
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
              label='Contraseña'
              name='password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
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
              disabled={isLoading}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                mb: 3,
              }}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Box>

          {/* Back to Home */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant='text'
              onClick={() => (window.location.href = '/')}
              sx={{ textTransform: 'none' }}
            >
              ← Volver al inicio
            </Button>
          </Box>
        </Paper>
      </Box>
      
      {/* Auth loading overlay */}
      <AuthLoadingOverlay 
        open={isLoading} 
        message="Iniciando sesión..."
      />
    </Container>
  );
}
