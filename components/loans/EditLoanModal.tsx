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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
} from '@mui/material';
import { useLoans } from '@/hooks/useLoans';
import { useClients } from '@/hooks/useClients';
import type { Loan } from '@/types/auth';
import {
  formatCurrency,
  translateLoanStatus,
  getLoanStatusColor,
} from '@/lib/loan-utils';

interface EditLoanModalProps {
  open: boolean;
  onClose: () => void;
  loan: Loan | null;
}

export function EditLoanModal({ open, onClose, loan }: EditLoanModalProps) {
  const { isLoading, error } = useLoans();
  // TODO: Implement updateLoan in useLoans hook
  // const { updateLoan } = useLoans();
  const { clients } = useClients();

  const [formData, setFormData] = useState({
    description: '',
    baseInterestRate: '',
    penaltyInterestRate: '',
    paymentFrequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    paymentDay: 'FRIDAY' as
      | 'MONDAY'
      | 'TUESDAY'
      | 'WEDNESDAY'
      | 'THURSDAY'
      | 'FRIDAY'
      | 'SATURDAY'
      | 'SUNDAY',
    status: 'PENDING' as
      | 'PENDING'
      | 'APPROVED'
      | 'REJECTED'
      | 'ACTIVE'
      | 'COMPLETED'
      | 'DEFAULTED',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loan) {
      setFormData({
        description: loan.description || '',
        baseInterestRate: ((loan.baseInterestRate || 0) * 100).toString(), // Convertir de decimal a porcentaje
        penaltyInterestRate: ((loan.penaltyInterestRate || 0) * 100).toString(),
        paymentFrequency: loan.paymentFrequency || 'WEEKLY',
        paymentDay: loan.paymentDay || 'FRIDAY',
        status: loan.status || 'PENDING',
      });
    }
  }, [loan]);

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

  const handleSelectChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (
      formData.baseInterestRate &&
      parseFloat(formData.baseInterestRate) < 0
    ) {
      errors.baseInterestRate = 'La tasa de interés base debe ser 0 o mayor';
    }

    if (
      formData.penaltyInterestRate &&
      parseFloat(formData.penaltyInterestRate) < 0
    ) {
      errors.penaltyInterestRate =
        'La tasa de interés penalización debe ser 0 o mayor';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loan || !validateForm()) {
      return;
    }

    // Convertir a formato que espera el backend (CreateLoanDto partial)
    const updateData = {
      description: formData.description || undefined,
      baseInterestRate: formData.baseInterestRate
        ? parseFloat(formData.baseInterestRate) / 100
        : undefined, // Convertir a decimal
      penaltyInterestRate: formData.penaltyInterestRate
        ? parseFloat(formData.penaltyInterestRate) / 100
        : undefined,
      paymentFrequency: formData.paymentFrequency,
      paymentDay: formData.paymentDay,
      // Note: status no está en CreateLoanDto, lo manejamos por console.log por ahora
    };

    console.log('=== EDITAR PRÉSTAMO ===');
    console.log('ID:', loan.id);
    console.log(
      'Status actual:',
      loan.status,
      '→ Nuevo status:',
      formData.status
    );
    console.log('Datos a actualizar:', updateData);
    console.log('======================');

    try {
      // TODO: Implement updateLoan functionality
      // await updateLoan(loan.id, updateData);
      console.log('Update loan functionality not implemented yet');
      handleClose();
    } catch (error) {
      console.error('Error al actualizar préstamo:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      description: '',
      baseInterestRate: '',
      penaltyInterestRate: '',
      paymentFrequency: 'WEEKLY',
      paymentDay: 'FRIDAY',
      status: 'PENDING',
    });
    setFormErrors({});
    onClose();
  };

  if (!loan) return null;

  const client = clients.find((c) => c.id === loan.clientId);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
    >
      <DialogTitle sx={{ pt: 2.5, px: 3, pb: 2 }}>
        <Typography
          variant='h6'
          component='div'
        >
          Editar Préstamo
        </Typography>
        <Typography
          variant='body2'
          color='text.secondary'
        >
          {loan.loanTrack}
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

          {/* Información del Préstamo (Solo lectura) */}
          <Alert
            severity='info'
            sx={{ mb: 3 }}
          >
            <Typography
              variant='subtitle2'
              gutterBottom
            >
              Información del Préstamo
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 1,
              }}
            >
              <Typography variant='body2'>
                <strong>Cliente:</strong> {client?.fullName || 'No encontrado'}
              </Typography>
              <Typography variant='body2'>
                <strong>Monto:</strong> {formatCurrency(loan.amount)}
              </Typography>
              <Typography variant='body2'>
                <strong>Total Cuotas:</strong> {loan.totalPayments}
              </Typography>
              <Typography variant='body2'>
                <strong>Creado:</strong> {loan.createdAt.toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={translateLoanStatus(loan.status)}
                color={getLoanStatusColor(loan.status)}
                size='small'
              />
            </Box>
          </Alert>

          <Box sx={{ display: 'grid', gap: 3, pt: 1 }}>
            {/* Estado del Préstamo */}
            <FormControl fullWidth>
              <InputLabel>Estado del Préstamo</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleSelectChange('status', e.target.value)}
                label='Estado del Préstamo'
              >
                <MenuItem value='PENDING'>Pendiente</MenuItem>
                <MenuItem value='APPROVED'>Aprobado</MenuItem>
                <MenuItem value='REJECTED'>Rechazado</MenuItem>
                <MenuItem value='ACTIVE'>Activo</MenuItem>
                <MenuItem value='COMPLETED'>Completado</MenuItem>
                <MenuItem value='DEFAULTED'>En Mora</MenuItem>
              </Select>
            </FormControl>

            {/* Tasas de Interés */}
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <TextField
                label='Tasa de Interés Base'
                type='number'
                value={formData.baseInterestRate}
                onChange={handleInputChange('baseInterestRate')}
                error={!!formErrors.baseInterestRate}
                helperText={
                  formErrors.baseInterestRate ||
                  'Porcentaje de interés aplicado al monto total'
                }
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>%</InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Frecuencia y Día de Pago */}
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <FormControl fullWidth>
                <InputLabel>Frecuencia de Pago</InputLabel>
                <Select
                  value={formData.paymentFrequency}
                  onChange={(e) =>
                    handleSelectChange('paymentFrequency', e.target.value)
                  }
                  label='Frecuencia de Pago'
                >
                  <MenuItem value='DAILY'>Diario</MenuItem>
                  <MenuItem value='WEEKLY'>Semanal</MenuItem>
                  <MenuItem value='BIWEEKLY'>Quincenal</MenuItem>
                  <MenuItem value='MONTHLY'>Mensual</MenuItem>
                </Select>
              </FormControl>
              
              {formData.paymentFrequency === 'DAILY' ? (
                <TextField
                  label='Día de Pago'
                  value='Todos los días'
                  disabled
                  fullWidth
                />
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Día de Pago</InputLabel>
                  <Select
                    value={formData.paymentDay}
                    onChange={(e) =>
                      handleSelectChange('paymentDay', e.target.value)
                    }
                    label='Día de Pago'
                  >
                    <MenuItem value='MONDAY'>Lunes</MenuItem>
                    <MenuItem value='TUESDAY'>Martes</MenuItem>
                    <MenuItem value='WEDNESDAY'>Miércoles</MenuItem>
                    <MenuItem value='THURSDAY'>Jueves</MenuItem>
                    <MenuItem value='FRIDAY'>Viernes</MenuItem>
                    <MenuItem value='SATURDAY'>Sábado</MenuItem>
                    <MenuItem value='SUNDAY'>Domingo</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>

            {/* Descripción */}
            <TextField
              label='Descripción'
              value={formData.description}
              onChange={handleInputChange('description')}
              multiline
              rows={3}
              fullWidth
              helperText='Descripción del préstamo'
            />
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
