'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  TablePagination
} from '@mui/material'
import {
  CheckCircle,
  Warning,
  AttachMoney,
  CalendarToday,
  Lock,
  Edit,
  Payment
} from '@mui/icons-material'

interface DailyPayment {
  id: string
  clientName: string
  loanTrackingNumber: string
  paymentNumber: number
  dueAmount: number
  collectedAmount?: number
  dueDate: string
  status: 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'OVERDUE' | 'CANCELED'
  notes?: string
}

// Mock data para cobros del día
const mockDailyPayments: DailyPayment[] = [
  {
    id: '1',
    clientName: 'María González',
    loanTrackingNumber: 'LN-2025-3421',
    paymentNumber: 5,
    dueAmount: 2500,
    collectedAmount: 2500,
    dueDate: '2025-08-27',
    status: 'COMPLETED'
  },
  {
    id: '2',
    clientName: 'Carlos Rodríguez',
    loanTrackingNumber: 'LN-2025-7834',
    paymentNumber: 8,
    dueAmount: 1800,
    collectedAmount: 1000,
    dueDate: '2025-08-27',
    status: 'PARTIAL',
    notes: 'Pagó $1000, debe $800'
  },
  {
    id: '3',
    clientName: 'Ana Martínez',
    loanTrackingNumber: 'LN-2025-5612',
    paymentNumber: 3,
    dueAmount: 3200,
    dueDate: '2025-08-27',
    status: 'PENDING'
  },
  {
    id: '4',
    clientName: 'Luis Fernández',
    loanTrackingNumber: 'LN-2025-9876',
    paymentNumber: 12,
    dueAmount: 1500,
    dueDate: '2025-08-25',
    status: 'OVERDUE',
    notes: 'Pago vencido hace 2 días'
  },
  {
    id: '5',
    clientName: 'Roberto Silva',
    loanTrackingNumber: 'LN-2025-1234',
    paymentNumber: 1,
    dueAmount: 2200,
    dueDate: '2025-08-27',
    status: 'CANCELED',
    notes: 'Cliente suspendido por incumplimiento'
  }
]

