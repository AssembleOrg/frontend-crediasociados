'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Card,
  CardContent
} from '@mui/material'
import { Warning } from '@mui/icons-material'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

interface OverduePaymentsModalProps {
  open: boolean
  onClose: () => void
  overduePayments: SubLoanWithClientInfo[]
}

export default function OverduePaymentsModal({
  open,
  onClose,
  overduePayments
}: OverduePaymentsModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          width: { xs: '95vw', sm: '90vw', md: '1200px' },
          height: { xs: '90vh', sm: 'auto' },
          maxWidth: 'none',
          m: { xs: 1, sm: 3 },
          borderRadius: { xs: 2, sm: 3 },
        },
      }}
    >
      <DialogTitle sx={{ pt: 2.5, px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Warning color="error" />
          <Typography variant="h6">Pagos Fuera de Término</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Estos pagos están vencidos y requieren atención inmediata
          </Typography>
          <Typography variant="body2">
            Contacta a estos clientes para regularizar su situación o considera marcarlos como &quot;En Mora&quot;.
          </Typography>
        </Alert>

        {/* Desktop Table */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Préstamo</strong></TableCell>
                  <TableCell align="center"><strong>Cuota #</strong></TableCell>
                  <TableCell align="right"><strong>Monto</strong></TableCell>
                  <TableCell align="center"><strong>Fecha Venc.</strong></TableCell>
                  <TableCell align="center"><strong>Días Vencido</strong></TableCell>
                  <TableCell><strong>Notas</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overduePayments.map((payment) => {
                  const daysOverdue = payment.dueDate ? Math.floor(
                    (new Date().getTime() - new Date(payment.dueDate).getTime()) /
                      (1000 * 3600 * 24)
                  ) : 0
                  return (
                    <TableRow
                      key={payment.id}
                      sx={{
                        bgcolor: 'error.light',
                        '&:hover': { bgcolor: 'error.main' },
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="white"
                        >
                          {payment.clientName || `Cliente #${payment.loanId}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.loanId}
                          size="small"
                          variant="filled"
                          sx={{
                            fontFamily: 'monospace',
                            bgcolor: 'white',
                            color: 'error.main',
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          color="white"
                          fontWeight="bold"
                        >
                          #{payment.paymentNumber}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="white"
                        >
                          ${payment.totalAmount?.toLocaleString() ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          color="white"
                          fontWeight="bold"
                        >
                          {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('es-AR') : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${daysOverdue} días`}
                          size="small"
                          sx={{
                            bgcolor: 'white',
                            color: 'error.main',
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="white"
                          sx={{ opacity: 0.9 }}
                        >
                          Sin observaciones
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile Cards */}
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            '& > *:not(:last-child)': { mb: 2 },
          }}
        >
          {overduePayments.map((payment) => {
            const daysOverdue = payment.dueDate ? Math.floor(
              (new Date().getTime() - new Date(payment.dueDate).getTime()) /
                (1000 * 3600 * 24)
            ) : 0
            return (
              <Card
                key={payment.id}
                sx={{
                  bgcolor: 'error.light',
                  border: 1,
                  borderColor: 'error.main',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {/* Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          color="white"
                        >
                          {payment.clientName || `Cliente #${payment.loanId}`}
                        </Typography>
                        <Chip
                          label={payment.loanId}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: 'monospace', mt: 0.5 }}
                        />
                      </Box>
                      <Chip
                        label={`${daysOverdue} días vencido`}
                        color="error"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>

                    {/* Details Grid */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="white"
                          sx={{ opacity: 0.9 }}
                        >
                          Cuota #{payment.paymentNumber}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="white"
                        >
                          ${payment.totalAmount?.toLocaleString() ?? 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          color="white"
                          sx={{ opacity: 0.9 }}
                        >
                          Fecha Vencimiento
                        </Typography>
                        <Typography
                          variant="body2"
                          color="white"
                          fontWeight="bold"
                        >
                          {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('es-AR') : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
        <Button
          onClick={onClose}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}