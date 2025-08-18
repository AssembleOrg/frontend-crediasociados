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
  Typography,
  Alert,
} from '@mui/material';
import { useUsers } from '@/hooks/useUsers';
import type { User, UserRole } from '@/types/auth';
import { getRoleDisplayName } from '@/types/transforms';

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}


export function EditUserModal({ open, onClose, user }: EditUserModalProps) {
  const { updateUser, isLoading, error } = useUsers();


  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dni: '',
    cuit: '',
    role: 'subadmin' as UserRole,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        password: '',
        phone: user.phone || '',
        dni: user.dni || '',
        cuit: user.cuit || '',
        role: user.role,
      });
    }
  }, [user]);

  const handleInputChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));

      if (formErrors[field]) {
        setFormErrors((prev) => ({
          ...prev,
          [field]: '',
        }));
      }
    };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'El nombre completo es requerido';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no tiene un formato válido';
    }

    if (formData.password && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.dni && !/^\d+$/.test(formData.dni)) {
      errors.dni = 'El DNI debe contener solo números';
    }

    if (formData.cuit && !/^\d{11}$/.test(formData.cuit.replace(/-/g, ''))) {
      errors.cuit = 'El CUIT debe tener 11 dígitos';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !validateForm()) {
      return;
    }

    const updateData = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || undefined,
      dni: formData.dni || undefined,
      cuit: formData.cuit || undefined,
      role: formData.role,
      ...(formData.password && { password: formData.password }),
    };

    const result = await updateUser(user.id, updateData);

    if (result) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      dni: '',
      cuit: '',
      role: 'subadmin',
    });
    setFormErrors({});
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
    >
      <DialogTitle>
        <Typography
          variant='h6'
          component='div'
        >
          Editar {getRoleDisplayName(user.role)}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert
              severity='error'
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField
              label='Nombre Completo'
              value={formData.fullName}
              onChange={handleInputChange('fullName')}
              error={!!formErrors.fullName}
              helperText={formErrors.fullName}
              required
              fullWidth
            />

            <TextField
              label='Email'
              type='email'
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
              fullWidth
            />

            <TextField
              label='Nueva Contraseña (opcional)'
              type='password'
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!formErrors.password}
              helperText={
                formErrors.password ||
                'Deja en blanco para mantener la contraseña actual'
              }
              fullWidth
            />

            <TextField
              label='Rol'
              value={getRoleDisplayName(formData.role)}
              disabled
              fullWidth
              helperText='Los roles son asignados automáticamente según la jerarquía'
            />

            <TextField
              label='Teléfono'
              value={formData.phone}
              onChange={handleInputChange('phone')}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              fullWidth
            />

            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <TextField
                label='DNI'
                value={formData.dni}
                onChange={handleInputChange('dni')}
                error={!!formErrors.dni}
                helperText={
                  formErrors.dni || 'Campo no disponible en esta versión'
                }
                disabled
                fullWidth
              />

              <TextField
                label='CUIT'
                value={formData.cuit}
                onChange={handleInputChange('cuit')}
                error={!!formErrors.cuit}
                helperText={
                  formErrors.cuit || 'Campo no disponible en esta versión'
                }
                disabled
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
