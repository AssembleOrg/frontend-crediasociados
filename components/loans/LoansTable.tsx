'use client'

import { useState } from 'react'
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
  IconButton,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material'
import {
  Visibility,
  MonetizationOn,
  Person,
  PictureAsPdf,
  DeleteForever
} from '@mui/icons-material'
import { useLoans } from '@/hooks/useLoans'
import { useSubLoans } from '@/hooks/useSubLoans'
import { useExport } from '@/hooks/useExport'
import { useClients } from '@/hooks/useClients'
import { DeleteLoanConfirmModal } from '@/components/loans/DeleteLoanConfirmModal'
import { getFrequencyLabel, getStatusLabel } from '@/lib/formatters'
import type { Loan } from '@/types/auth'

interface LoansTableProps {
  loans?: Loan[] // Optional external loans data (for filtering)
  onViewDetails?: (loanId: string) => void
  onLoanDeleted?: () => void // Callback to refresh dashboard data after deletion
}

export function LoansTable({ loans: externalLoans, onViewDetails, onLoanDeleted }: LoansTableProps) {
  const { loans: hookLoans, isLoading, deleteLoanPermanently } = useLoans()
  const { allSubLoansWithClient } = useSubLoans()
  const { exportLoanToPDF, canExport } = useExport()
  const { clients } = useClients()
  
  // Use external loans if provided (for filtering), otherwise use hook loans
  const loans = externalLoans || hookLoans
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null)
  
  // Success snackbar state
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  // Get client info from multiple sources (supports both new and existing loans)
  const getClientDisplay = (loanId: string) => {
    // First, try to get loan to find clientId
    const loan = loans.find(l => l.id === loanId)
    const clientId = loan?.clientId
    
    // Strategy 1: Find client info from allSubLoansWithClient data (for existing loans with subloans)
    const subloanWithClient = allSubLoansWithClient.find(subloan => subloan.loanId === loanId)
    if (subloanWithClient?.clientName || subloanWithClient?.clientFullData?.fullName) {
      return {
        name: subloanWithClient.clientName || subloanWithClient.clientFullData?.fullName || 'Cliente',
        id: subloanWithClient.clientId || clientId || 'N/A'
      }
    }
    
    // Strategy 2: Find client in clients list using clientId (for new loans without subloans)
    if (clientId) {
      const client = clients.find(c => c.id === clientId)
      if (client) {
        return {
          name: client.fullName,
          id: client.id
        }
      }
    }
    
    // Fallback: Show client ID if no name found
    return {
      name: clientId ? `Cliente ${clientId}` : 'Cliente N/A',
      id: clientId || 'N/A'
    }
  }

  // Calculate interest rate - Uses same logic as StandaloneLoanSimulator
  const getInterestRate = (loan: Loan) => {
    // Primary source: Use baseInterestRate directly from loan (from API)
    if (loan.baseInterestRate && loan.baseInterestRate > 0) {
      // If baseInterestRate is already a percentage (> 1), use as-is
      // If it's a decimal (< 1), convert to percentage
      return loan.baseInterestRate > 1 ? loan.baseInterestRate : loan.baseInterestRate * 100;
    }
    
    // Fallback: Calculate from subloans if baseInterestRate is not available
    const loanSubLoans = allSubLoansWithClient.filter(subloan => subloan.loanId === loan.id)
    if (loanSubLoans.length > 0) {
      const totalAmount = loanSubLoans.reduce((sum, sl) => sum + (sl.totalAmount ?? 0), 0)
      const totalInterest = totalAmount - loan.amount
      
      if (totalInterest > 0 && loan.amount > 0) {
        return (totalInterest / loan.amount) * 100;
      }
    }
    
    // Default: 0% for legitimate zero-interest loans
    return 0;
  }

  const getStatusChip = (status: string) => {
    const label = getStatusLabel(status)
    
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return <Chip label={label} color="success" size="small" />
      case 'PENDING':
        return <Chip label={label} color="warning" size="small" />
      case 'COMPLETED':
        return <Chip label={label} color="info" size="small" />
      case 'DEFAULTED':
        return <Chip label={label} color="error" size="small" />
      default:
        return <Chip label={label} size="small" />
    }
  }

  type LoanLike = { totalPayments?: number; id: string }
  const getProgressInfo = (loan: LoanLike) => {
    const totalPayments = loan.totalPayments || 0
    
    // Get all subloans for this loan
    const loanSubLoans = allSubLoansWithClient.filter(subloan => subloan.loanId === loan.id)
    
    // Count only PAID and PARTIAL for the numeric progress
    const completedPayments = loanSubLoans.filter(
      sl => sl.status === 'PAID' || sl.status === 'PARTIAL'
    ).length
    
    // Calculate percentage for the numeric display
    const progress = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0
    
    // Group subloans by status for visual progress
    const statusGroups = {
      paid: loanSubLoans.filter(sl => sl.status === 'PAID').length,
      partial: loanSubLoans.filter(sl => sl.status === 'PARTIAL').length,
      overdue: loanSubLoans.filter(sl => sl.status === 'OVERDUE').length,
      pending: loanSubLoans.filter(sl => sl.status === 'PENDING').length,
    }
    
    return { totalPayments, completedPayments, progress, statusGroups }
  }

  const formatCurrency = (amount: number) => {
    // Formato genérico sin especificar país o moneda
    return `$${new Intl.NumberFormat('es', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR')
  }

  // Multi-color progress bar component
  const MultiColorProgressBar = ({ loanId, totalPayments }: { 
    loanId: string
    totalPayments: number 
  }) => {
    if (totalPayments === 0) {
      return (
        <Box sx={{ 
          width: '100%', 
          height: 8, 
          bgcolor: 'grey.200', 
          borderRadius: 1 
        }} />
      )
    }

    // Get all subloans for this loan and sort by payment number
    const loanSubLoans = allSubLoansWithClient
      .filter(subloan => subloan.loanId === loanId)
      .sort((a, b) => (a.paymentNumber || 0) - (b.paymentNumber || 0))

    // Create an array representing each payment slot
    const paymentSlots = Array.from({ length: totalPayments }, (_, index) => {
      const subloan = loanSubLoans.find(sl => (sl.paymentNumber || 0) === index + 1)
      return subloan?.status || 'PENDING'
    })

    const segmentWidth = 100 / totalPayments

    const getColorForStatus = (status: string) => {
      switch (status) {
        case 'PAID':
          return '#4caf50' // green
        case 'PARTIAL':
          return '#ff9800' // orange/yellow
        case 'OVERDUE':
          return '#f44336' // red
        case 'PENDING':
        default:
          return '#e0e0e0' // grey
      }
    }

    return (
      <Box sx={{ 
        width: '100%', 
        height: 8, 
        bgcolor: 'grey.200', 
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        gap: '1px'
      }}>
        {paymentSlots.map((status, index) => (
          <Box
            key={index}
            sx={{
              width: `${segmentWidth}%`,
              height: '100%',
              bgcolor: getColorForStatus(status),
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </Box>
    )
  }

  const paginatedLoans = loans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleDeleteClick = (loan: Loan) => {
    setLoanToDelete(loan)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!loanToDelete) return

    try {
      const result = await deleteLoanPermanently(loanToDelete.id)
      setSuccessMessage(
        `Préstamo ${result.loanTrack} eliminado. Monto devuelto: $${result.montoDevuelto.toLocaleString('es-AR')}`
      )
      setSnackbarOpen(true)
      setDeleteModalOpen(false)
      setLoanToDelete(null)
      
      // Refresh dashboard data (cards) after successful deletion
      onLoanDeleted?.()
    } catch (error) {
      // Error is already handled by the modal
      throw error
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
    setSuccessMessage(null)
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
                <TableCell align="center"><strong>Tasa %</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Progreso</strong></TableCell>
                <TableCell align="center"><strong>Creado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLoans.map((loan) => {
                const { totalPayments, completedPayments, progress, statusGroups } = getProgressInfo(loan)
                
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
                            {getClientDisplay(loan.id).name}
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
                        {getFrequencyLabel(loan.paymentFrequency)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {getInterestRate(loan).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        interés
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
                        <MultiColorProgressBar 
                          loanId={loan.id}
                          totalPayments={totalPayments}
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
                        <IconButton 
                          size="small" 
                          onClick={() => exportLoanToPDF(loan.id)}
                          disabled={!canExport(loan.id)}
                          title="Exportar PDF"
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.50'
                            }
                          }}
                        >
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(loan)}
                          title="Eliminar Permanentemente"
                          sx={{
                            color: 'error.dark',
                            '&:hover': {
                              backgroundColor: 'error.100'
                            }
                          }}
                        >
                          <DeleteForever fontSize="small" />
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
          const { totalPayments, completedPayments, progress, statusGroups } = getProgressInfo(loan)
          
          return (
            <Card key={loan.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {getClientDisplay(loan.id).name}
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
                    <Typography variant="caption" color="primary.main">
                      Tasa: {getInterestRate(loan).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Progreso de pagos
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {completedPayments}/{totalPayments}
                    </Typography>
                    <MultiColorProgressBar 
                      loanId={loan.id}
                      totalPayments={totalPayments}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => onViewDetails?.(loan.id)}
                    sx={{ borderRadius: 2, flex: 1 }}
                  >
                    Ver Detalles
                  </Button>
                  <IconButton 
                    size="small" 
                    onClick={() => exportLoanToPDF(loan.id)}
                    disabled={!canExport(loan.id)}
                    title="Exportar PDF"
                    sx={{
                      color: 'error.main',
                      border: 1,
                      borderColor: 'error.main',
                      '&:hover': {
                        backgroundColor: 'error.50'
                      }
                    }}
                  >
                    <PictureAsPdf fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteClick(loan)}
                    title="Eliminar"
                    sx={{
                      color: 'error.dark',
                      border: 1,
                      borderColor: 'error.dark',
                      '&:hover': {
                        backgroundColor: 'error.100'
                      }
                    }}
                  >
                    <DeleteForever fontSize="small" />
                  </IconButton>
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

      {/* Delete Confirmation Modal */}
      <DeleteLoanConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setLoanToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        loanTrack={loanToDelete?.loanTrack}
        loanAmount={loanToDelete?.amount}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </MuiAlert>
      </Snackbar>
    </Paper>
  )
}
