'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TablePagination,
  LinearProgress,
  Card,
  CardContent,
  IconButton
} from '@mui/material'
import {
  Visibility,
  Edit,
  MonetizationOn,
  Schedule,
  CheckCircle,
  Warning,
  Person
} from '@mui/icons-material'
import { useLoans } from '@/hooks/useLoans'
import { useSubLoans } from '@/hooks/useSubLoans'
import type { ClientResponseDto } from '@/types/auth'

interface LoansTableProps {
  onViewLoan?: (loanId: string) => void
  onViewDetails?: (loanId: string) => void
}

export function LoansTable({ onViewLoan, onViewDetails }: LoansTableProps) {
  const { loans, isLoading } = useLoans()
  const { allSubLoansWithClient } = useSubLoans()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Get client info from provider data (no service calls needed)
  const getClientDisplay = (loanId: string) => {
    // Find client info from allSubLoansWithClient data
    const subloanWithClient = allSubLoansWithClient.find(subloan => subloan.loanId === loanId)
    return {
      name: subloanWithClient?.clientName || subloanWithClient?.clientFullData?.fullName || `Cliente ${subloanWithClient?.clientId || 'N/A'}`,
      id: subloanWithClient?.clientId || 'N/A'
    }
  }

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return <Chip label="Activo" color="success" size="small" />
      case 'PENDING':
        return <Chip label="Pendiente" color="warning" size="small" />
      case 'COMPLETED':
        return <Chip label="Completado" color="info" size="small" />
      case 'DEFAULTED':
        return <Chip label="Mora" color="error" size="small" />
      default:
        return <Chip label={status} size="small" />
    }
  }

  type LoanLike = { totalPayments?: number }
  const getProgressInfo = (loan: LoanLike) => {
    // TODO: Cuando tengamos subloans, calcular progreso real
    const totalPayments = loan.totalPayments || 0
    const completedPayments = 0 // TODO: Contar subloans pagados
    const progress = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0
    
    return { totalPayments, completedPayments, progress }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR')
  }

  const paginatedLoans = loans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cargando préstamos...
        </Typography>
        <LinearProgress />
      </Paper>
    )
  }

  if (loans.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <MonetizationOn sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No tienes préstamos registrados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea tu primer préstamo para comenzar a gestionar tu cartera
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Préstamo</strong></TableCell>
                <TableCell align="right"><strong>Monto</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Progreso</strong></TableCell>
                <TableCell align="center"><strong>Creado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLoans.map((loan) => {
                const { totalPayments, completedPayments, progress } = getProgressInfo(loan)
                
                return (
                  <TableRow 
                    key={loan.id}
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {getClientDisplay(loan.clientId).name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {loan.clientId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={loan.loanTrack || loan.id} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                      />
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(loan.amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {loan.paymentFrequency?.toLowerCase()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      {getStatusChip(loan.status)}
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box sx={{ minWidth: 100 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="caption">
                            {completedPayments} de {totalPayments}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress} 
                          sx={{ height: 6, borderRadius: 1 }}
                          color={progress === 100 ? 'success' : 'primary'}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatDate(loan.createdAt.toISOString())}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => onViewDetails?.(loan.id)}
                          title="Ver Detalles"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', lg: 'none' }, p: 2 }}>
        {paginatedLoans.map((loan) => {
          const { totalPayments, completedPayments, progress } = getProgressInfo(loan)
          
          return (
            <Card key={loan.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {getClientDisplay(loan.clientId).name}
                    </Typography>
                    <Chip 
                      label={loan.loanTrack || loan.id} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', mt: 0.5 }}
                    />
                  </Box>
                  {getStatusChip(loan.status)}
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Monto del préstamo
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(loan.amount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Progreso de pagos
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {completedPayments}/{totalPayments}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => onViewDetails?.(loan.id)}
                    sx={{ borderRadius: 2 }}
                  >
                    Ver Detalles
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={loans.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Préstamos por página:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </Paper>
  )
}
