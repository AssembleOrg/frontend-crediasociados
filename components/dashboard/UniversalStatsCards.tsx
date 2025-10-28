'use client'

import { Box, Card, CardContent, Typography } from '@mui/material'
import { 
  AttachMoney, 
  Warning,
  AccountBalance,
  TrendingUp,
  MonetizationOn
} from '@mui/icons-material'

// Cobros stats interfaces (from existing cobros StatsCards)
interface CobrosFilteredStats {
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

interface CobrosLegacyStats {
  total: number
  completed: number
  partial: number
  pending: number
  overdue: number
  canceled: number
  totalExpected: number
  totalCollected: number
}

// Loans stats interface
interface LoansStats {
  total: number
  totalAmount: number
  avgAmount: number
  byStatus: {
    active: number
    completed: number
    pending: number
    approved: number
    cancelled?: number
    overdue?: number
  }
}

type StatsData = CobrosFilteredStats | CobrosLegacyStats | LoansStats

// Type guards
function isCobrosFilteredStats(stats: StatsData): stats is CobrosFilteredStats {
  return 'byStatus' in stats && 'notifiedCount' in stats
}

function isCobrosLegacyStats(stats: StatsData): stats is CobrosLegacyStats {
  return 'completed' in stats && 'totalExpected' in stats && !('avgAmount' in stats)
}

function isLoansStats(stats: StatsData): stats is LoansStats {
  return 'avgAmount' in stats && 'byStatus' in stats
}

interface UniversalStatsCardsProps {
  displayStats: StatsData
  hasActiveFilters?: boolean
  type: 'cobros' | 'loans'
}

export default function UniversalStatsCards({ 
  displayStats, 
  hasActiveFilters = false, 
  type 
}: UniversalStatsCardsProps) {
  
  if (type === 'cobros') {
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
              <AccountBalance color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Valor de la cartera
              </Typography>
            </Box>
            <Typography variant="h4" color="primary.main">
              ${(isCobrosFilteredStats(displayStats) 
                ? displayStats.totalAmount 
                : isCobrosLegacyStats(displayStats) 
                ? displayStats.totalExpected
                : 0
              ).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              monto total prestado con intereses
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AttachMoney color="success" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Monto recaudado
              </Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              ${(isCobrosFilteredStats(displayStats) 
                ? displayStats.totalAmount 
                : isCobrosLegacyStats(displayStats) 
                ? displayStats.totalCollected
                : 0
              ).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              valor total de cuotas pagadas
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
              {isCobrosFilteredStats(displayStats) 
                ? displayStats.byStatus.overdue 
                : isCobrosLegacyStats(displayStats) 
                ? displayStats.pending 
                : 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              sin cobrar
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Loans type
  if (isLoansStats(displayStats)) {
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
              <AccountBalance color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                {hasActiveFilters ? 'Préstamos Filtrados' : 'Total Préstamos'}
              </Typography>
            </Box>
            <Typography variant="h4" color="primary.main">
              {displayStats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ${displayStats.totalAmount.toLocaleString()} prestados
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUp color="success" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Préstamos Activos
              </Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {displayStats.byStatus.active}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              en proceso de pago
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MonetizationOn color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Préstamo Promedio
              </Typography>
            </Box>
            <Typography variant="h4" color="primary.main">
              ${Math.round(displayStats.avgAmount).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              monto promedio por préstamo
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return null
}