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
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
} from '@mui/material';
import { Calculate, TrendingUp, KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import {
  formatAmount,
  unformatAmount,
  getFrequencyLabel,
} from '@/lib/formatters';
import {
  findRoundedInterestRateUp,
  findRoundedInterestRateDown,
  isNiceRoundNumber,
} from '@/lib/installment-rounding';
// Note: calculateLoanPayments function needs to be implemented in loan-calculator

interface SimulationResult {
  paymentNumber: number;
  amount: number;
  totalAmount: number;
  dueDate: Date;
}

export function StandaloneLoanSimulator() {
  const theme = useTheme();
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
        p: { xs: 2, sm: 3 },
        bgcolor: '#FFFFFF',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Calculate sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant='h6' fontWeight={600}>Simulador de Préstamos</Typography>
      </Box>

      <Typography
        variant='body2'
        color='text.secondary'
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
          gap: 2,
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
          label='N° de Cuotas'
          type='number'
          value={totalPayments}
          onChange={(e) => setTotalPayments(e.target.value)}
          size='small'
          fullWidth
        />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            label='Tasa (%)'
            type='number'
            value={baseInterestRate}
            onChange={(e) => setBaseInterestRate(e.target.value)}
            size='small'
            fullWidth
            sx={{
              '& input[type=number]::-webkit-inner-spin-button': { display: 'none' },
              '& input[type=number]::-webkit-outer-spin-button': { display: 'none' },
              '& input[type=number]': { MozAppearance: 'textfield' },
            }}
          />
          <Tooltip title='Redondear cuota hacia arriba'>
            <span>
              <IconButton
                size='small'
                onClick={() => {
                  if (amount && totalPayments && baseInterestRate) {
                    const result = findRoundedInterestRateUp({
                      baseAmount: parseFloat(unformatAmount(amount)),
                      totalPayments: parseInt(totalPayments),
                      currentInterestRate: parseFloat(baseInterestRate),
                    });
                    if (result) {
                      setBaseInterestRate(result.interestRate.toFixed(2));
                    }
                  }
                }}
                disabled={!amount || !totalPayments || !baseInterestRate}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                  },
                }}
              >
                <KeyboardArrowUp />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title='Redondear cuota hacia abajo'>
            <span>
              <IconButton
                size='small'
                onClick={() => {
                  if (amount && totalPayments && baseInterestRate) {
                    const result = findRoundedInterestRateDown({
                      baseAmount: parseFloat(unformatAmount(amount)),
                      totalPayments: parseInt(totalPayments),
                      currentInterestRate: parseFloat(baseInterestRate),
                    });
                    if (result) {
                      setBaseInterestRate(result.interestRate.toFixed(2));
                    }
                  }
                }}
                disabled={!amount || !totalPayments || !baseInterestRate}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                  },
                }}
              >
                <KeyboardArrowDown />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <FormControl size='small' fullWidth>
          <InputLabel>Frecuencia</InputLabel>
          <Select
            value={paymentFrequency}
            onChange={(e) => setPaymentFrequency(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
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
        <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.06), mb: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2 }}>
            Resumen del Préstamo
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box>
              <Typography variant='caption' color='text.secondary'>Monto base</Typography>
              <Typography variant='body2' fontWeight={500}>
                ${parseFloat(unformatAmount(amount) || '0').toLocaleString('es-AR')}
              </Typography>
            </Box>
            <Box>
              <Typography variant='caption' color='text.secondary'>Interés ({baseInterestRate}%)</Typography>
              <Typography variant='body2' fontWeight={500}>
                $
                {(
                  (parseFloat(unformatAmount(amount) || '0') *
                    parseFloat(baseInterestRate || '0')) /
                  100
                ).toLocaleString('es-AR')}
              </Typography>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant='caption' color='text.secondary'>Total a prestar</Typography>
              <Typography variant='h6' fontWeight={700} color='primary.main'>
                ${realtimeTotal.toLocaleString('es-AR')}
              </Typography>
            </Box>
            {totalPayments && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant='caption' color='text.secondary'>Valor por cuota</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant='body2'
                    fontWeight={700}
                    color={isNiceRoundNumber(realtimeTotal / parseInt(totalPayments)) ? 'success.main' : 'text.primary'}
                  >
                    ${(realtimeTotal / parseInt(totalPayments)).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  {isNiceRoundNumber(realtimeTotal / parseInt(totalPayments)) && (
                    <Typography variant='caption' color='success.main' fontWeight={600}>✓</Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Botones */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSimulate}
          startIcon={<TrendingUp />}
          disabled={!amount || !totalPayments || parseFloat(unformatAmount(amount)) <= 0 || parseInt(totalPayments) <= 0}
        >
          Simular
        </Button>
        {isCalculated && (
          <Button variant='outlined' onClick={handleClear}>
            Limpiar
          </Button>
        )}
      </Box>

      {/* Resultados */}
      {isCalculated && results.length > 0 && (
        <>
          <Divider sx={{ mb: 3 }} />

          {/* Resumen Financiero - Grouped List */}
          <Paper sx={{ mb: 3, bgcolor: '#F2F2F7', overflow: 'hidden' }}>
            <List disablePadding>
              <ListItem sx={{ py: 1.25, px: 2 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ color: 'primary.main', display: 'flex' }}>
                    <TrendingUp sx={{ fontSize: 20 }} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary='Capital Prestado'
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
                <Typography variant='body1' fontWeight={700} color='primary.main'>
                  ${totalPrincipal.toLocaleString()}
                </Typography>
              </ListItem>
              <Divider component='li' />
              <ListItem sx={{ py: 1.25, px: 2 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ color: 'warning.main', display: 'flex' }}>
                    <KeyboardArrowUp sx={{ fontSize: 20 }} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary='Intereses Generados'
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
                <Typography variant='body1' fontWeight={700} color='warning.main'>
                  ${totalInterest.toLocaleString()}
                </Typography>
              </ListItem>
              <Divider component='li' />
              <ListItem sx={{ py: 1.25, px: 2 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ color: 'success.main', display: 'flex' }}>
                    <TrendingUp sx={{ fontSize: 20 }} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary='Total a Cobrar'
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
                <Typography variant='body1' fontWeight={700} color='success.main'>
                  ${totalWithInterest.toLocaleString()}
                </Typography>
              </ListItem>
            </List>
          </Paper>

          {/* Tabla de Cuotas - Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper}>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Cuota #</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600 }}>Capital</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600 }}>Interés</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600 }}>Total</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>Fecha Venc.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((payment, index) => (
                    <TableRow key={index} hover>
                      <TableCell>#{payment.paymentNumber}</TableCell>
                      <TableCell align='right'>${payment.amount.toLocaleString()}</TableCell>
                      <TableCell align='right'>${(payment.totalAmount - payment.amount).toLocaleString()}</TableCell>
                      <TableCell align='right'>
                        <Typography fontWeight={600}>${payment.totalAmount.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell align='center'>{payment.dueDate.toLocaleDateString('es-AR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Cards Mobile */}
          <Box sx={{ display: { xs: 'flex', flexDirection: 'column', gap: 1.5, md: 'none' } }}>
            {results.map((payment, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  borderLeft: 3,
                  borderLeftColor: 'primary.main',
                }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      Cuota #{payment.paymentNumber}
                    </Typography>
                    <Typography variant='body2' fontWeight={600}>
                      ${payment.totalAmount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      Fecha Venc.
                    </Typography>
                    <Typography variant='body2'>
                      {payment.dueDate.toLocaleDateString('es-AR')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      Capital
                    </Typography>
                    <Typography variant='body2' fontWeight={500}>
                      ${payment.amount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      Interés
                    </Typography>
                    <Typography variant='body2' fontWeight={500}>
                      ${(payment.totalAmount - payment.amount).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
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
