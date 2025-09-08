'use client'

import { useState, useEffect } from 'react'
import { useSubLoans } from '@/hooks/useSubLoans'
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

import type { components } from '@/types/api-generated'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import LoanTimeline from '@/components/loans/LoanTimeline'
import PaymentModal from '@/components/loans/PaymentModal'

type SubLoanResponseDto = components['schemas']['SubLoanResponseDto']

interface ClientSummary {
  clientId: string
  clientName: string
  subLoans: SubLoanWithClientInfo[]
  urgencyLevel: 'overdue' | 'today' | 'soon' | 'future'
  stats: {
    total: number
    overdue: number
    today: number
    soon: number
    paid: number
    totalAmount: number
    paidAmount: number
  }
}

// Mapeo de estados del backend a estados de UI
const mapSubLoanStatus = (apiStatus: string) => {
  switch (apiStatus) {
    case 'PAID':
      return 'COMPLETED'
    case 'PENDING':
      return 'PENDING'  
    case 'OVERDUE':
      return 'OVERDUE'
    case 'PARTIAL':
      return 'PARTIAL'
    case 'CANCELLED':
      return 'CANCELED'
    default:
      return 'PENDING'
  }
}

export default function CobrosPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const {
    allSubLoansWithClient,
    todayDueSubLoans,
    isLoading,
    error,
    getTotalDueToday,
    getOverdueCount,
    getPendingCount,
    getPaidCount,
    getTotalAmount
  } = useSubLoans()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<SubLoanWithClientInfo | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [showClientInfo, setShowClientInfo] = useState<string | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentModalMode, setPaymentModalMode] = useState<'single' | 'selector'>('single')
  const [selectedPaymentSubloan, setSelectedPaymentSubloan] = useState<SubLoanWithClientInfo | null>(null)
  const [selectedPaymentClient, setSelectedPaymentClient] = useState<ClientSummary | null>(null)
  const [dayLocked, setDayLocked] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [overdueModalOpen, setOverdueModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  // Estados para el modal de edición  
  const [editAmount, setEditAmount] = useState('')
  const [editStatus, setEditStatus] = useState<string>('PENDING')
  const [editNotes, setEditNotes] = useState('')

  const getStatusChip = (status: string) => {
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

  // Data is auto-loaded by useSubLoans hook

  // Helper function to determine urgency based on due date
  const getUrgencyLevel = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'overdue' // Ya vencido
    if (diffDays === 0) return 'today' // Vence hoy
    if (diffDays <= 2) return 'soon' // Vence pronto (1-2 días)
    return 'future' // Futuro (más de 2 días)
  }

  // Group subloans by client with summary stats
  const getClientsSummary = (): ClientSummary[] => {
    const clientsMap = new Map<string, SubLoanWithClientInfo[]>()
    
    // Group by client
    allSubLoansWithClient.forEach(subloan => {
      const clientKey = subloan.clientId || subloan.loanId
      if (!clientsMap.has(clientKey)) {
        clientsMap.set(clientKey, [])
      }
      clientsMap.get(clientKey)!.push(subloan)
    })

    // Create summaries
    return Array.from(clientsMap.entries()).map(([clientKey, subLoans]) => {
      const firstSubloan = subLoans[0]
      const clientName = firstSubloan.clientName || `Cliente #${firstSubloan.loanId}`
      
      // Calculate stats
      const overdueCount = subLoans.filter(s => getUrgencyLevel(s.dueDate) === 'overdue').length
      const todayCount = subLoans.filter(s => getUrgencyLevel(s.dueDate) === 'today').length
      const soonCount = subLoans.filter(s => getUrgencyLevel(s.dueDate) === 'soon').length
      const paidCount = subLoans.filter(s => s.status === 'PAID').length
      
      // Determine overall urgency level (worst case)
      let urgencyLevel: 'overdue' | 'today' | 'soon' | 'future' = 'future'
      if (overdueCount > 0) urgencyLevel = 'overdue'
      else if (todayCount > 0) urgencyLevel = 'today'
      else if (soonCount > 0) urgencyLevel = 'soon'
      
      return {
        clientId: firstSubloan.clientId || clientKey,
        clientName,
        subLoans: subLoans.sort((a, b) => a.paymentNumber - b.paymentNumber),
        urgencyLevel,
        stats: {
          total: subLoans.length,
          overdue: overdueCount,
          today: todayCount,
          soon: soonCount,
          paid: paidCount,
          totalAmount: subLoans.reduce((sum, s) => sum + s.totalAmount, 0),
          paidAmount: subLoans.reduce((sum, s) => sum + (s.paidAmount || 0), 0)
        }
      }
    }).sort((a, b) => {
      // Sort by urgency level first
      const urgencyOrder = { overdue: 0, today: 1, soon: 2, future: 3 }
      if (a.urgencyLevel !== b.urgencyLevel) {
        return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel]
      }
      // Then by client name
      return a.clientName.localeCompare(b.clientName)
    })
  }

  const getStatusStats = () => {
    const stats = {
      total: allSubLoansWithClient.length,
      completed: allSubLoansWithClient.filter(p => p.status === 'PAID').length,
      partial: 0, // TODO: backend no diferencia parcial aún
      pending: allSubLoansWithClient.filter(p => p.status === 'PENDING').length,
      overdue: allSubLoansWithClient.filter(p => p.status === 'OVERDUE').length,
      canceled: 0, // TODO: backend no maneja cancelados aún
      totalExpected: allSubLoansWithClient.reduce((sum, p) => sum + p.totalAmount, 0),
      totalCollected: allSubLoansWithClient.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
    }
    return stats
  }

  const handleViewClientDetails = (clientSummary: ClientSummary) => {
    setSelectedClient(clientSummary.clientId)
    setDetailsModalOpen(true)
  }

  const handleEditPayment = (payment: SubLoanWithClientInfo) => {
    if (dayLocked) return
    
    setSelectedPayment(payment)
    setEditAmount(payment.paidAmount?.toString() || '')
    setEditStatus(payment.status)
    setEditNotes('') // TODO: backend no tiene notas aún
    setEditModalOpen(true)
  }

  // Handle payment click from timeline
  const handlePaymentClick = (subloan: SubLoanWithClientInfo) => {
    if (dayLocked) return
    
    setSelectedPaymentSubloan(subloan)
    setPaymentModalMode('single')
    setPaymentModalOpen(true)
  }

  // Handle payment from button (selector mode)  
  const handleRegisterPaymentClick = (clientSummary: ClientSummary) => {
    if (dayLocked) return
    
    setSelectedPaymentClient(clientSummary)
    setPaymentModalMode('selector')
    setPaymentModalOpen(true)
  }

  const handleSavePayment = () => {
    if (!selectedPayment) return

    // TODO: Implementar actualización real via API
    console.log('Actualizando pago:', {
      id: selectedPayment.id,
      paidAmount: parseFloat(editAmount) || 0,
      status: editStatus,
      notes: editNotes
    })

    // Por ahora solo cerramos el modal
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

  // Get urgency color for client summary cards  
  const getUrgencyColor = (urgencyLevel: 'overdue' | 'today' | 'soon' | 'future') => {
    switch (urgencyLevel) {
      case 'overdue':
        return { primary: '#f44336', bg: '#ffebee', border: '#f44336' }
      case 'today':
        return { primary: '#ff9800', bg: '#fff3e0', border: '#ff9800' }
      case 'soon':
        return { primary: '#ffc107', bg: '#fff8e1', border: '#ffc107' }
      default:
        return { primary: '#9e9e9e', bg: '#f5f5f5', border: '#e0e0e0' }
    }
  }

  // Get client summaries
  const clientsSummary = getClientsSummary()
  const paginatedClients = clientsSummary.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  
  // Keep old data for backward compatibility with modals
  const sortedSubLoans = [...allSubLoansWithClient].sort((a, b) => {
    const urgencyOrder = { overdue: 0, today: 1, soon: 2, future: 3 }
    const urgencyA = getUrgencyLevel(a.dueDate)
    const urgencyB = getUrgencyLevel(b.dueDate)
    
    if (urgencyA !== urgencyB) {
      return urgencyOrder[urgencyA] - urgencyOrder[urgencyB]
    }
    
    // If same urgency, sort by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
  
  const overduePayments = allSubLoansWithClient.filter(p => getUrgencyLevel(p.dueDate) === 'overdue')
  
  // Get row styling based on urgency
  const getRowStyling = (payment: SubLoanWithClientInfo) => {
    const urgency = getUrgencyLevel(payment.dueDate)
    switch (urgency) {
      case 'overdue':
        return { bgcolor: '#ffebee', borderLeft: '4px solid #f44336' } // Red
      case 'today':
        return { bgcolor: '#fff3e0', borderLeft: '4px solid #ff9800' } // Orange  
      case 'soon':
        return { bgcolor: '#fff8e1', borderLeft: '4px solid #ffc107' } // Yellow
      default:
        return { bgcolor: 'background.paper', borderLeft: '4px solid transparent' }
    }
  }

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
            Gestión de Cobros
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Todas las cuotas con énfasis en las que están cerca de vencer, vencen hoy o ya vencieron
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
            Gestión de Cobros - Todas las Cuotas
          </Typography>
        </Box>

        {/* Legend for urgency colors */}
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

        {/* Client Summary Cards */}
        <Box sx={{ 
          display: 'grid',
          gap: 3,
          '& > *:not(:last-child)': { mb: 0 }
        }}>
          {paginatedClients.map((client) => {
            const colors = getUrgencyColor(client.urgencyLevel)
            return (
              <Card 
                key={client.clientId}
                variant="outlined"
                sx={{ 
                  bgcolor: colors.bg,
                  borderLeft: `6px solid ${colors.border}`,
                  '&:hover': { 
                    transform: 'scale(1.01)',
                    boxShadow: 3
                  },
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={() => handleViewClientDetails(client)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {/* Header with client name and urgency indicator */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 1
                    }}>
                      <Typography variant="h6" fontWeight="bold" color={colors.primary}>
                        {client.clientName}
                      </Typography>
                      <Chip 
                        label={
                          client.urgencyLevel === 'overdue' ? `${client.stats.overdue} vencidas` :
                          client.urgencyLevel === 'today' ? `${client.stats.today} hoy` :
                          client.urgencyLevel === 'soon' ? `${client.stats.soon} pronto` :
                          'Al día'
                        }
                        sx={{ 
                          bgcolor: colors.primary,
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                        size="small"
                      />
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 0.5
                      }}>
                        <Typography variant="caption" color="text.secondary">
                          Progreso del préstamo
                        </Typography>
                        <Typography variant="caption" fontWeight="bold" color={colors.primary}>
                          {client.stats.paid} de {client.stats.total} cuotas pagadas
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%',
                        height: 8,
                        bgcolor: '#e0e0e0',
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{
                          width: `${(client.stats.paid / client.stats.total) * 100}%`,
                          height: '100%',
                          bgcolor: colors.primary,
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>

                    {/* Summary Stats */}
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: 2
                    }}>
                      {client.stats.overdue > 0 && (
                        <Box>
                          <Typography variant="caption" color="error.main">
                            Vencidas
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="error.main">
                            {client.stats.overdue}
                          </Typography>
                        </Box>
                      )}
                      {client.stats.today > 0 && (
                        <Box>
                          <Typography variant="caption" color="warning.main">
                            Vencen hoy
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="warning.main">
                            {client.stats.today}
                          </Typography>
                        </Box>
                      )}
                      {client.stats.soon > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#ffc107' }}>
                            Vencen pronto
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#ffc107' }}>
                            {client.stats.soon}
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total adeudado
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color={colors.primary}>
                          ${(client.stats.totalAmount - client.stats.paidAmount).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Button */}
                    <Button 
                      fullWidth
                      variant="contained"
                      sx={{ 
                        mt: 1,
                        bgcolor: colors.primary,
                        '&:hover': { bgcolor: colors.primary, opacity: 0.9 }
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewClientDetails(client)
                      }}
                    >
                      Ver Timeline de Cuotas
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>

        <TablePagination
          component="div"
          count={clientsSummary.length}
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
          Editar Cobro - {selectedPayment?.clientName || `Cliente #${selectedPayment?.loanId}`}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'grid', gap: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 } }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Préstamo: {selectedPayment?.loanId} - Cuota #{selectedPayment?.paymentNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monto debido: ${selectedPayment?.totalAmount.toLocaleString()}
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
                onChange={(e) => setEditStatus(e.target.value as string)}
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
                            ${payment.totalAmount.toLocaleString()}
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
                            ${payment.totalAmount.toLocaleString()}
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

                      {/* Notes - Not available in SubLoan model */}
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

      {/* Client Timeline Details Modal */}
      <Dialog 
        open={detailsModalOpen} 
        onClose={() => setDetailsModalOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '95vw', sm: '90vw', md: '1400px' },
            height: { xs: '90vh', sm: 'auto' },
            maxWidth: 'none',
            m: { xs: 1, sm: 3 },
            borderRadius: { xs: 2, sm: 3 }
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Payment color="primary" />
            <Typography variant="h6">Timeline de Cuotas</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 4 }, overflow: 'auto' }}>
          {selectedClient && (() => {
            const clientSummary = clientsSummary.find(c => c.clientId === selectedClient)
            return clientSummary ? (
              <Box>
                {/* Client Summary Header */}
                <Box sx={{ mb: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {clientSummary.clientName}
                  </Typography>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 3,
                    mt: 2
                  }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total cuotas
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {clientSummary.stats.total}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pagadas
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {clientSummary.stats.paid}
                      </Typography>
                    </Box>
                    {clientSummary.stats.overdue > 0 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Vencidas
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {clientSummary.stats.overdue}
                        </Typography>
                      </Box>
                    )}
                    {clientSummary.stats.today > 0 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Vencen hoy
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="warning.main">
                          {clientSummary.stats.today}
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Saldo pendiente
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        ${(clientSummary.stats.totalAmount - clientSummary.stats.paidAmount).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Timeline Component */}
                <LoanTimeline 
                  clientName={clientSummary.clientName}
                  subLoans={clientSummary.subLoans}
                  compact={false}
                  onPaymentClick={handlePaymentClick}
                />

                {/* Urgent Actions */}
                {(clientSummary.stats.overdue > 0 || clientSummary.stats.today > 0) && (
                  <Box sx={{ 
                    mt: 4, 
                    p: 3, 
                    bgcolor: clientSummary.urgencyLevel === 'overdue' ? '#ffebee' : '#fff3e0',
                    borderRadius: 2,
                    border: 1,
                    borderColor: clientSummary.urgencyLevel === 'overdue' ? 'error.main' : 'warning.main'
                  }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      color={clientSummary.urgencyLevel === 'overdue' ? 'error.main' : 'warning.main'}
                      gutterBottom
                    >
                      Atención Requerida
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Este cliente requiere seguimiento inmediato por cuotas {
                        clientSummary.urgencyLevel === 'overdue' ? 'vencidas' : 'que vencen hoy'
                      }.
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      flexWrap: 'wrap' 
                    }}>
                      <Button 
                        variant="outlined"
                        color={clientSummary.urgencyLevel === 'overdue' ? 'error' : 'warning'}
                        size="small"
                        onClick={() => setShowClientInfo(showClientInfo === clientSummary.clientId ? null : clientSummary.clientId)}
                      >
                        Contactar Cliente
                      </Button>
                      <Button 
                        variant="outlined"
                        color={clientSummary.urgencyLevel === 'overdue' ? 'error' : 'warning'}
                        size="small"
                        onClick={() => handleRegisterPaymentClick(clientSummary)}
                      >
                        Registrar Pago
                      </Button>
                    </Box>

                    {/* Client Contact Information - Collapsible */}
                    {showClientInfo === clientSummary.clientId && (
                      <Box sx={{ 
                        mt: 3, 
                        p: 3, 
                        bgcolor: '#f8f9fa',
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'grey.300'
                      }}>
                        {(() => {
                          const clientData = clientSummary.subLoans[0]?.clientFullData
                          const loanCreatedAt = clientSummary.subLoans[0] ? 
                            new Date(clientSummary.subLoans.find(s => s.loanId)?.dueDate || '').toLocaleDateString('es-AR') : 'No disponible'

                          return (
                            <>
                              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Información de Contacto - {clientSummary.clientName}
                              </Typography>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Teléfono:</strong> {clientData?.phone || 'Dato no ingresado'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Email:</strong> {clientData?.email || 'Dato no ingresado'}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>DNI:</strong> {clientData?.dni || 'Dato no ingresado'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>CUIT:</strong> {clientData?.cuit || 'Dato no ingresado'}
                                  </Typography>
                                </Box>
                              </Box>
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="body2" color="text.secondary">
                                <strong>Préstamo creado:</strong> {new Date(clientSummary.subLoans[0]?.dueDate || '').toLocaleDateString('es-AR')}
                              </Typography>
                            </>
                          )
                        })()}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Typography>Cliente no encontrado</Typography>
            )
          })()}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button 
            onClick={() => setDetailsModalOpen(false)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        subloan={paymentModalMode === 'single' ? selectedPaymentSubloan : null}
        subloans={paymentModalMode === 'selector' && selectedPaymentClient ? 
          selectedPaymentClient.subLoans.filter(s => s.status !== 'PAID') : []
        }
        clientName={
          paymentModalMode === 'single' && selectedPaymentSubloan 
            ? selectedPaymentSubloan.clientName || 'Cliente'
            : selectedPaymentClient?.clientName || 'Cliente'
        }
        mode={paymentModalMode}
      />
    </Box>
  )
}