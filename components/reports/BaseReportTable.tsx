'use client'

import React from 'react'
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
  Chip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack
} from '@mui/material'
import type { UserReportData } from '@/services/reports.service'

interface BaseReportTableProps {
  users: UserReportData[]
  userTypeLabel: string // "Subadmin" or "Prestamista"
  isLoading?: boolean
  emptyMessage?: string
}

/**
 * Base Report Table Component
 * Responsive table for displaying user report data
 * Shows table on desktop, cards on mobile
 */
export default function BaseReportTable({
  users,
  userTypeLabel,
  isLoading = false,
  emptyMessage = `No hay ${userTypeLabel.toLowerCase()}s para mostrar`
}: BaseReportTableProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 90) return 'success'
    if (rate >= 70) return 'warning'
    return 'error'
  }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Cargando datos...
        </Typography>
      </Paper>
    )
  }

  if (users.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    )
  }

  // Mobile view - Cards
  if (isMobile) {
    return (
      <Stack spacing={2}>
        {users.map((user) => (
          <Card elevation={1} key={user.userId}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {user.userName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.userEmail}
                </Typography>
                <Chip
                  label={user.userRole}
                  size="small"
                  color="primary"
                  sx={{ mb: 2 }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Clientes
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {user.totalClients}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Préstamos
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {user.totalLoans}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Monto Prestado
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="success.main">
                  {formatCurrency(user.totalAmountLent)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Tasa de Cobro
                  </Typography>
                  <Chip
                    label={`${user.collectionRate.toFixed(1)}%`}
                    size="small"
                    color={getCollectionRateColor(user.collectionRate)}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Desde: {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    )
  }

  // Desktop view - Table
  return (
    <TableContainer component={Paper} elevation={1}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>{userTypeLabel}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Clientes</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Préstamos</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Monto Prestado</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tasa Cobro</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Desde</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.userId}
              sx={{
                '&:hover': { bgcolor: 'grey.50' },
                '&:last-child td, &:last-child th': { border: 0 }
              }}
            >
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {user.userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.userEmail}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="bold">
                  {user.totalClients}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="bold">
                  {user.totalLoans}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {formatCurrency(user.totalAmountLent)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={`${user.collectionRate.toFixed(1)}%`}
                  size="small"
                  color={getCollectionRateColor(user.collectionRate)}
                />
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption" color="text.secondary">
                  {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}