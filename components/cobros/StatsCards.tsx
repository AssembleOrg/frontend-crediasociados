'use client'

import { Box, Card, CardContent, Typography } from '@mui/material'
import { CalendarToday, AttachMoney, CheckCircle, Warning } from '@mui/icons-material'

// Type guard to check if stats is filtered stats or legacy stats
interface FilteredStats {
  total: number
  totalAmount: number
  byStatus: {
    overdue: number
    today: number
    soon: number
    upcoming: number
    paid: number
  }
  notifiedCount: number
}

interface LegacyStats {
  total: number
  completed: number
  partial: number
  pending: number
  overdue: number
  canceled: number
  totalExpected: number
  totalCollected: number
}

function isFilteredStats(stats: FilteredStats | LegacyStats): stats is FilteredStats {
  return 'byStatus' in stats && 'notifiedCount' in stats
}

interface StatsCardsProps {
  displayStats: FilteredStats | LegacyStats
  hasActiveFilters: boolean
}

export default function StatsCards({ displayStats, hasActiveFilters }: StatsCardsProps) {
  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 3,
      mb: 4
    }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarToday color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Total Programado
            </Typography>
          </Box>
          <Typography variant="h4" color="primary.main">
            {displayStats.total}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {hasActiveFilters ? 'cuotas filtradas' : 'cobros del día'}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AttachMoney color="success" sx={{ mr: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              {hasActiveFilters ? 'Monto Filtrado' : 'Recaudado'}
            </Typography>
          </Box>
          <Typography variant="h4" color="success.main">
            ${(isFilteredStats(displayStats) ? displayStats.totalAmount : displayStats.totalCollected).toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {!isFilteredStats(displayStats) && `de $${displayStats.totalExpected.toLocaleString()}`}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CheckCircle color="success" sx={{ mr: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              {hasActiveFilters ? 'Pagadas' : 'Completados'}
            </Typography>
          </Box>
          <Typography variant="h4" color="success.main">
            {isFilteredStats(displayStats) ? displayStats.byStatus.paid : displayStats.completed}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {!isFilteredStats(displayStats) && `+ ${displayStats.partial} parciales`}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Warning color="error" sx={{ mr: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              {hasActiveFilters ? 'Vencidas' : 'Pendientes'}
            </Typography>
          </Box>
          <Typography variant="h4" color="error.main">
            {isFilteredStats(displayStats) ? displayStats.byStatus.overdue : displayStats.pending}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            sin cobrar
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}