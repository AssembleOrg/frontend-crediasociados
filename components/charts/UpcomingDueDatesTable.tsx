'use client'

import React from 'react'
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box
} from '@mui/material'
import { Warning, Schedule } from '@mui/icons-material'
import type { LoanChartDataDto } from '@/services/manager.service'

interface UpcomingDueDatesTableProps {
  data: LoanChartDataDto[]
  isLoading?: boolean
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getDaysUntilDue = (dateString: string) => {
  const dueDate = new Date(dateString)
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const getUrgencyColor = (days: number) => {
  if (days <= 1) return 'error'
  if (days <= 3) return 'warning'
  return 'info'
}

export default function UpcomingDueDatesTable({ data, isLoading = false }: UpcomingDueDatesTableProps) {
  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Próximos Vencimientos
        </Typography>
        <Box sx={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando vencimientos...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Schedule color="action" />
          <Typography variant="h6">
            Próximos Vencimientos
          </Typography>
        </Box>
        <Box sx={{
          height: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          No hay vencimientos en los próximos 7 días
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Warning color={data.length > 0 ? 'warning' : 'action'} />
        <Typography variant="h6">
          Próximos Vencimientos ({data.length})
        </Typography>
      </Box>

      <TableContainer sx={{ maxHeight: 300 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Monto Pendiente</TableCell>
              <TableCell>Fecha Venc.</TableCell>
              <TableCell>Urgencia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((loan) => {
              const daysUntilDue = getDaysUntilDue(loan.nextDueDate || '')
              return (
                <TableRow
                  key={loan.id}
                  hover
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {loan.client?.fullName || 'Cliente N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {loan.loanTrack}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      ${loan.remainingAmount?.toLocaleString()} {loan.currency}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(loan.nextDueDate || '')}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      color={getUrgencyColor(daysUntilDue)}
                      label={
                        daysUntilDue === 0
                          ? 'Hoy'
                          : daysUntilDue === 1
                          ? 'Mañana'
                          : daysUntilDue < 0
                          ? 'Vencido'
                          : `${daysUntilDue} días`
                      }
                      variant={daysUntilDue <= 1 ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {data.length > 5 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Mostrando los próximos {data.length} vencimientos
          </Typography>
        </Box>
      )}
    </Paper>
  )
}