'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  IconButton,
  CircularProgress
} from '@mui/material'
import { Add, Delete, Receipt } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import { dailyClosuresService } from '@/services/daily-closures.service'
import type { Expense } from '@/types/daily-closures'
import { ExpenseCategory } from '@/types/daily-closures'

interface CreateClosureModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  closureDate?: string
}

const EXPENSE_CATEGORIES = [
  ExpenseCategory.COMBUSTIBLE,
  ExpenseCategory.CONSUMO,
  ExpenseCategory.REPARACIONES,
  ExpenseCategory.OTROS,
]

export const CreateClosureModal: React.FC<CreateClosureModalProps> = ({
  open,
  onClose,
  onSuccess,
  closureDate: initialDate
}) => {
  const [closureDate, setClosureDate] = useState(initialDate || new Date().toISOString().split('T')[0])
  const [totalCollected, setTotalCollected] = useState('')
  const [expenses, setExpenses] = useState<Omit<Expense, 'id'>[]>([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setClosureDate(initialDate || new Date().toISOString().split('T')[0])
      setTotalCollected('')
      setExpenses([])
      setNotes('')
      setError(null)
    }
  }, [open, initialDate])

  const addExpense = () => {
    setExpenses([
      ...expenses,
      { category: ExpenseCategory.OTROS, amount: 0, description: '' } as Omit<Expense, 'id'>
    ])
  }

  const updateExpense = (index: number, field: keyof Expense, value: string | number | ExpenseCategory) => {
    const updated = [...expenses]
    updated[index] = { ...updated[index], [field]: value }
    setExpenses(updated)
  }

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index))
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const netAmount = (parseFloat(unformatAmount(totalCollected)) || 0) - totalExpenses

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const collected = parseFloat(unformatAmount(totalCollected)) || 0
      if (collected < 0) {
        throw new Error('El monto cobrado no puede ser negativo')
      }

      await dailyClosuresService.createClosure({
        closureDate,
        totalCollected: collected,
        expenses: expenses.map(e => ({
          category: e.category,
          amount: e.amount,
          description: e.description
        })),
        notes
      })

      onSuccess?.()
      onClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear cierre del día'
      setError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
        color: 'white'
      }}>
        <Receipt />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Crear Cierre del Día
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, maxHeight: '70vh', overflow: 'auto' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Date Input */}
        <TextField
          type="date"
          label="Fecha del Cierre"
          value={closureDate}
          onChange={(e) => setClosureDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          sx={{ mb: 3 }}
        />

        {/* Total Collected */}
        <TextField
          label="Total Cobrado"
          type="text"
          value={formatAmount(totalCollected)}
          onChange={(e) => setTotalCollected(unformatAmount(e.target.value))}
          InputLabelProps={{ shrink: true }}
          fullWidth
          sx={{ mb: 3 }}
          placeholder="$0"
        />

        {/* Expenses Section */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Gastos del Día
        </Typography>

        {expenses.map((expense, index) => (
          <Card key={index} sx={{ mb: 2, bgcolor: 'grey.50' }}>
            <CardContent sx={{ pb: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={expense.category}
                    onChange={(e) => updateExpense(index, 'category', e.target.value)}
                    label="Categoría"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="text"
                  label="Monto"
                  value={formatAmount(expense.amount.toString())}
                  onChange={(e) => updateExpense(index, 'amount', parseFloat(unformatAmount(e.target.value)) || 0)}
                  size="small"
                  placeholder="$0"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <TextField
                  label="Descripción"
                  value={expense.description}
                  onChange={(e) => updateExpense(index, 'description', e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="Ej: Nafta, almuerzo..."
                />
                <IconButton
                  size="small"
                  onClick={() => removeExpense(index)}
                  sx={{ ml: 1 }}
                >
                  <Delete />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}

        <Button
          startIcon={<Add />}
          onClick={addExpense}
          variant="outlined"
          fullWidth
          sx={{ mb: 3 }}
        >
          Agregar Gasto
        </Button>

        {/* Totals Summary */}
        <Box sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 1, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Cobrado:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ${formatAmount(totalCollected || '0')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Gastos:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
              -${formatAmount(totalExpenses.toString())}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Neto:</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: netAmount >= 0 ? 'success.main' : 'error.main' }}>
              ${formatAmount(netAmount.toString())}
            </Typography>
          </Box>
        </Box>

        {/* Notes */}
        <TextField
          label="Notas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={3}
          fullWidth
          placeholder="Observaciones del día..."
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !totalCollected}
          endIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
        >
          {isSubmitting ? 'Guardando...' : 'Crear Cierre'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateClosureModal
