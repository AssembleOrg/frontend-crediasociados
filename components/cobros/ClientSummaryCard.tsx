'use client'

import { memo } from 'react'
import { Box, Card, CardContent, Typography, Chip, Button, keyframes } from '@mui/material'
import { AccessTime } from '@mui/icons-material'

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
`
import type { ClientSummary } from '@/lib/cobros/clientSummaryHelpers'
import { getUrgencyColor } from '@/lib/cobros/urgencyHelpers'

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
  onToggleNotification 
}: ClientSummaryCardProps) {
  const colors = getUrgencyColor(client.urgencyLevel)

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: colors.bg,
        borderLeft: `6px solid ${colors.border}`,
        '&:hover': {
          transform: 'scale(1.01)',
          boxShadow: 3,
        },
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
      }}
      onClick={onViewDetails}
    >
      <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Name + urgency chip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="subtitle2" fontWeight={600} color={colors.primary} noWrap sx={{ flex: 1, mr: 1 }}>
            {client.clientName}
            {isNotified && <Chip label="✓" size="small" sx={{ ml: 0.5, bgcolor: '#4caf50', color: 'white', height: 16, fontSize: '0.6rem' }} />}
          </Typography>
          {(() => {
            const isSoon = client.urgencyLevel === 'soon' || client.urgencyLevel === 'SOON'
            const label = client.urgencyLevel === 'overdue' || client.urgencyLevel === 'OVERDUE'
              ? `${client.stats.overdue} vencidas`
              : client.urgencyLevel === 'today' || client.urgencyLevel === 'TODAY'
              ? `${client.stats.today} hoy`
              : isSoon
              ? `${client.stats.soon} pronto`
              : 'Al dia'
            return (
              <Chip
                icon={isSoon ? <AccessTime sx={{ fontSize: 14, color: 'inherit !important' }} /> : undefined}
                label={label}
                size="small"
                sx={{
                  bgcolor: isSoon ? '#ff6f00' : colors.primary,
                  color: 'white',
                  fontWeight: 700,
                  height: 24,
                  fontSize: '0.72rem',
                  ...(isSoon && {
                    animation: `${pulse} 2s ease-in-out infinite`,
                    boxShadow: '0 0 8px rgba(255, 111, 0, 0.4)',
                  }),
                }}
              />
            )
          })()}
        </Box>

        {/* Progress + debt in one row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ width: '100%', height: 6, bgcolor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ width: `${(client.stats.paid / client.stats.total) * 100}%`, height: '100%', bgcolor: colors.primary }} />
            </Box>
          </Box>
          <Typography variant="caption" fontWeight={600} color={colors.primary} sx={{ whiteSpace: 'nowrap' }}>
            {client.stats.paid}/{client.stats.total}
          </Typography>
          <Typography variant="caption" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
            ${(client.stats.totalAmount - client.stats.paidAmount).toLocaleString()}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.75, borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
          <Button
            variant="contained"
            size="small"
            sx={{ flex: 1, bgcolor: colors.primary, '&:hover': { bgcolor: colors.primary, opacity: 0.9 }, textTransform: 'none', fontSize: '0.8rem' }}
            onClick={(e) => { e.stopPropagation(); onViewDetails() }}
          >
            Ver Timeline
          </Button>
          <Button
            variant={isNotified ? "contained" : "outlined"}
            size="small"
            onClick={(e) => { e.stopPropagation(); onToggleNotification() }}
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              minWidth: 'auto',
              px: 1.5,
              ...(isNotified
                ? { bgcolor: '#4caf50', color: 'white', '&:hover': { bgcolor: '#45a049' } }
                : { borderColor: colors.primary, color: colors.primary })
            }}
          >
            {isNotified ? '✓' : 'Notificar'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
})

export default ClientSummaryCard