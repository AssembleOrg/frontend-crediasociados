'use client'

import React, { memo } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material'
import { Person, CheckCircle } from '@mui/icons-material'
import type { ActiveLoanFinancial } from '@/types/finanzas'

interface ActiveLoansFinancialTableProps {
  loans: ActiveLoanFinancial[]
  isLoading?: boolean
}

const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('es-AR')}`
}

const getProgressColor = (progress: number): string => {
  if (progress >= 75) return '#388e3c' // Verde
  if (progress >= 50) return '#1976d2' // Azul
  if (progress >= 25) return '#f57c00' // Naranja
  return '#d32f2f' // Rojo
}

const ActiveLoansFinancialTable = memo(function ActiveLoansFinancialTable({
  loans,
  isLoading = false
}: ActiveLoansFinancialTableProps) {
  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Préstamos Activos
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          Cargando préstamos activos...
        </Box>
      </Paper>
    )
  }

  if (!loans.length) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Préstamos Activos
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          No hay préstamos activos
        </Box>
      </Paper>
    )
  }

  const totalMonto = loans.reduce((sum, loan) => sum + loan.montoTotal, 0)
  const totalPagado = loans.reduce((sum, loan) => sum + loan.montoPagado, 0)
  const totalPendiente = loans.reduce((sum, loan) => sum + loan.montoPendiente, 0)

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Préstamos Activos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {loans.length} {loans.length === 1 ? 'préstamo activo' : 'préstamos activos'}
        </Typography>
      </Box>

      {/* Desktop Table */}
      <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Monto Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pendiente</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pagado</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Progreso</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.loanId} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" color="primary" />
                    <Typography variant="body2" fontWeight={500}>
                      {loan.clientName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(loan.montoTotal)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="error.main" fontWeight={600}>
                    {formatCurrency(loan.montoPendiente)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main" fontWeight={600}>
                    {formatCurrency(loan.montoPagado)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1, minWidth: 100 }}>
                      <LinearProgress
                        variant="determinate"
                        value={loan.progreso}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getProgressColor(loan.progreso),
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 40 }}>
                      {loan.progreso}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}

            {/* Totals Row */}
            <TableRow sx={{ bgcolor: 'grey.50', fontWeight: 'bold' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>TOTALES</TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={700}>
                  {formatCurrency(totalMonto)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={700} color="error.main">
                  {formatCurrency(totalPendiente)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={700} color="success.main">
                  {formatCurrency(totalPagado)}
                </Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {loans.map((loan) => (
          <Card key={loan.loanId} variant="outlined">
            <CardContent>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="primary" />
                <Typography variant="body1" fontWeight={600}>
                  {loan.clientName}
                </Typography>
                {loan.progreso === 100 && (
                  <Chip
                    icon={<CheckCircle />}
                    label="Completado"
                    color="success"
                    size="small"
                  />
                )}
              </Box>

              {/* Metrics Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Monto Total
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatCurrency(loan.montoTotal)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pendiente
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="error.main">
                    {formatCurrency(loan.montoPendiente)}
                  </Typography>
                </Box>

                <Box sx={{ gridColumn: 'span 2' }}>
                  <Typography variant="caption" color="text.secondary">
                    Pagado
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main">
                    {formatCurrency(loan.montoPagado)}
                  </Typography>
                </Box>
              </Box>

              {/* Progress Bar */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Progreso
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {loan.progreso}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={loan.progreso}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getProgressColor(loan.progreso),
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Totals Card */}
        <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              TOTALES
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Monto Total
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {formatCurrency(totalMonto)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Pendiente
                </Typography>
                <Typography variant="body1" fontWeight={700} color="error.main">
                  {formatCurrency(totalPendiente)}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography variant="caption" color="text.secondary">
                  Pagado
                </Typography>
                <Typography variant="body1" fontWeight={700} color="success.main">
                  {formatCurrency(totalPagado)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Paper>
  )
})

export default ActiveLoansFinancialTable
