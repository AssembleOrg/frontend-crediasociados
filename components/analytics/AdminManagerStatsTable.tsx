'use client'

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
import { Person, AccountBalance } from '@mui/icons-material'
import type { ManagerAnalytics } from '@/services/analytics.service'

interface AdminManagerStatsTableProps {
  managers: ManagerAnalytics[]
  isLoading?: boolean
}

export default function AdminManagerStatsTable({ managers, isLoading = false }: AdminManagerStatsTableProps) {

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cargando datos de cobradores...
        </Typography>
      </Paper>
    )
  }

  if (managers.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No hay cobradores registrados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Los cobradores que se creen aparecerán aquí con métricas operativas.
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
                <TableCell>Cobrador</TableCell>
                <TableCell align="center">Clientes</TableCell>
                <TableCell align="center">Préstamos</TableCell>
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
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Clientes
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {manager.totalClients}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Préstamos
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {manager.totalLoans}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Desde
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(manager.createdAt).toLocaleDateString('es-AR')}
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
}