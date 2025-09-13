'use client'

import { useState, useEffect } from 'react'
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
  Divider
} from '@mui/material'
import { formatAmount, unformatAmount } from '@/lib/formatters'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

interface EditPaymentModalProps {
  open: boolean
  onClose: () => void
  selectedPayment: SubLoanWithClientInfo | null
  onSave: (paymentData: { id: string; paidAmount: number; status: string; notes: string }) => void
}

export default function EditPaymentModal({
  open,
  onClose,
  selectedPayment,
  onSave
}: EditPaymentModalProps) {
  const [editAmount, setEditAmount] = useState('')
  const [editStatus, setEditStatus] = useState<string>('PENDING')
  const [editNotes, setEditNotes] = useState('')

  // Update state when selectedPayment changes
  useEffect(() => {
    if (selectedPayment) {
      setEditAmount(selectedPayment.paidAmount?.toString() || '')
      setEditStatus(selectedPayment.status)
      setEditNotes('') // TODO: backend no tiene notas aún
    }
  }, [selectedPayment])

  const handleSave = () => {
    if (!selectedPayment) return

    const paymentData = {
      id: selectedPayment.id,
      paidAmount: parseFloat(unformatAmount(editAmount)) || 0,
      status: editStatus,
      notes: editNotes
    }

    onSave(paymentData)
    handleClose()
  }

  const handleClose = () => {
    setEditAmount('')
    setEditStatus('PENDING')
    setEditNotes('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          width: { xs: '95vw', sm: '600px' },
          maxWidth: 'none',
          m: { xs: 1, sm: 3 },
          borderRadius: { xs: 2, sm: 3 },
        },
      }}
    >
      <DialogTitle>
        Editar Cobro - {selectedPayment?.clientName || `Cliente #${selectedPayment?.loanId}`}
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'grid', gap: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 } }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Préstamo: {selectedPayment?.loanId} - Cuota #{selectedPayment?.paymentNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monto debido: ${selectedPayment?.totalAmount.toLocaleString()}
            </Typography>
          </Box>

          <Divider />

          <TextField
            label="Monto Cobrado"
            value={editAmount}
            onChange={(e) => setEditAmount(formatAmount(e.target.value))}
            fullWidth
            InputProps={{
              startAdornment: '$',
            }}
            helperText="Ingrese el monto efectivamente cobrado"
          />

          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as string)}
              label="Estado"
            >
              <MenuItem value="PENDING">Pendiente</MenuItem>
              <MenuItem value="COMPLETED">Completado</MenuItem>
              <MenuItem value="PARTIAL">Pago Parcial</MenuItem>
              <MenuItem value="OVERDUE">En Mora</MenuItem>
              <MenuItem value="CANCELED">Cancelado</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Notas"
            multiline
            rows={3}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            fullWidth
            placeholder="Observaciones, acuerdos, próximo contacto, etc."
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
        <Button
          onClick={handleClose}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}