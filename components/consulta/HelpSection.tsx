'use client'

import {
  Alert,
  Typography
} from '@mui/material'

export default function HelpSection() {
  return (
    <Alert severity="info" sx={{ mt: 4 }}>
      <Typography variant="subtitle2" gutterBottom>
        ¿No tienes tu código de seguimiento?
      </Typography>
      <Typography variant="body2">
        El código de seguimiento te fue proporcionado al momento de generar el préstamo.
        Si no lo tienes, contacta con tu cobrador para obtenerlo.
      </Typography>
    </Alert>
  )
}