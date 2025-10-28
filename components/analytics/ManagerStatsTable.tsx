'use client'

import { memo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar
} from '@mui/material'
import { Person, AccountBalance, Schedule } from '@mui/icons-material'
import { formatAmount } from '@/lib/formatters'
import type { ManagerAnalytics } from '@/services/analytics.service'

interface ManagerStatsTableProps {
  managers: ManagerAnalytics[]
  isLoading?: boolean
}

const ManagerStatsTable = memo(function ManagerStatsTable({ managers, isLoading = false }: ManagerStatsTableProps) {
  // Collection rate removed per client request

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cargando datos de managers...
        </Typography>
      </Paper>
    )
  }

  if (managers.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No hay managers registrados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Los managers que crees aparecerán aquí con sus métricas.
        </Typography>
      </Paper>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Manager</TableCell>
                <TableCell align="center">Clientes</TableCell>
                <TableCell align="center">Préstamos</TableCell>
                <TableCell align="right">Dinero Prestado</TableCell>
                <TableCell align="right">Por Cobrar</TableCell>
                <TableCell align="center">Desde</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {managers.map((manager) => (
                <TableRow key={manager.managerId} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {manager.managerName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {manager.managerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {manager.managerEmail}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight={600}>
                        {manager.totalClients}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <AccountBalance sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight={600}>
                        {manager.totalLoans}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      ${formatAmount(manager.totalAmountLent.toString())}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={manager.totalAmountPending > 0 ? 'warning.main' : 'text.secondary'}
                    >
                      ${formatAmount(manager.totalAmountPending.toString())}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption" color="text.secondary">
                      {new Date(manager.createdAt).toLocaleDateString('es-AR')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {managers.map((manager) => (
            <Card key={manager.managerId} elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {manager.managerName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {manager.managerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {manager.managerEmail}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Clientes
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      {manager.totalClients}
                    </Typography>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <AccountBalance sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Préstamos
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      {manager.totalLoans}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Dinero Prestado
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      ${formatAmount(manager.totalAmountLent.toString())}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Por Cobrar
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={manager.totalAmountPending > 0 ? 'warning.main' : 'text.secondary'}
                    >
                      ${formatAmount(manager.totalAmountPending.toString())}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Manager desde {new Date(manager.createdAt).toLocaleDateString('es-AR')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </>
  )
})

export default ManagerStatsTable