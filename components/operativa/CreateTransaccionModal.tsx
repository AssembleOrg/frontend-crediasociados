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
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Divider
} from '@mui/material'
import { Add, TrendingUp, TrendingDown, AttachMoney, CalendarToday } from '@mui/icons-material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import type { TransaccionTipo, IngresoTipo, EgresoTipo } from '@/types/operativa'
import { INGRESO_TIPOS, EGRESO_TIPOS } from '@/types/operativa'

interface CreateTransaccionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TransaccionFormData) => Promise<boolean>
}

export interface TransaccionFormData {
  tipo: TransaccionTipo
  subTipo: IngresoTipo | EgresoTipo
  amount: number
  descripcion: string
  fecha: Date
  receiptUrl?: string
}

export const CreateTransaccionModal: React.FC<CreateTransaccionModalProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const [tipo, setTipo] = useState<TransaccionTipo>('egreso')
  const [subTipo, setSubTipo] = useState<IngresoTipo | EgresoTipo>('otros')
  const [amount, setAmount] = useState<string>('')
  const [descripcion, setDescripcion] = useState<string>('')
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setTipo('egreso')
      setSubTipo('otros')
      setAmount('')
      setDescripcion('')
      setFecha(new Date().toISOString().split('T')[0])
      setErrors({})
    }
  }, [open])

  // Reset subTipo when tipo changes
  useEffect(() => {
    if (tipo === 'ingreso') {
      setSubTipo('pago_cuota')
    } else {
      setSubTipo('otros')
    }
  }, [tipo])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!subTipo) {
      newErrors.subTipo = 'Categoría es requerida'
    }

    const amountValue = parseFloat(unformatAmount(amount))
    if (isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = 'Monto debe ser mayor a 0'
    }

    if (descripcion.trim().length < 5) {
      newErrors.descripcion = 'Descripción debe tener al menos 5 caracteres'
    }

    const selectedDate = new Date(fecha)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    if (selectedDate > today) {
      newErrors.fecha = 'La fecha no puede ser futura'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)

    const formData: TransaccionFormData = {
      tipo,
      subTipo,
      amount: parseFloat(unformatAmount(amount)),
      descripcion: descripcion.trim(),
      fecha: new Date(fecha)
    }

    const success = await onSubmit(formData)

    setIsSubmitting(false)

    if (success) {
      onClose()
    }
  }

  const handleAmountChange = (value: string) => {
    setAmount(formatAmount(value))
  }

  const getSubTiposOptions = () => {
    if (tipo === 'ingreso') {
      return Object.values(INGRESO_TIPOS)
    } else {
      return Object.values(EGRESO_TIPOS)
    }
  }

  const subTipos = getSubTiposOptions()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          m: { xs: 1, sm: 2 },
          mt: { xs: 2, sm: 3 }
        }
      }}
    >
      <DialogTitle sx={{ pt: 2.5, px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Add color="primary" />
          <Typography variant="h6">Registrar Transacción</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Tipo Toggle */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Tipo de Transacción
          </Typography>
          <ToggleButtonGroup
            value={tipo}
            exclusive
            onChange={(_, newTipo) => {
              if (newTipo) setTipo(newTipo)
            }}
            fullWidth
            color="primary"
          >
            <ToggleButton value="ingreso">
              <TrendingUp sx={{ mr: 1 }} />
              Ingreso
            </ToggleButton>
            <ToggleButton value="egreso">
              <TrendingDown sx={{ mr: 1 }} />
              Egreso
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Categoría */}
        <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.subTipo}>
          <InputLabel>Categoría</InputLabel>
          <Select
            value={subTipo}
            onChange={(e) => setSubTipo(e.target.value as IngresoTipo | EgresoTipo)}
            label="Categoría"
          >
            {subTipos.map((meta) => (
              <MenuItem key={meta.value} value={meta.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: meta.color
                    }}
                  />
                  <Typography>{meta.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
          {errors.subTipo && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {errors.subTipo}
            </Typography>
          )}
        </FormControl>

        {/* Amount & Date */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <TextField
            label="Monto"
            type="text"
            value={formatAmount(amount || '')}
            onChange={(e) => {
              const unformattedValue = unformatAmount(e.target.value)
              handleAmountChange(unformattedValue)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney />
                </InputAdornment>
              )
            }}
            error={!!errors.amount}
            helperText={errors.amount}
            fullWidth
          />
          <TextField
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday />
                </InputAdornment>
              )
            }}
            InputLabelProps={{
              shrink: true
            }}
            error={!!errors.fecha}
            helperText={errors.fecha}
            fullWidth
          />
        </Box>

        {/* Descripción */}
        <TextField
          label="Descripción"
          multiline
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          fullWidth
          error={!!errors.descripcion}
          helperText={errors.descripcion || 'Mínimo 5 caracteres'}
          placeholder="Describe el motivo de esta transacción..."
          sx={{ mb: 2 }}
        />

        {/* Info Box */}
        <Box
          sx={{
            p: 2,
            bgcolor: tipo === 'ingreso' ? '#e8f5e9' : '#ffebee',
            borderRadius: 2,
            border: 1,
            borderColor: tipo === 'ingreso' ? 'success.main' : 'error.main'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {tipo === 'ingreso'
              ? '✅ Los ingresos aumentan tu capital disponible'
              : '⚠️ Los egresos reducen tu capital disponible'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          startIcon={<Add />}
          color={tipo === 'ingreso' ? 'success' : 'error'}
        >
          {isSubmitting ? 'Guardando...' : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateTransaccionModal
