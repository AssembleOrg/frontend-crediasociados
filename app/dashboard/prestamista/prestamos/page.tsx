'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  AccountBalance,
  TrendingUp,
  Assessment,
  MonetizationOn,
  Warning,
  Payment,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useLoans } from '@/hooks/useLoans';
import { useSubLoans } from '@/hooks/useSubLoans';
import { LoansTable } from '@/components/loans/LoansTable';
import LoanTimeline from '@/components/loans/LoanTimeline';

// Real data will come from useLoans hook

export default function PrestamosAnalyticsPage() {
  const router = useRouter();
  const { loans, isLoading, error, getTotalLoans } = useLoans();
  const {
    allSubLoansWithClient,
    fetchAllSubLoansWithClientInfo,
    isLoading: subLoansLoading,
  } = useSubLoans();

  // Modal states
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);

  const totalLoans = getTotalLoans();
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const activeLoans = loans.filter(
    (loan) => loan.status === 'ACTIVE' || loan.status === 'APPROVED'
  ).length;
  const completedLoans = loans.filter(
    (loan) => loan.status === 'COMPLETED'
  ).length;
  const pendingLoans = loans.filter((loan) => loan.status === 'PENDING').length;
  const avgLoanAmount = totalLoans > 0 ? totalAmount / totalLoans : 0;

  const handleCreateLoan = () => {
    router.push('/dashboard/prestamista/prestamos/nuevo');
  };

  const handleGoToCobros = () => {
    router.push('/dashboard/prestamista/cobros');
  };

  const handleViewDetails = (loanId: string) => {
    setSelectedLoanId(loanId);
    setTimelineModalOpen(true);
    // Load subloans data only when needed
    fetchAllSubLoansWithClientInfo();
  };

  const handleGoToCobrosForClient = () => {
    // Close modal and navigate to cobros
    setTimelineModalOpen(false);
    router.push('/dashboard/prestamista/cobros');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
          gap: 3,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant='h4'
            component='h1'
            gutterBottom
          >
            Análisis de Cartera
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
          >
            Dashboard analítico con reportes históricos y métricas de
            rendimiento
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Button
            variant='contained'
            size='small'
            color='secondary'
            startIcon={<Add />}
            onClick={handleCreateLoan}
            sx={{ width: { xs: '100%', sm: 'auto' }, px: 1, py: 1 }}
          >
            Nuevo Préstamo
          </Button>
          <Button
            variant='contained'
            size='small'
            color='primary'
            onClick={handleGoToCobros}
            sx={{ width: { xs: '100%', sm: 'auto' }, px: 2, py: 1 }}
          >
            Ir a Cobros
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity='error'
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Stats Grid Simplificada */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 3,
          mb: 4,
        }}
      >
        <StatsCard
          title='Total Préstamos'
          value={totalLoans}
          subtitle={`$${totalAmount.toLocaleString()} prestados`}
          icon={<AccountBalance />}
          color='primary'
          isLoading={isLoading}
        />
        <StatsCard
          title='Préstamos Activos'
          value={activeLoans}
          subtitle='en proceso de pago'
          icon={<TrendingUp />}
          color='success'
          isLoading={isLoading}
        />
        <StatsCard
          title='Pendientes de Aprobación'
          value={pendingLoans}
          subtitle='esperando revisión'
          icon={<Warning />}
          color='warning'
          isLoading={isLoading}
        />
        <StatsCard
          title='Préstamo Promedio'
          value={`$${Math.round(avgLoanAmount).toLocaleString()}`}
          subtitle='monto promedio por préstamo'
          icon={<MonetizationOn />}
          color='primary'
          isLoading={isLoading}
        />
      </Box>

      {/* Tabla Detallada de Préstamos */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Typography variant='h6'>📋 Tu Cartera de Préstamos</Typography>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={handleCreateLoan}
          >
            Nuevo Préstamo
          </Button>
        </Box>

        {error && (
          <Alert
            severity='error'
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        <LoansTable
          onViewLoan={(loanId) => {
            console.log('Ver detalles del préstamo:', loanId);
            // TODO: Navegar a página de detalles del préstamo
          }}
          onViewDetails={handleViewDetails}
        />

        {/* Acciones Rápidas */}
        {totalLoans > 0 && (
          <Box
            sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}
          >
            <Button
              variant='outlined'
              onClick={() => router.push('/dashboard/prestamista/cobros')}
            >
              Ver Cobros del Día
            </Button>
            <Button
              variant='outlined'
              onClick={() => router.push('/dashboard/prestamista/clientes')}
            >
              Gestionar Clientes
            </Button>
          </Box>
        )}
      </Box>

      {/* Loan Timeline Modal */}
      <Dialog
        open={timelineModalOpen}
        onClose={() => setTimelineModalOpen(false)}
        maxWidth='lg'
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '95vw', sm: '90vw', md: '1400px' },
            height: { xs: '90vh', sm: 'auto' },
            maxWidth: 'none',
            m: { xs: 1, sm: 3 },
            borderRadius: { xs: 2, sm: 3 },
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Payment color='primary' />
            <Typography variant='h6'>Detalles del Préstamo</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 4 }, overflow: 'auto' }}>
          {subLoansLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography
                variant='h6'
                color='text.secondary'
                gutterBottom
              >
                Cargando detalles del préstamo...
              </Typography>
            </Box>
          ) : (
            selectedLoanId &&
            (() => {
              // Find loan details
              const selectedLoan = loans.find(
                (loan) => loan.id === selectedLoanId
              );
              const loanSubLoans = allSubLoansWithClient.filter(
                (subloan) => subloan.loanId === selectedLoanId
              );

              if (!selectedLoan) {
                return <Typography>Préstamo no encontrado</Typography>;
              }

              const clientName =
                loanSubLoans.length > 0
                  ? loanSubLoans[0].clientName ||
                    `Cliente #${selectedLoan.clientId}`
                  : `Cliente #${selectedLoan.clientId}`;

              return (
                <Box>
                  {/* Loan Summary Header */}
                  <Box
                    sx={{ mb: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}
                  >
                    <Typography
                      variant='h5'
                      fontWeight='bold'
                      gutterBottom
                    >
                      {clientName} - {selectedLoan.loanTrack}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 3,
                        mt: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          Monto del préstamo
                        </Typography>
                        <Typography
                          variant='h6'
                          fontWeight='bold'
                        >
                          ${selectedLoan.amount.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          Estado
                        </Typography>
                        <Typography
                          variant='h6'
                          fontWeight='bold'
                          color='success.main'
                        >
                          {selectedLoan.status}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          Total cuotas
                        </Typography>
                        <Typography
                          variant='h6'
                          fontWeight='bold'
                        >
                          {selectedLoan.totalPayments}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >
                          Frecuencia
                        </Typography>
                        <Typography
                          variant='h6'
                          fontWeight='bold'
                        >
                          {selectedLoan.paymentFrequency}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Timeline Component */}
                  {loanSubLoans.length > 0 ? (
                    <LoanTimeline
                      clientName={clientName}
                      subLoans={loanSubLoans}
                      compact={false}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography
                        variant='h6'
                        color='text.secondary'
                        gutterBottom
                      >
                        Sin cuotas disponibles
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                      >
                        Este préstamo aún no tiene cuotas generadas en el
                        sistema.
                      </Typography>
                    </Box>
                  )}

                  {/* Action Section */}
                  <Box
                    sx={{
                      mt: 4,
                      p: 3,
                      bgcolor: '#f0f7ff',
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'primary.main',
                    }}
                  >
                    <Typography
                      variant='h6'
                      fontWeight='bold'
                      color='primary.main'
                      gutterBottom
                    >
                      💼 Gestión de Cobros
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 2 }}
                    >
                      ¿Necesitas gestionar los cobros de este cliente? Ve a la
                      sección de cobros para acciones específicas.
                    </Typography>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={handleGoToCobrosForClient}
                      sx={{ mr: 2 }}
                    >
                      Ir a Cobros de este Cliente
                    </Button>
                    <Button
                      variant='outlined'
                      color='primary'
                      onClick={() => setTimelineModalOpen(false)}
                    >
                      Cerrar
                    </Button>
                  </Box>
                </Box>
              );
            })()
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button
            onClick={() => setTimelineModalOpen(false)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
