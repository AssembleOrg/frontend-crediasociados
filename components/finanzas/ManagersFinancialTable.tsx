'use client';

import React, { memo } from 'react';
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
  Chip,
} from '@mui/material';
import { Person, TrendingUp } from '@mui/icons-material';
import type { ManagerFinancialData } from '@/types/finanzas';

interface ManagersFinancialTableProps {
  managers: ManagerFinancialData[];
  isLoading?: boolean;
}

const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('es-AR')}`;
};

const ManagersFinancialTable = memo(function ManagersFinancialTable({
  managers,
  isLoading = false,
}: ManagersFinancialTableProps) {
  if (isLoading) {
    return (
      <Paper
        elevation={1}
        sx={{ p: 3 }}
      >
        <Typography
          variant='h6'
          gutterBottom
        >
          Métricas Financieras por Cobrador
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          Cargando datos financieros...
        </Box>
      </Paper>
    );
  }

  if (!managers.length) {
    return (
      <Paper
        elevation={1}
        sx={{ p: 3 }}
      >
        <Typography
          variant='h6'
          gutterBottom
        >
          Métricas Financieras por Cobrador
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          No hay Cobradores registrados
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{ p: 3 }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant='h6'
          gutterBottom
        >
          Métricas Financieras por cobradores
        </Typography>
        <Typography
          variant='body2'
          color='text.secondary'
        >
          {managers.length}{' '}
          {managers.length === 1 ? 'cobrador' : 'cobradores'} bajo tu
          gestión
        </Typography>
      </Box>

      {/* Desktop Table */}
      <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Cobrador</TableCell>
              <TableCell
                align='right'
                sx={{ fontWeight: 'bold' }}
              >
                Capital Asignado
              </TableCell>
              <TableCell
                align='right'
                sx={{ fontWeight: 'bold' }}
              >
                Disponible
              </TableCell>
              <TableCell
                align='right'
                sx={{ fontWeight: 'bold' }}
              >
                Prestado
              </TableCell>
              <TableCell
                align='right'
                sx={{ fontWeight: 'bold' }}
              >
                Gastos
              </TableCell>
              <TableCell
                align='right'
                sx={{ fontWeight: 'bold' }}
              >
                Valor Cartera
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {managers.map((manager) => (
              <TableRow
                key={manager.managerId}
                hover
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person
                      fontSize='small'
                      color='primary'
                    />
                    <Box>
                      <Typography
                        variant='body2'
                        fontWeight={500}
                      >
                        {manager.managerName}
                      </Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                      >
                        {manager.managerEmail}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align='right'>
                  <Typography
                    variant='body2'
                    color='primary.main'
                    fontWeight={600}
                  >
                    {formatCurrency(manager.capitalAsignado)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Typography
                    variant='body2'
                    color='success.main'
                    fontWeight={600}
                  >
                    {formatCurrency(manager.capitalDisponible)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Typography variant='body2'>
                    {formatCurrency(manager.prestadoActivo)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Typography
                    variant='body2'
                    color='error.main'
                  >
                    {formatCurrency(manager.gastos)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Chip
                    icon={<TrendingUp />}
                    label={formatCurrency(manager.valorCartera)}
                    color='primary'
                    size='small'
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Cards */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {managers.map((manager) => (
          <Card
            key={manager.managerId}
            variant='outlined'
          >
            <CardContent>
              {/* Header */}
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <Person color='primary' />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant='body1'
                    fontWeight={600}
                  >
                    {manager.managerName}
                  </Typography>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    {manager.managerEmail}
                  </Typography>
                </Box>
              </Box>

              {/* Metrics Grid */}
              <Box
                sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
              >
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    Capital Asignado
                  </Typography>
                  <Typography
                    variant='body1'
                    fontWeight={600}
                    color='primary.main'
                  >
                    {formatCurrency(manager.capitalAsignado)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    Disponible
                  </Typography>
                  <Typography
                    variant='body1'
                    fontWeight={600}
                    color='success.main'
                  >
                    {formatCurrency(manager.capitalDisponible)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    Prestado
                  </Typography>
                  <Typography
                    variant='body1'
                    fontWeight={600}
                  >
                    {formatCurrency(manager.prestadoActivo)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    Gastos
                  </Typography>
                  <Typography
                    variant='body1'
                    fontWeight={600}
                    color='error.main'
                  >
                    {formatCurrency(manager.gastos)}
                  </Typography>
                </Box>
              </Box>

              {/* Valor Cartera */}
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography
                    variant='body2'
                    color='text.secondary'
                  >
                    Valor de Cartera
                  </Typography>
                  <Chip
                    icon={<TrendingUp />}
                    label={formatCurrency(manager.valorCartera)}
                    color='primary'
                    size='small'
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Paper>
  );
});

export default ManagersFinancialTable;
