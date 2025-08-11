'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuthStore } from '@/stores/auth';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    const success = await login(formData.email, formData.password);

    if (success) {
      const dashboardRoute = useAuthStore.getState().getDashboardRoute();
      router.replace(dashboardRoute);
    } else {
      setError('Credenciales inválidas. Verifica tu email y contraseña.');
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

  const demoAccounts = [
    { role: 'Admin', email: 'admin@prestamito.com', password: 'password' },
    {
      role: 'Prestamista',
      email: 'prestamista@prestamito.com',
      password: 'password',
    },
    // { role: 'Cliente', email: 'cliente@prestamito.com', password: 'password' },
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setFormData({ email, password });
    setError('');
  };

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

          {/* Demo Accounts */}
          <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography
              variant='subtitle2'
              sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}
            >
              Cuentas de Demostración
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {demoAccounts.map((account, index) => (
                <Button
                  key={index}
                  variant='outlined'
                  size='small'
                  onClick={() =>
                    fillDemoAccount(account.email, account.password)
                  }
                  sx={{
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    fontSize: '0.9rem',
                  }}
                >
                  <strong>{account.role}:</strong>&nbsp;{account.email}
                </Button>
              ))}
            </Box>
            <Typography
              variant='caption'
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 2,
                color: 'text.secondary',
              }}
            >
              Contraseña para todas: <strong>password</strong>
            </Typography>
          </Box>

          {/* Back to Home */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant='text'
              onClick={() => router.push('/')}
              sx={{ textTransform: 'none' }}
            >
              ← Volver al inicio
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
