'use client';

import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
} from '@mui/material';
import { Calculate, TrendingUp } from '@mui/icons-material';
import { formatAmount, unformatAmount, getFrequencyLabel } from '@/lib/formatters';
// Note: calculateLoanPayments function needs to be implemented in loan-calculator

interface SimulationResult {
  paymentNumber: number;
  amount: number;
  totalAmount: number;
  dueDate: Date;
}

export function StandaloneLoanSimulator() {
  const [amount, setAmount] = useState('');
  const [totalPayments, setTotalPayments] = useState('');
  const [baseInterestRate, setBaseInterestRate] = useState('10');
  const [paymentFrequency, setPaymentFrequency] = useState<
    'DAILY' | 'WEEKLY' | 'MONTHLY'
  >('MONTHLY');
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);

  const handleSimulate = () => {
    if (
      !amount ||
      !totalPayments ||
      parseFloat(unformatAmount(amount)) <= 0 ||
      parseInt(totalPayments) <= 0
    ) {
      return;
    }

    const principalAmount = parseFloat(unformatAmount(amount));
    const baseRate = parseFloat(baseInterestRate) / 100; // Convertir porcentaje a decimal
    const totalPaymentsNum = parseInt(totalPayments);

    if (!principalAmount || !totalPaymentsNum || isNaN(baseRate)) {
      return;
    }

    // Aplicar interés correctamente (igual que CreateLoanModal)
    const totalAmountWithInterest = principalAmount * (1 + baseRate);
    const amountPerPayment = totalAmountWithInterest / totalPaymentsNum;

    const simulatedPayments: SimulationResult[] = [];
    const startDate = new Date();

    for (let i = 1; i <= totalPaymentsNum; i++) {
      const dueDate = new Date(startDate);

      // Calcular fecha según frecuencia (igual que CreateLoanModal)
      switch (paymentFrequency) {
        case 'DAILY':
          dueDate.setDate(startDate.getDate() + (i - 1));
          break;
        case 'WEEKLY':
          dueDate.setDate(startDate.getDate() + (i - 1) * 7);
          break;
        case 'MONTHLY':
          dueDate.setMonth(startDate.getMonth() + (i - 1));
          break;
      }

      const principalPortion = principalAmount / totalPaymentsNum;
      const interestPortion = amountPerPayment - principalPortion;

      simulatedPayments.push({
        paymentNumber: i,
        amount: principalPortion, // Capital
        totalAmount: amountPerPayment, // Total (capital + interés)
        dueDate: dueDate,
      });
    }

    setResults(simulatedPayments);
    setIsCalculated(true);
  };

  const handleClear = () => {
    setResults([]);
    setIsCalculated(false);
    setAmount('');
    setTotalPayments('');
    setBaseInterestRate('10');
    setPaymentFrequency('MONTHLY');
  };

  const totalWithInterest = results.reduce(
    (sum, payment) => sum + payment.totalAmount,
    0
  );
  const totalPrincipal = results.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const totalInterest = totalWithInterest - totalPrincipal;


  // Calcular total en tiempo real (igual que CreateLoanModal)
  const calculateRealtimeTotal = (): number => {
    const principalAmount = parseFloat(unformatAmount(amount)) || 0;
    const interestRate = parseFloat(baseInterestRate) || 0;
    return principalAmount * (1 + interestRate / 100);
  };

  const realtimeTotal = calculateRealtimeTotal();

  return (
    <Paper
      sx={{
        p: 4,
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        borderRadius: 3,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        '& .MuiInputLabel-root': { 
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 500
        },
        '& .MuiInputLabel-root.Mui-focused': { 
          color: 'common.white' 
        },
        '& .MuiInputBase-root': { 
          color: 'common.white',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 2
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(255,255,255,0.3)',
        },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(255,255,255,0.6)',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: 'common.white',
          borderWidth: 2
        },
        '& .MuiInputBase-input': {
          color: 'common.white'
        },
        '& .MuiSelect-icon': { 
          color: 'rgba(255,255,255,0.8)' 
        },
        '& .MuiButton-root': { 
          color: 'primary.contrastText',
          fontWeight: 600
        },
        '& .MuiButton-outlined': { 
          borderColor: 'rgba(255,255,255,0.7)',
          '&:hover': {
            borderColor: 'common.white',
            backgroundColor: 'rgba(255,255,255,0.15)',
          }
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Calculate sx={{ mr: 2, color: '#ffffff' }} />
        <Typography variant='h6'>Simulador de Préstamos</Typography>
      </Box>

      <Typography
        variant='body2'
        color='text.primary'
        sx={{ mb: 3 }}
      >
        Calcula cuotas y términos sin necesidad de seleccionar cliente
      </Typography>

      {/* Formulario de Simulación */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <TextField
          label='Monto del Préstamo'
          value={amount}
          onChange={(e) => setAmount(formatAmount(e.target.value))}
          InputProps={{ startAdornment: '$' }}
          size='small'
          fullWidth
        />

        <TextField
          label='Cantidad de Cuotas'
          type='number'
          value={totalPayments}
          onChange={(e) => setTotalPayments(e.target.value)}
          size='small'
          fullWidth
        />

        <TextField
          label='Tasa de Interés (%)'
          type='number'
          value={baseInterestRate}
          onChange={(e) => setBaseInterestRate(e.target.value)}
          size='small'
          fullWidth
        />

        <FormControl
          size='small'
          fullWidth
        >
          <InputLabel>Frecuencia</InputLabel>
          <Select
            value={paymentFrequency}
            onChange={(e) =>
              setPaymentFrequency(
                e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY'
              )
            }
            label='Frecuencia'
          >
            <MenuItem value='DAILY'>Diario</MenuItem>
            <MenuItem value='WEEKLY'>Semanal</MenuItem>
            <MenuItem value='MONTHLY'>Mensual</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Resumen en tiempo real */}
      {amount && baseInterestRate && (
        <Box sx={{ 
          p: 2, 
          bgcolor: 'rgba(255,255,255,0.1)', 
          borderRadius: 2, 
          border: '1px solid rgba(255,255,255,0.2)',
          mb: 3
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#ffffff' }}>
            Resumen del Préstamo
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Monto base:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
              ${parseFloat(unformatAmount(amount) || '0').toLocaleString('es-AR')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Interés ({baseInterestRate}%):
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
              ${(parseFloat(unformatAmount(amount) || '0') * parseFloat(baseInterestRate || '0') / 100).toLocaleString('es-AR')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ffffff' }}>
              Total a prestar:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
              ${realtimeTotal.toLocaleString('es-AR')}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Botones */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          justifyContent: { xs: 'center', sm: 'flex-start' },
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant='outlined'
          onClick={handleSimulate}
          sx={{
            borderColor: 'rgba(255,255,255,0.85)',
            '&:hover': {
              borderColor: '#ffffff',
              backgroundColor: 'rgba(255,255,255,0.1)',
            },
          }}
          startIcon={<TrendingUp sx={{ color: '#ffffff' }} />}
          disabled={
            !amount ||
            !totalPayments ||
            parseFloat(unformatAmount(amount)) <= 0 ||
            parseInt(totalPayments) <= 0
          }
        >
          Simular
        </Button>
        {isCalculated && (
          <Button
            variant='outlined'
            onClick={handleClear}
          >
            Limpiar
          </Button>
        )}
      </Box>

      {/* Resultados */}
      {isCalculated && results.length > 0 && (
        <>
          <Divider sx={{ mb: 3 }} />

          {/* Resumen Financiero */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
              mb: 3,
            }}
          >
            <Alert
              severity='info'
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Box>
                <Typography variant='subtitle2'>Capital Prestado</Typography>
                <Typography variant='h6'>
                  ${totalPrincipal.toLocaleString()}
                </Typography>
              </Box>
            </Alert>

            <Alert
              severity='warning'
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Box>
                <Typography variant='subtitle2'>Intereses Generados</Typography>
                <Typography variant='h6'>
                  ${totalInterest.toLocaleString()}
                </Typography>
              </Box>
            </Alert>

            <Alert
              severity='success'
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Box>
                <Typography variant='subtitle2'>Total a Cobrar</Typography>
                <Typography variant='h6'>
                  ${totalWithInterest.toLocaleString()}
                </Typography>
              </Box>
            </Alert>
          </Box>

          {/* Tabla de Cuotas - Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table
                size='small'
                sx={{
                  '& th, & td': {
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '& thead th': { color: '#ffffff' },
                  '& tbody tr:nth-of-type(odd)': {
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Cuota #</strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>Capital</strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>Interés</strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align='center'>
                      <strong>Fecha Venc.</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((payment, index) => (
                    <TableRow
                      key={index}
                      sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}
                    >
                      <TableCell>#{payment.paymentNumber}</TableCell>
                      <TableCell align='right'>
                        ${payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell align='right'>
                        $
                        {(
                          payment.totalAmount - payment.amount
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell align='right'>
                        <Typography fontWeight='bold'>
                          ${payment.totalAmount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        {payment.dueDate.toLocaleDateString('es-AR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Cards Mobile */}
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              '& > *:not(:last-child)': { mb: 2 },
            }}
          >
            {results.slice(0, 5).map((payment, index) => (
              <Paper
                key={index}
                variant='outlined'
                sx={{ p: 2, bgcolor: 'background.paper' }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                    >
                      Cuota #{payment.paymentNumber}
                    </Typography>
                    <Typography
                      variant='body2'
                      fontWeight='bold'
                    >
                      ${payment.totalAmount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                    >
                      Fecha Vencimiento
                    </Typography>
                    <Typography variant='body2'>
                      {payment.dueDate.toLocaleDateString('es-AR')}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
            {results.length > 5 && (
              <Typography
                variant='caption'
                color='text.primary'
                sx={{ textAlign: 'center', display: 'block', mt: 2 }}
              >
                ... y {results.length - 5} cuotas más. Ver en desktop para tabla
                completa.
              </Typography>
            )}
          </Box>

          <Typography
            variant='caption'
            color='text.primary'
            sx={{ display: 'block', textAlign: 'center', mt: 2 }}
          >
            Simulación | Frecuencia: {getFrequencyLabel(paymentFrequency)} |
            Tasa: {baseInterestRate}%
          </Typography>
        </>
      )}
    </Paper>
  );
}
