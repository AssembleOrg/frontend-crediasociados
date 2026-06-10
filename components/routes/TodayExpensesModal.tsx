'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { Close, Receipt, CalendarToday, Person } from '@mui/icons-material'
import type { ExpenseCategory } from '@/services/collection-routes.service'

interface TodayExpensesModalProps {
  open: boolean
  onClose: () => void
  data: {
    date: string
    total: number
    totalAmount: number
    expenses: Array<{
      monto: number
      categoria: ExpenseCategory
      descripcion: string
      nombreManager: string
      emailManager: string
      fechaGasto: string
    }>
  } | null
}

const categoryColors: Record<ExpenseCategory, 'default' | 'primary' | 'secondary' | 'warning' | 'error' | 'info' | 'success'> = {
  COMBUSTIBLE: 'error',
  CONSUMO: 'warning',
  REPARACIONES: 'info',
  OTROS: 'default'
}

const categoryLabels: Record<ExpenseCategory, string> = {
  COMBUSTIBLE: 'Combustible',
  CONSUMO: 'Consumo',
  REPARACIONES: 'Reparaciones',
  OTROS: 'Otros'
}

export default function TodayExpensesModal({ open, onClose, data }: TodayExpensesModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!data) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: { xs: 'calc(100dvh - 96px)', sm: '90vh' },
          m: { xs: 1, sm: 2 },
          mt: { xs: 'auto', sm: 2 },
          width: { xs: '100%', sm: 'auto' },
        }
      }}
    >
      <DialogTitle sx={{
        pb: 2, pt: 3, px: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Receipt sx={{ fontSize: 24, color: 'warning.main' }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Gastos Realizados Hoy
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {formatDate(data.date)}
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
        {/* Resumen */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 3, mt: 2 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block">Total Gastado</Typography>
            <Typography variant="h6" fontWeight={700} color="warning.main" sx={{ mt: 0.5, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              {formatCurrency(data.totalAmount)}
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block">Cantidad</Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mt: 0.5, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              {data.total}
              <Typography component="span" variant="body2" fontWeight={400} color="text.secondary" sx={{ ml: 0.5 }}>
                {data.total === 1 ? 'gasto' : 'gastos'}
              </Typography>
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Expenses Table */}
        {data.expenses.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Detalle de Gastos
            </Typography>
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                    {!isMobile && (
                      <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
                    )}
                    {!isMobile && (
                      <TableCell sx={{ fontWeight: 600 }}>Manager</TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                    {!isMobile && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Fecha/Hora</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.expenses.map((expense, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.warning.main, 0.02) 
                        },
                        '&:last-child td': { border: 0 }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {expense.descripcion}
                        </Typography>
                        {isMobile && (
                          <>
                            <Chip
                              label={categoryLabels[expense.categoria]}
                              size="small"
                              color={categoryColors[expense.categoria]}
                              sx={{ mt: 0.5, fontSize: '0.65rem', height: 20 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {expense.nombreManager}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {formatDateTime(expense.fechaGasto)}
                            </Typography>
                          </>
                        )}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Chip
                            label={categoryLabels[expense.categoria]}
                            size="small"
                            color={categoryColors[expense.categoria]}
                          />
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {expense.nombreManager}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {expense.emailManager}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="warning.main">
                          {formatCurrency(expense.monto)}
                        </Typography>
                      </TableCell>
                      {!isMobile && (
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(expense.fechaGasto)}
                          </Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No hay gastos registrados para hoy
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

