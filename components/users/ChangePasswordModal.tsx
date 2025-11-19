'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff, LockReset } from '@mui/icons-material';
import type { User } from '@/types/auth';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onChangePassword: (userId: string, newPassword: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
}

export function ChangePasswordModal({
  open,
  onClose,
  user,
  onChangePassword,
  isLoading = false,
  error = null,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setValidationError(null);
    }
  }, [open]);

  const validateForm = (): boolean => {
    // Validación de contraseña mínima
    if (!newPassword) {
      setValidationError('La contraseña es requerida');
      return false;
    }

    if (newPassword.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setValidationError('No se ha seleccionado un usuario');
      return;
    }

    if (!validateForm()) {
      return;
    }

    const success = await onChangePassword(user.id, newPassword);

    if (success) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pt: 2.5, px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockReset />
          Cambiar Contraseña
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Cambiar contraseña para: <strong>{user.fullName}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: <strong>{user.email}</strong>
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {validationError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {validationError}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nueva Contraseña"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setValidationError(null);
            }}
            disabled={isLoading}
            required
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="Mínimo 6 caracteres"
          />

          <TextField
            fullWidth
            label="Confirmar Nueva Contraseña"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setValidationError(null);
            }}
            disabled={isLoading}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="Debe coincidir con la nueva contraseña"
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            ✅ Los subadmins y admins pueden cambiar contraseñas libremente
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

