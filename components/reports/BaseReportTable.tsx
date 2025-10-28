'use client'

import React, { memo } from 'react'
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
  hideAmounts?: boolean
  showManagers?: boolean // For admin view: show managers count instead of just clients
}

/**
 * Base Report Table Component
 * Responsive table for displaying user report data
 * Shows table on desktop, cards on mobile
 */
const BaseReportTable = memo(function BaseReportTable({
  users,
  userTypeLabel,
  isLoading = false,
  emptyMessage = `No hay ${userTypeLabel.toLowerCase()}s para mostrar`,
  hideAmounts = false,
  showManagers = false
}: BaseReportTableProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  // Collection rate removed per client request (feedback)

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
                {showManagers && user.totalManagers !== undefined ? (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Prestamistas
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {user.totalManagers}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Clientes
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {user.totalClients}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </Box>

              {!hideAmounts && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Monto Prestado
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    {formatCurrency(user.totalAmountLent)}
                  </Typography>
                </Box>
              )}

              <Box>
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
            {showManagers && (
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Prestamistas</TableCell>
            )}
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Clientes</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Préstamos</TableCell>
            {!hideAmounts && <TableCell align="right" sx={{ fontWeight: 'bold' }}>Monto Prestado</TableCell>}
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
              {showManagers && (
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="bold">
                    {user.totalManagers || 0}
                  </Typography>
                </TableCell>
              )}
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
              {!hideAmounts && (
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(user.totalAmountLent)}
                  </Typography>
                </TableCell>
              )}
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
})

export default BaseReportTable