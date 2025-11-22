'use client';

import { Container, Typography, Box, Paper } from '@mui/material';
import { AccountBalance } from '@mui/icons-material';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { usePublicLoanQuery } from '@/hooks/usePublicLoanQuery';
import QueryForm from '@/components/consulta/QueryForm';
import LoanDetails from '@/components/consulta/LoanDetails';
// import PaymentsTable from '@/components/consulta/PaymentsTable';
import HelpSection from '@/components/consulta/HelpSection';

export default function ConsultaPublicaPage() {
  const { isLoading, error, loanDetails, queryLoan } = usePublicLoanQuery();

  const handleQuerySubmit = async (dni: string, loanTrack: string) => {
    return await queryLoan({ dni, loanTrack });
  };

  return (
    <>
      <Navbar />

      <Container
        maxWidth='lg'
        sx={{ py: { xs: 3, sm: 4, md: 6 }, px: { xs: 2, sm: 3 } }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <AccountBalance sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography
            variant='h3'
            component='h1'
            gutterBottom
          >
            Consulta tu Préstamo
          </Typography>
          <Typography
            variant='h6'
            color='text.secondary'
          >
            Ingresa tu DNI y código de seguimiento para consultar el estado de
            tu préstamo
          </Typography>
        </Box>

        {/* Query Form */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <QueryForm
            onSubmit={handleQuerySubmit}
            isLoading={isLoading}
            error={error}
          />
        </Paper>

        {/* Loan Results */}
        {loanDetails && (
          <Box>
            <LoanDetails loanDetails={loanDetails} />
          </Box>
        )}

        {/* Help Section */}
        {!loanDetails && <HelpSection />}
      </Container>

      <Footer />
    </>
  );
}
