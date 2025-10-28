'use client'

import { Box, Typography } from '@mui/material'

export default function UrgencyLegend() {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap',
      gap: 2, 
      mb: 3, 
      p: 2, 
      bgcolor: 'grey.50', 
      borderRadius: 1,
      border: 1,
      borderColor: 'grey.200'
    }}>
      <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>
        Código de colores:
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: 0.5 }} />
        <Typography variant="caption">Vencido</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: 0.5 }} />
        <Typography variant="caption">Vence hoy</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 12, height: 12, bgcolor: '#ffc107', borderRadius: 0.5 }} />
        <Typography variant="caption">Vence pronto (1-2 días)</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 12, height: 12, bgcolor: 'transparent', border: 1, borderColor: 'grey.300', borderRadius: 0.5 }} />
        <Typography variant="caption">Futuro (+3 días)</Typography>
      </Box>
    </Box>
  )
}