export default function CobrosPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyPayments, setDailyPayments] = useState<DailyPayment[]>(mockDailyPayments)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<DailyPayment | null>(null)
  const [dayLocked, setDayLocked] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [overdueModalOpen, setOverdueModalOpen] = useState(false)

  // Estados para el modal de edición
  const [editAmount, setEditAmount] = useState('')
  const [editStatus, setEditStatus] = useState<DailyPayment['status']>('PENDING')
  const [editNotes, setEditNotes] = useState('')

  const getStatusChip = (status: DailyPayment['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Chip label="Completado" color="success" size="small" />
      case 'PARTIAL':
        return <Chip label="Parcial" color="warning" size="small" />
      case 'PENDING':
        return <Chip label="Pendiente" color="info" size="small" />
      case 'OVERDUE':
        return <Chip 
          label="En Mora" 
          size="small"
          sx={{ 
            backgroundColor: '#9C27B0', 
            color: 'white',
            '& .MuiChip-label': { fontWeight: 'bold' }
          }}
        />
      case 'CANCELED':
        return <Chip label="Cancelado" color="error" size="small" />
      default:
        return <Chip label="Desconocido" size="small" />
    }
  }

  const getStatusStats = () => {
    const stats = {
      total: dailyPayments.length,
      completed: dailyPayments.filter(p => p.status === 'COMPLETED').length,
      partial: dailyPayments.filter(p => p.status === 'PARTIAL').length,
      pending: dailyPayments.filter(p => p.status === 'PENDING').length,
      overdue: dailyPayments.filter(p => p.status === 'OVERDUE').length,
      canceled: dailyPayments.filter(p => p.status === 'CANCELED').length,
      totalExpected: dailyPayments.reduce((sum, p) => sum + p.dueAmount, 0),
      totalCollected: dailyPayments.reduce((sum, p) => sum + (p.collectedAmount || 0), 0)
    }
    return stats
  }

  const handleEditPayment = (payment: DailyPayment) => {
    if (dayLocked) return
    
    setSelectedPayment(payment)
    setEditAmount(payment.collectedAmount?.toString() || '')
    setEditStatus(payment.status)
    setEditNotes(payment.notes || '')
    setEditModalOpen(true)
  }

  const handleSavePayment = () => {
    if (!selectedPayment) return

    const updatedPayments = dailyPayments.map(payment => {
      if (payment.id === selectedPayment.id) {
        const collectedAmount = parseFloat(editAmount) || 0
        let newStatus = editStatus

        // Auto-determinar estado basado en el monto
        if (collectedAmount === 0) {
          newStatus = editStatus === 'CANCELED' ? 'CANCELED' : 'PENDING'
        } else if (collectedAmount >= payment.dueAmount) {
          newStatus = 'COMPLETED'
        } else if (collectedAmount > 0) {
          newStatus = 'PARTIAL'
        }

        return {
          ...payment,
          collectedAmount: collectedAmount,
          status: newStatus,
          notes: editNotes
        }
      }
      return payment
    })

    setDailyPayments(updatedPayments)
    setEditModalOpen(false)
    setSelectedPayment(null)
  }

  const handleLockDay = () => {
    const confirmed = window.confirm(
      '¿Estás seguro de cerrar el día? Una vez cerrado no podrás modificar los cobros.'
    )
    if (confirmed) {
      setDayLocked(true)
    }
  }

  const stats = getStatusStats()
  
  // Paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const paginatedPayments = dailyPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const overduePayments = dailyPayments.filter(p => p.status === 'OVERDUE')

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        mb: 4, 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
        gap: { xs: 3, sm: 2 },
        alignItems: { xs: 'stretch', sm: 'center' }
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Cobros Diarios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona los cobros y seguimiento de pagos del día
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'auto auto auto' },
          gap: 2,
          alignItems: 'center'
        }}>
          {overduePayments.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Warning />}
              onClick={() => setOverdueModalOpen(true)}
              size="small"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Fuera de Término ({overduePayments.length})
            </Button>
          )}
          <TextField
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            size="small"
            disabled={dayLocked}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
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
              onClick={handleLockDay}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Cerrar Día
            </Button>
          )}
        </Box>
      </Box>

      {/* Estado del día */}
      {dayLocked && (
        <Alert severity="success" sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Día cerrado exitosamente
          </Typography>
          <Typography variant="body2">
            Los cobros del {new Date(selectedDate).toLocaleDateString('es-AR')} han sido finalizados.
            No se pueden hacer más modificaciones.
          </Typography>
        </Alert>
      )}

      {/* Estadísticas del Día */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 3,
        mb: 4
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarToday color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Total Programado
              </Typography>
            </Box>
            <Typography variant="h4" color="primary.main">
              {stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              cobros del día
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AttachMoney color="success" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Recaudado
              </Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              ${stats.totalCollected.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              de ${stats.totalExpected.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Completados
              </Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {stats.completed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              + {stats.partial} parciales
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Warning color="warning" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Pendientes
              </Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {stats.pending}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              sin cobrar
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabla de Cobros */}
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Payment color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6">
            Cobros del {new Date(selectedDate).toLocaleDateString('es-AR')}
          </Typography>
        </Box>

        {/* Desktop Table */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Préstamo</strong></TableCell>
                  <TableCell align="center"><strong>Cuota #</strong></TableCell>
                  <TableCell align="right"><strong>Debe</strong></TableCell>
                  <TableCell align="right"><strong>Cobrado</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                  <TableCell><strong>Notas</strong></TableCell>
                  <TableCell align="center"><strong>Acción</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPayments.map((payment) => (
                  <TableRow 
                    key={payment.id}
                    sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {payment.clientName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={payment.loanTrackingNumber} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        #{payment.paymentNumber}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        ${payment.dueAmount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={payment.collectedAmount ? 'success.main' : 'text.secondary'}
                        fontWeight="bold"
                      >
                        {payment.collectedAmount ? `$${payment.collectedAmount.toLocaleString()}` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(payment.status)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {payment.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => handleEditPayment(payment)}
                        disabled={dayLocked}
                      >
                        {dayLocked ? 'Ver' : 'Editar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile Cards */}
        <Box sx={{ 
          display: { xs: 'block', md: 'none' },
          '& > *:not(:last-child)': { mb: 2 }
        }}>
          {paginatedPayments.map((payment) => (
            <Card 
              key={payment.id}
              variant="outlined"
              sx={{ 
                '&:hover': { bgcolor: 'action.hover' },
                cursor: 'pointer'
              }}
              onClick={() => handleEditPayment(payment)}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {/* Header */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    mb: 1
                  }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {payment.clientName}
                      </Typography>
                      <Chip 
                        label={payment.loanTrackingNumber} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', mt: 0.5 }}
                      />
                    </Box>
                    {getStatusChip(payment.status)}
                  </Box>

                  {/* Payment Details */}
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2
                  }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Cuota #{payment.paymentNumber}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        Debe: ${payment.dueAmount.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Cobrado
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={payment.collectedAmount ? 'success.main' : 'text.secondary'}
                      >
                        {payment.collectedAmount ? `$${payment.collectedAmount.toLocaleString()}` : 'Sin cobrar'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Notes */}
                  {payment.notes && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Notas:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {payment.notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Action Button */}
                  <Button 
                    fullWidth
                    variant="outlined"
                    startIcon={<Edit />}
                    disabled={dayLocked}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditPayment(payment)
                    }}
                  >
                    {dayLocked ? 'Ver Detalles' : 'Editar Cobro'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <TablePagination
          component="div"
          count={dailyPayments.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
          sx={{ 
            borderTop: 1, 
            borderColor: 'divider',
            '& .MuiTablePagination-toolbar': {
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 }
            },
            '& .MuiTablePagination-spacer': {
              display: { xs: 'none', sm: 'flex' }
            }
          }}
        />

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Progreso del día: {stats.completed + stats.partial} de {stats.total} cobros procesados
          </Typography>
        </Box>
      </Paper>

      {/* Modal de Edición */}
      <Dialog 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '95vw', sm: '600px' },
            maxWidth: 'none',
            m: { xs: 1, sm: 3 },
            borderRadius: { xs: 2, sm: 3 }
          }
        }}
      >
        <DialogTitle>
          Editar Cobro - {selectedPayment?.clientName}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'grid', gap: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 } }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Préstamo: {selectedPayment?.loanTrackingNumber} - Cuota #{selectedPayment?.paymentNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monto debido: ${selectedPayment?.dueAmount.toLocaleString()}
              </Typography>
            </Box>

            <Divider />

            <TextField
              label="Monto Cobrado"
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: '$'
              }}
              helperText="Ingrese el monto efectivamente cobrado"
            />

            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as DailyPayment['status'])}
                label="Estado"
              >
                <MenuItem value="PENDING">Pendiente</MenuItem>
                <MenuItem value="COMPLETED">Completado</MenuItem>
                <MenuItem value="PARTIAL">Pago Parcial</MenuItem>
                <MenuItem value="OVERDUE">En Mora</MenuItem>
                <MenuItem value="CANCELED">Cancelado</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notas"
              multiline
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              fullWidth
              placeholder="Observaciones, acuerdos, próximo contacto, etc."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
          <Button 
            onClick={() => setEditModalOpen(false)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSavePayment} 
            variant="contained"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Pagos Vencidos */}
      <Dialog 
        open={overdueModalOpen} 
        onClose={() => setOverdueModalOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '95vw', sm: '90vw', md: '1200px' },
            height: { xs: '90vh', sm: 'auto' },
            maxWidth: 'none',
            m: { xs: 1, sm: 3 },
            borderRadius: { xs: 2, sm: 3 }
          }
        }}
      >
        <DialogTitle>
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
                    const daysOverdue = Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 3600 * 24))
                    return (
                      <TableRow 
                        key={payment.id}
                        sx={{ bgcolor: 'error.light', '&:hover': { bgcolor: 'error.main' } }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="white">
                            {payment.clientName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={payment.loanTrackingNumber} 
                            size="small" 
                            variant="filled"
                            sx={{ 
                              fontFamily: 'monospace',
                              bgcolor: 'white',
                              color: 'error.main',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="white" fontWeight="bold">
                            #{payment.paymentNumber}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="white">
                            ${payment.dueAmount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="white" fontWeight="bold">
                            {new Date(payment.dueDate).toLocaleDateString('es-AR')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={`${daysOverdue} días`}
                            size="small"
                            sx={{ 
                              bgcolor: 'white',
                              color: 'error.main',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                            {payment.notes || 'Sin observaciones'}
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
          <Box sx={{ 
            display: { xs: 'block', md: 'none' },
            '& > *:not(:last-child)': { mb: 2 }
          }}>
            {overduePayments.map((payment) => {
              const daysOverdue = Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 3600 * 24))
              return (
                <Card 
                  key={payment.id}
                  sx={{ 
                    bgcolor: 'error.light',
                    border: 1,
                    borderColor: 'error.main'
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      {/* Header */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start'
                      }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" color="white">
                            {payment.clientName}
                          </Typography>
                          <Chip 
                            label={payment.loanTrackingNumber} 
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
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2
                      }}>
                        <Box>
                          <Typography variant="caption" color="white" sx={{ opacity: 0.9 }}>
                            Cuota #{payment.paymentNumber}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="white">
                            ${payment.dueAmount.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="white" sx={{ opacity: 0.9 }}>
                            Fecha Vencimiento
                          </Typography>
                          <Typography variant="body2" color="white" fontWeight="bold">
                            {new Date(payment.dueDate).toLocaleDateString('es-AR')}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Notes */}
                      {payment.notes && (
                        <Box>
                          <Typography variant="caption" color="white" sx={{ opacity: 0.9 }}>
                            Notas:
                          </Typography>
                          <Typography variant="body2" color="white">
                            {payment.notes}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button 
            onClick={() => setOverdueModalOpen(false)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}