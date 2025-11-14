'use client'

import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Box, 
  Typography, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { Close, TrendingUp, CalendarToday, Person } from '@mui/icons-material'

interface TodayCollectionsModalProps {
  open: boolean
  onClose: () => void
  data: {
    date: string
    total: number
    totalAmount: number
    collections: Array<{
      monto: number
      nombreUsuario: string
      emailUsuario: string
      descripcion: string
      fechaCobro: string
    }>
  } | null
}

export default function TodayCollectionsModal({ open, onClose, data }: TodayCollectionsModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!data) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Cobros Realizados Hoy
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <CalendarToday sx={{ fontSize: 14, opacity: 0.9 }} />
              <Typography variant="caption" sx={{ opacity: 0.9, textTransform: 'capitalize' }}>
                {formatDate(data.date)}
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ 
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
        {/* Summary Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
          gap: 2,
          mb: 3 
        }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              bgcolor: alpha(theme.palette.success.main, 0.08),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              borderRadius: 2
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Total Cobrado
            </Typography>
            <Typography variant="h4" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>
              {formatCurrency(data.totalAmount)}
            </Typography>
          </Paper>

          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              bgcolor: alpha(theme.palette.info.main, 0.08),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              borderRadius: 2
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Cantidad de Cobros
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {data.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.total === 1 ? 'cobro' : 'cobros'}
              </Typography>
            </Box>
          </Paper>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Collections Table */}
        {data.collections.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Detalle de Cobros
            </Typography>
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                    {!isMobile && (
                      <TableCell sx={{ fontWeight: 600 }}>Cobrador</TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                    {!isMobile && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Fecha/Hora</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.collections.map((collection, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.success.main, 0.02) 
                        },
                        '&:last-child td': { border: 0 }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {collection.descripcion}
                        </Typography>
                        {isMobile && (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {collection.nombreUsuario}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {formatDateTime(collection.fechaCobro)}
                            </Typography>
                          </>
                        )}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {collection.nombreUsuario}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {collection.emailUsuario}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          {formatCurrency(collection.monto)}
                        </Typography>
                      </TableCell>
                      {!isMobile && (
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(collection.fechaCobro)}
                          </Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No hay cobros registrados para hoy
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

