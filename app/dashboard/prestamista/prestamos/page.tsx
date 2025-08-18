'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  TextField,
  InputAdornment,
  LinearProgress,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Search,
  Visibility,
  AccountBalance,
  TrendingUp,
  Schedule,
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useLoans } from '@/hooks/useLoans'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { EditLoanModal } from '@/components/loans/EditLoanModal'
import { DeleteLoanConfirmDialog } from '@/components/loans/DeleteLoanConfirmDialog'
import { LoanInstallmentsModal } from '@/components/loans/LoanInstallmentsModal'
import { 
  calculateNextPayment, 
  calculateLoanProgress,
  getDaysUntilDueColor,
  formatDaysUntilDue,
  formatCurrency,
  getLoanStatusColor,
  translateLoanStatus 
} from '@/lib/loan-utils'

export default function PrestamosPage() {
  const router = useRouter()
  const { loans, isLoading, error, getTotalLoans, getActiveLoansByStatus } = useLoans()
  const [searchTerm, setSearchTerm] = useState('')
  
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [installmentsModalOpen, setInstallmentsModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<typeof loans[0] | null>(null)

  const totalLoans = getTotalLoans()
  const activeLoans = getActiveLoansByStatus()
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0)

  const filteredLoans = loans.filter(loan =>
    loan.loanTrack.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (loan.description && loan.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    loan.amount.toString().includes(searchTerm)
  )

  const handleCreateLoan = () => {
    router.push('/dashboard/prestamista/prestamos/nuevo')
  }

  const handleViewLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId)
    if (loan) {
      setSelectedLoan(loan)
      setInstallmentsModalOpen(true)
    }
  }

  const handleEditLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId)
    if (loan) {
      setSelectedLoan(loan)
      setEditModalOpen(true)
    }
  }

  const handleDeleteLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId)
    if (loan) {
      setSelectedLoan(loan)
      setDeleteDialogOpen(true)
    }
  }

  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setSelectedLoan(null)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setSelectedLoan(null)
  }

  const handleCloseInstallmentsModal = () => {
    setInstallmentsModalOpen(false)
    setSelectedLoan(null)
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestión de Préstamos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Lista de todos tus préstamos activos e histórico con seguimiento de pagos
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        <StatsCard
          title="Total Préstamos"
          value={totalLoans}
          subtitle={`préstamo${totalLoans !== 1 ? 's' : ''} registrado${totalLoans !== 1 ? 's' : ''}`}
          icon={<AccountBalance />}
          color="primary"
          isLoading={isLoading}
        />
        <StatsCard
          title="Préstamos Activos"
          value={activeLoans.length}
          subtitle="activos y aprobados"
          icon={<TrendingUp />}
          color="success"
          isLoading={isLoading}
        />
        <StatsCard
          title="Monto Total"
          value={`$${totalAmount.toLocaleString()}`}
          subtitle="valor total prestado"
          icon={<AccountBalance />}
          color="warning"
          isLoading={isLoading}
        />
      </Box>

      {/* Actions Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <TextField
          placeholder="Buscar por código, descripción o monto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateLoan}
        >
          Crear Préstamo
        </Button>
      </Box>

      {/* Loans Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Próxima Cuota</TableCell>
              <TableCell>Progreso</TableCell>
              <TableCell>Frecuencia</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Creado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={8} rows={5} />
            ) : filteredLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {totalLoans === 0 
                      ? 'No tienes préstamos registrados aún'
                      : 'No se encontraron préstamos que coincidan con tu búsqueda'
                    }
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLoans.map((loan) => {
                const nextPayment = calculateNextPayment(loan);
                const progress = calculateLoanProgress(loan);
                
                return (
                  <TableRow key={loan.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {loan.loanTrack}
                      </Typography>
                      {loan.description && (
                        <Typography variant="caption" color="text.secondary">
                          {loan.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(loan.amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {loan.totalPayments} cuotas
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {nextPayment ? (
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(nextPayment.amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {nextPayment.dueDate.toLocaleDateString()}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={formatDaysUntilDue(nextPayment.daysUntilDue)}
                              color={getDaysUntilDueColor(nextPayment.daysUntilDue)}
                              size="small"
                              icon={<Schedule />}
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Completado
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {progress.paidPayments}/{progress.totalPayments} cuotas
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(progress.percentageComplete)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress.percentageComplete}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {loan.paymentFrequency === 'WEEKLY' ? 'Semanal' :
                         loan.paymentFrequency === 'MONTHLY' ? 'Mensual' :
                         loan.paymentFrequency === 'DAILY' ? 'Diario' :
                         loan.paymentFrequency === 'BIWEEKLY' ? 'Quincenal' :
                         loan.paymentFrequency}
                      </Typography>
                      {loan.paymentDay && (
                        <Typography variant="caption" color="text.secondary">
                          {loan.paymentDay === 'MONDAY' ? 'Lunes' :
                           loan.paymentDay === 'TUESDAY' ? 'Martes' :
                           loan.paymentDay === 'WEDNESDAY' ? 'Miércoles' :
                           loan.paymentDay === 'THURSDAY' ? 'Jueves' :
                           loan.paymentDay === 'FRIDAY' ? 'Viernes' :
                           loan.paymentDay === 'SATURDAY' ? 'Sábado' :
                           loan.paymentDay === 'SUNDAY' ? 'Domingo' :
                           loan.paymentDay}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={translateLoanStatus(loan.status)}
                        color={getLoanStatusColor(loan.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {loan.createdAt.toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewLoan(loan.id)}
                          title="Ver préstamo"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditLoan(loan.id)}
                          title="Editar préstamo"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteLoan(loan.id)}
                          title="Eliminar préstamo"
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Empty State for New Users */}
      {!isLoading && totalLoans === 0 && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Paper sx={{ p: 4 }}>
            <AccountBalance sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              ¡Comienza creando tu primer préstamo!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Utiliza el simulador para calcular términos y condiciones antes de confirmar
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={handleCreateLoan}
            >
              Crear Mi Primer Préstamo
            </Button>
          </Paper>
        </Box>
      )}

      {/* Modales */}
      <LoanInstallmentsModal
        open={installmentsModalOpen}
        onClose={handleCloseInstallmentsModal}
        loan={selectedLoan}
      />

      <EditLoanModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        loan={selectedLoan}
      />

      <DeleteLoanConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        loan={selectedLoan}
      />
    </Box>
  )
}