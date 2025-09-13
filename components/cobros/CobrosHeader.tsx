'use client'

import { Box, Typography, Button, TextField, Chip } from '@mui/material'
import { Warning, Lock } from '@mui/icons-material'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

interface CobrosHeaderProps {
  overduePayments: SubLoanWithClientInfo[]
  selectedDate: string
  dayLocked: boolean
  onOverdueClick: () => void
  onDateChange: (date: string) => void
  onLockDay: () => void
}

export default function CobrosHeader({
  overduePayments,
  selectedDate,
  dayLocked,
  onOverdueClick,
  onDateChange,
  onLockDay
}: CobrosHeaderProps) {
  return (
    <Box
      sx={{
        mb: 4,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
        gap: { xs: 3, sm: 2 },
        alignItems: { xs: 'stretch', md: 'center' },
      }}
    >
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestión de Cobros
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Todas las cuotas con énfasis en las que están cerca de vencer, vencen hoy o ya vencieron
        </Typography>
      </Box>
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'auto auto auto auto',
            md: 'auto auto auto auto',
          },
          gap: { xs: 2, sm: 1.5, md: 2 },
          alignItems: 'center',
          justifyItems: { xs: 'stretch', sm: 'end' },
          justifyContent: { sm: 'end' },
          width: { sm: 'auto' },
          minWidth: { sm: 'min-content' },
        }}
      >
        {overduePayments.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Warning />}
            onClick={onOverdueClick}
            size="small"
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 'max-content' },
              whiteSpace: 'nowrap',
            }}
          >
            Fuera de Término ({overduePayments.length})
          </Button>
        )}
        
        <TextField
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          size="small"
          disabled={dayLocked}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            minWidth: { sm: '120px' },
          }}
        />
        
        {dayLocked ? (
          <Chip
            icon={<Lock />}
            label="Día Cerrado"
            color="success"
            variant="filled"
            sx={{ justifySelf: { xs: 'center', sm: 'auto' } }}
          />
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Lock />}
            onClick={onLockDay}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 'max-content' },
              whiteSpace: 'nowrap',
            }}
          >
            Cerrar Día
          </Button>
        )}
      </Box>
    </Box>
  )
}