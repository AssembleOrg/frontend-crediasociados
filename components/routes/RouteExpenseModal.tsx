'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import {
  AttachMoney,
  Close,
  LocalGasStation,
  Restaurant,
  Build,
  MoreHoriz,
  Delete,
  Edit,
  Add,
} from '@mui/icons-material';
import type { ExpenseCategory, RouteExpense, CreateRouteExpenseDto } from '@/services/collection-routes.service';
import collectionRoutesService from '@/services/collection-routes.service';

interface RouteExpenseModalProps {
  open: boolean;
  onClose: () => void;
  routeId: string;
  expenses: RouteExpense[];
  isRouteClosed: boolean;
  onExpenseUpdated: () => void;
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: React.ReactElement }[] = [
  { value: 'COMBUSTIBLE', label: 'Combustible', icon: <LocalGasStation /> },
  { value: 'CONSUMO', label: 'Consumo', icon: <Restaurant /> },
  { value: 'REPARACIONES', label: 'Reparaciones', icon: <Build /> },
  { value: 'OTROS', label: 'Otros', icon: <MoreHoriz /> },
];

export function RouteExpenseModal({
  open,
  onClose,
  routeId,
  expenses,
  isRouteClosed,
  onExpenseUpdated,
}: RouteExpenseModalProps) {
  const [category, setCategory] = useState<ExpenseCategory>('COMBUSTIBLE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setCategory('COMBUSTIBLE');
    setAmount('');
    setDescription('');
    setEditingExpenseId(null);
    setError(null);
  };

  const handleEdit = (expense: RouteExpense) => {
    setEditingExpenseId(expense.id);
    setCategory(expense.category);
    setAmount(expense.amount.toString());
    setDescription(expense.description);
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await collectionRoutesService.deleteRouteExpense(expenseId);
      onExpenseUpdated();
      resetForm();
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Error al eliminar el gasto. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('El monto debe ser un número positivo');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const expenseData: CreateRouteExpenseDto = {
        category,
        amount: numericAmount,
        description: description.trim(),
      };

      if (editingExpenseId) {
        // Update existing expense
        await collectionRoutesService.updateRouteExpense(editingExpenseId, expenseData);
      } else {
        // Create new expense
        await collectionRoutesService.createRouteExpense(routeId, expenseData);
      }

      onExpenseUpdated();
      resetForm();
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(
        editingExpenseId
          ? 'Error al actualizar el gasto. Intenta nuevamente.'
          : 'Error al agregar el gasto. Intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const getCategoryIcon = (cat: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.icon || <MoreHoriz />;
  };

  const getCategoryLabel = (cat: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label || cat;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          m: { xs: 1, sm: 2 },
          maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' },
          width: { xs: 'calc(100% - 16px)', sm: 'auto' },
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoney color="primary" />
          <Typography variant="h6" sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
            Gastos de la Ruta
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Total Summary */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            bgcolor: 'error.lighter',
            border: '1px solid',
            borderColor: 'error.light',
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Total de Gastos
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="error.main" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {formatCurrency(totalExpenses)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} registrado{expenses.length !== 1 ? 's' : ''}
          </Typography>
        </Paper>

        {/* Expense Form */}
        {!isRouteClosed && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              {editingExpenseId ? 'Editar Gasto' : 'Agregar Nuevo Gasto'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                label="Categoría"
                disabled={isSubmitting}
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {cat.icon}
                      {cat.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Monto"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                // Only allow numbers and format with thousands separator
                const value = e.target.value.replace(/[^\d]/g, '');
                setAmount(value);
              }}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ 
                mb: 2,
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
              helperText={amount ? `$ ${parseInt(amount).toLocaleString('es-AR')}` : ''}
            />

            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Ej: Combustible para la ruta - YPF Ruta 3"
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={20} /> : editingExpenseId ? <Edit /> : <Add />}
                onClick={handleSubmit}
                disabled={isSubmitting}
                fullWidth
              >
                {isSubmitting ? 'Guardando...' : editingExpenseId ? 'Actualizar Gasto' : 'Agregar Gasto'}
              </Button>
              {editingExpenseId && (
                <Button variant="outlined" onClick={resetForm} disabled={isSubmitting}>
                  Cancelar
                </Button>
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Expenses List */}
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Historial de Gastos
        </Typography>

        {expenses.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No hay gastos registrados para esta ruta
          </Alert>
        ) : (
          <List sx={{ p: 0 }}>
            {expenses.map((expense, index) => (
              <Box key={expense.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    px: 0,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    },
                  }}
                  secondaryAction={
                    !isRouteClosed && (
                      <Box>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleEdit(expense)}
                          disabled={isSubmitting}
                          sx={{ mr: 0.5 }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleDelete(expense.id)}
                          disabled={isSubmitting}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    )
                  }
                >
                  <Box sx={{ mr: 2, color: 'action.active' }}>{getCategoryIcon(expense.category)}</Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {getCategoryLabel(expense.category)}
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="error.main">
                          -{formatCurrency(expense.amount)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                        {expense.description}
                      </Typography>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

