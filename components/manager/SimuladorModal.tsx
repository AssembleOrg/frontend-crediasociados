'use client'

import { Dialog, DialogTitle, DialogContent, IconButton, useTheme, useMediaQuery } from '@mui/material'
import { Close } from '@mui/icons-material'
import { StandaloneLoanSimulator } from '@/components/loans/StandaloneLoanSimulator'

interface SimuladorModalProps {
  open: boolean
  onClose: () => void
}

export default function SimuladorModal({ open, onClose }: SimuladorModalProps) {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
        Simulador de Préstamo
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <StandaloneLoanSimulator />
      </DialogContent>
    </Dialog>
  )
}
