'use client'

import { Box, Card, CardContent, Typography, Chip, Button } from '@mui/material'
import type { ClientSummary } from '@/lib/cobros/clientSummaryHelpers'
import { getUrgencyColor } from '@/lib/cobros/urgencyHelpers'

interface ClientSummaryCardProps {
  client: ClientSummary
  isNotified: boolean
  onViewDetails: () => void
  onToggleNotification: () => void
}

export default function ClientSummaryCard({ 
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
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          {/* Header with client name and urgency indicator */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={colors.primary}
              >
                {client.clientName}
              </Typography>
              {isNotified && (
                <Chip
                  label="✓ Notificado"
                  size="small"
                  sx={{
                    bgcolor: '#4caf50',
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 18,
                  }}
                />
              )}
            </Box>
            <Chip
              label={
                client.urgencyLevel === 'overdue'
                  ? `${client.stats.overdue} vencidas`
                  : client.urgencyLevel === 'today'
                  ? `${client.stats.today} hoy`
                  : client.urgencyLevel === 'soon'
                  ? `${client.stats.soon} pronto`
                  : 'Al día'
              }
              sx={{
                bgcolor: colors.primary,
                color: 'white',
                fontWeight: 'bold',
              }}
              size="small"
            />
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.5,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Progreso del préstamo
              </Typography>
              <Typography
                variant="caption"
                fontWeight="bold"
                color={colors.primary}
              >
                {client.stats.paid} de {client.stats.total} cuotas pagadas
              </Typography>
            </Box>
            <Box
              sx={{
                width: '100%',
                height: 8,
                bgcolor: '#e0e0e0',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${(client.stats.paid / client.stats.total) * 100}%`,
                  height: '100%',
                  bgcolor: colors.primary,
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>

          {/* Summary Stats */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 2,
            }}
          >
            {client.stats.overdue > 0 && (
              <Box>
                <Typography variant="caption" color="error.main">
                  Vencidas
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color="error.main"
                >
                  {client.stats.overdue}
                </Typography>
              </Box>
            )}
            {client.stats.today > 0 && (
              <Box>
                <Typography variant="caption" color="warning.main">
                  Vencen hoy
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color="warning.main"
                >
                  {client.stats.today}
                </Typography>
              </Box>
            )}
            {client.stats.soon > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: '#ffc107' }}>
                  Vencen pronto
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ color: '#ffc107' }}
                >
                  {client.stats.soon}
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total adeudado
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color={colors.primary}
              >
                ${(client.stats.totalAmount - client.stats.paidAmount).toLocaleString()}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mt: 1,
            }}
          >
            <Button
              variant="contained"
              sx={{
                flex: 1,
                bgcolor: colors.primary,
                '&:hover': { bgcolor: colors.primary, opacity: 0.9 },
              }}
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails()
              }}
            >
              Ver Timeline
            </Button>
            <Button
              variant={isNotified ? "contained" : "outlined"}
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onToggleNotification()
              }}
              sx={{
                minWidth: 'auto',
                px: 1,
                ...(isNotified ? {
                  bgcolor: '#4caf50',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#45a049'
                  }
                } : {
                  borderColor: colors.primary,
                  color: colors.primary,
                  '&:hover': {
                    borderColor: colors.primary,
                    bgcolor: `${colors.primary}20`
                  }
                })
              }}
            >
              {isNotified ? 'Notificado ✓' : 'Notificar'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}