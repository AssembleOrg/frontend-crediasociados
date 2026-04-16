'use client'

import { memo } from 'react'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Chip,
  keyframes,
  alpha,
} from '@mui/material'
import { AccessTime, Warning } from '@mui/icons-material'

import type { ClientSummary } from '@/lib/cobros/clientSummaryHelpers'
import { getUrgencyColor } from '@/lib/cobros/urgencyHelpers'
import { StatusChip } from '@/components/ui/StatusChip'
import { iosColors } from '@/lib/theme'

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); }
`

const fmt = (amount: number) =>
  `$${new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`;

interface ClientSummaryCardProps {
  client: ClientSummary
  isNotified: boolean
  onViewDetails: () => void
  onToggleNotification: () => void
}

const ClientSummaryCard = memo(function ClientSummaryCard({
  client,
  isNotified,
  onViewDetails,
}: ClientSummaryCardProps) {
  const colors    = getUrgencyColor(client.urgencyLevel)
  const isOverdue = client.urgencyLevel === 'overdue' || client.urgencyLevel === 'OVERDUE'
  const isToday   = client.urgencyLevel === 'today'   || client.urgencyLevel === 'TODAY'
  const isSoon    = client.urgencyLevel === 'soon'    || client.urgencyLevel === 'SOON'

  const pendingAmount = client.stats.totalAmount - client.stats.paidAmount
  const overdueCount  = client.stats.overdue ?? 0
  const progressPct   = client.stats.total > 0
    ? (client.stats.paid / client.stats.total) * 100
    : 0

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border:       `0.5px solid ${isOverdue ? iosColors.red : iosColors.gray4}`,
        borderLeft:   `4px solid ${colors.border}`,
        bgcolor:      isOverdue
          ? alpha(iosColors.red, 0.03)
          : isToday
          ? alpha(iosColors.orange, 0.03)
          : 'background.paper',
        transition:   'box-shadow 0.2s ease',
        '&:hover':    { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
      }}
    >
      <CardActionArea onClick={onViewDetails} sx={{ '&:active': { opacity: 0.7 } }}>
        <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, '&:last-child': { pb: 1.5 } }}>

          {/* ── Row 1: Name + urgency badge ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
            <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                fontSize="0.9375rem"
                noWrap
                sx={{ color: 'text.primary' }}
              >
                {client.clientName}
                {isNotified && (
                  <Chip
                    label="✓"
                    size="small"
                    sx={{ ml: 0.5, bgcolor: iosColors.green, color: 'white', height: 16, fontSize: '0.6rem' }}
                  />
                )}
              </Typography>

              {/* Overdue debt summary below name */}
              {overdueCount > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <Warning sx={{ fontSize: 12, color: iosColors.red }} />
                  <Typography variant="caption" sx={{ color: iosColors.red, fontWeight: 700 }}>
                    {overdueCount} cuota{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Urgency chip */}
            {isOverdue ? (
              <Chip
                icon={<Warning sx={{ fontSize: 13, color: 'inherit !important' }} />}
                label={`${overdueCount} vencidas`}
                size="small"
                sx={{
                  bgcolor:   iosColors.red,
                  color:     'white',
                  fontWeight: 700,
                  height:    26,
                  fontSize:  '0.72rem',
                  animation: `${pulse} 2s ease-in-out infinite`,
                  boxShadow: `0 0 8px ${alpha(iosColors.red, 0.4)}`,
                }}
              />
            ) : isToday ? (
              <Chip
                label={`${client.stats.today} hoy`}
                size="small"
                sx={{ bgcolor: iosColors.orange, color: 'white', fontWeight: 700, height: 26, fontSize: '0.72rem' }}
              />
            ) : isSoon ? (
              <Chip
                icon={<AccessTime sx={{ fontSize: 13, color: 'inherit !important' }} />}
                label={`${client.stats.soon} pronto`}
                size="small"
                sx={{
                  bgcolor:   iosColors.yellow,
                  color:     '#333',
                  fontWeight: 700,
                  height:    26,
                  fontSize:  '0.72rem',
                  animation: `${pulse} 2.5s ease-in-out infinite`,
                }}
              />
            ) : (
              <StatusChip status="PAID" size="small" />
            )}
          </Box>

          {/* ── Row 2: Progress bar + stats ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
            {/* Progress track */}
            <Box sx={{ flex: 1, height: 5, bgcolor: iosColors.gray5, borderRadius: 3, overflow: 'hidden' }}>
              <Box
                sx={{
                  width:        `${progressPct}%`,
                  height:       '100%',
                  bgcolor:      isOverdue ? iosColors.red : isToday ? iosColors.orange : iosColors.green,
                  borderRadius: 3,
                  transition:   'width 0.3s ease',
                }}
              />
            </Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {client.stats.paid}/{client.stats.total}
            </Typography>
          </Box>

          {/* ── Row 3: Pending amount ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Pendiente total
            </Typography>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ color: isOverdue ? iosColors.red : 'text.primary', fontSize: '0.9375rem' }}
            >
              {fmt(pendingAmount)}
            </Typography>
          </Box>

        </CardContent>
      </CardActionArea>
    </Card>
  )
})

export default ClientSummaryCard
