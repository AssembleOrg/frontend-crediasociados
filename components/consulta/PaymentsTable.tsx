'use client';

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { getPaymentStatusLabel } from '@/lib/formatters';

interface Payment {
  paymentNumber: number;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidDate?: string;
}

interface PaymentsTableProps {
  payments: Payment[];
  loanTrack: string;
}

export default function PaymentsTable({
  payments,
  loanTrack,
}: PaymentsTableProps) {
  // Handle case when no payment data is available
  if (!payments || payments.length === 0) {
    return (
      <Box>
        <Typography
          variant='h5'
          gutterBottom
          sx={{ color: 'primary.main', mb: 3 }}
        >
          Detalle de Cuotas
        </Typography>

        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            bgcolor: 'grey.50',
            borderRadius: 2,
          }}
        >
          <Typography
            variant='h6'
            color='text.secondary'
            gutterBottom
          >
            Información de cuotas no disponible
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
          >
            Los detalles específicos de las cuotas no están disponibles en la
            consulta pública.
            <br />
            Para información detallada sobre pagos y estados, contacta
            directamente con tu cobrador.
          </Typography>

          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'info.light',
              borderRadius: 1,
              display: 'inline-block',
            }}
          >
            <Typography
              variant='body2'
              fontWeight='bold'
            >
              Código de seguimiento: {loanTrack}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getPaymentStatusChip = (status: string) => {
    const label = getPaymentStatusLabel(status);

    switch (status) {
      case 'PAID':
        return (
          <Chip
            label={label}
            color='success'
            size='small'
          />
        );
      case 'OVERDUE':
        return (
          <Chip
            label={label}
            color='error'
            size='small'
          />
        );
      case 'PENDING':
        return (
          <Chip
            label={label}
            color='warning'
            size='small'
          />
        );
      default:
        return (
          <Chip
            label={label}
            size='small'
          />
        );
    }
  };

  return (
    <Box>
      <Typography
        variant='h5'
        gutterBottom
        sx={{ color: 'primary.main', mb: 3 }}
      >
        Detalle de Cuotas
      </Typography>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Cuota</strong>
                </TableCell>
                <TableCell align='right'>
                  <strong>Monto</strong>
                </TableCell>
                <TableCell align='center'>
                  <strong>Fecha Venc.</strong>
                </TableCell>
                <TableCell align='center'>
                  <strong>Estado</strong>
                </TableCell>
                <TableCell align='center'>
                  <strong>Fecha Pago</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  key={payment.paymentNumber}
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                    backgroundColor:
                      payment.status === 'OVERDUE' ? 'error.50' : undefined,
                  }}
                >
                  <TableCell>
                    <Chip
                      label={`Cuota ${payment.paymentNumber}`}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <Typography
                      variant='body2'
                      fontWeight='bold'
                    >
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Typography variant='body2'>
                      {formatDate(payment.dueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    {getPaymentStatusChip(payment.status)}
                  </TableCell>
                  <TableCell align='center'>
                    <Typography variant='body2'>
                      {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {payments.map((payment) => (
          <Card
            key={payment.paymentNumber}
            sx={{
              mb: 2,
              backgroundColor:
                payment.status === 'OVERDUE' ? 'error.50' : undefined,
            }}
            variant='outlined'
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Chip
                  label={`Cuota ${payment.paymentNumber}`}
                  color='primary'
                  variant='outlined'
                />
                {getPaymentStatusChip(payment.status)}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    Monto
                  </Typography>
                  <Typography
                    variant='h6'
                    fontWeight='bold'
                  >
                    {formatCurrency(payment.amount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    Fecha de vencimiento
                  </Typography>
                  <Typography variant='body2'>
                    {formatDate(payment.dueDate)}
                  </Typography>
                </Box>
              </Box>

              {payment.paidDate && (
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    Fecha de pago
                  </Typography>
                  <Typography
                    variant='body2'
                    color='success.main'
                  >
                    {formatDate(payment.paidDate)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ textAlign: 'center' }}
      >
        <Warning sx={{ verticalAlign: 'middle', mr: 1 }} />
        Si tienes dudas sobre tu préstamo o necesitas asistencia, contacta
        directamente con tu cobrador.
        <br />
        Código de seguimiento: <strong>{loanTrack}</strong>
      </Typography>
    </Box>
  );
}
