'use client'

import React from 'react'
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { Close, TrendingUp, CalendarToday, AccountBalance, Percent } from '@mui/icons-material'

interface TodayLoansModalProps {
  open: boolean
  onClose: () => void
  data: {
    date: string
    total: number
    totalAmount: number
    loans: Array<{
      montoTotalPrestado: number
      montoTotalADevolver: number
      nombrecliente: string
    }>
  } | null
}

export default function TodayLoansModal({ open, onClose, data }: TodayLoansModalProps) {
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

  if (!data) return null

  // Use totalAmount from backend directly - no calculations needed
  const totalPrestado = data.totalAmount
  const totalADevolver = data.loans.reduce((sum, loan) => sum + loan.montoTotalADevolver, 0)
  const totalIntereses = totalADevolver - totalPrestado

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: { xs: 'calc(100dvh - 96px)', sm: '90vh' },
          m: { xs: 1, sm: 2 },
          mt: { xs: 'auto', sm: 2 },
          width: { xs: '100%', sm: 'auto' },
        }
      }}
    >
      <DialogTitle sx={{
        pb: 2, pt: 3, px: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp sx={{ fontSize: 24, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Préstamos Otorgados Hoy
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {formatDate(data.date)}
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
        {/* Resumen */}
        <Paper sx={{ mb: 3, mt: 2, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
          <List disablePadding>
            {[
              { icon: <AccountBalance sx={{ fontSize: 20 }} />, label: 'Total Prestado', value: formatCurrency(totalPrestado), color: 'primary.main' },
              { icon: <TrendingUp sx={{ fontSize: 20 }} />, label: 'Total a Devolver', value: formatCurrency(totalADevolver), color: 'success.main' },
              { icon: <Percent sx={{ fontSize: 20 }} />, label: 'Interés Total', value: formatCurrency(totalIntereses), color: 'warning.main' },
            ].map((item, i, arr) => (
              <React.Fragment key={item.label}>
                <ListItem sx={{ py: 1.25, px: 2 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                  <Typography variant="body1" fontWeight={700} color={item.color}>
                    {item.value}
                  </Typography>
                </ListItem>
                {i < arr.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        <Divider sx={{ mb: 2 }} />

        {/* Loans Table */}
        {data.loans.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Detalle de Préstamos
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
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                    {!isMobile && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Monto Prestado</TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {isMobile ? 'Total' : 'Total a Devolver'}
                    </TableCell>
                    {!isMobile && (
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Interés</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.loans.map((loan, index) => {
                    // Use montoTotalPrestado directly from backend
                    const montoPrestado = loan.montoTotalPrestado
                    const interes = loan.montoTotalADevolver - montoPrestado
                    const porcentajeInteres = montoPrestado > 0 
                      ? ((interes / montoPrestado) * 100).toFixed(1)
                      : '0.0'

                    return (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.primary.main, 0.02) 
                          },
                          '&:last-child td': { border: 0 }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {loan.nombrecliente}
                          </Typography>
                          {isMobile && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Prestado: {formatCurrency(montoPrestado)}
                            </Typography>
                          )}
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500} color="primary.main">
                              {formatCurrency(montoPrestado)}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {formatCurrency(loan.montoTotalADevolver)}
                          </Typography>
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="center">
                            <Chip 
                              label={`+${porcentajeInteres}%`}
                              size="small" 
                              color="warning"
                              sx={{ fontWeight: 600 }}
                            />
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              {formatCurrency(interes)}
                            </Typography>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No hay préstamos registrados para hoy
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

