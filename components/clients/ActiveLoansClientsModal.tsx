'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
  Divider,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { 
  Close, 
  AccountBalance, 
  Phone, 
  Home, 
  Search, 
  ExpandMore,
  CreditCard,
  CalendarToday,
  AttachMoney
} from '@mui/icons-material'
import { clientsService } from '@/services/clients.service'
import { useUsers } from '@/hooks/useUsers'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { DateTime } from 'luxon'

interface ActiveLoansClientsModalProps {
  open: boolean
  onClose: () => void
}

export default function ActiveLoansClientsModal({ open, onClose }: ActiveLoansClientsModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { users } = useUsers()
  const currentUser = useCurrentUser()
  
  // Determine if current user is a manager (prestamista)
  const isManager = currentUser?.role === 'prestamista'
  const isSubadmin = currentUser?.role === 'subadmin'
  
  const [selectedManager, setSelectedManager] = useState<string | null>(null)
  const [clients, setClients] = useState<Array<{
    id: string
    nombre: string
    telefono?: string
    direccion?: string
    cantidadPrestamosActivos: number
    prestamosActivos: Array<{
      id: string
      loanTrack: string
      amount: number
      status: string
      createdAt: string
    }>
  }>>([])
  const [totalClients, setTotalClients] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())

  // Filter managers (prestamistas)
  const managers = users.filter(user => user.role === 'prestamista')
  const selectedManagerData = managers.find(m => m.id === selectedManager)
  
  // Auto-select current user if manager
  const managerIdToUse = isManager ? currentUser?.id : selectedManager

  useEffect(() => {
    // Auto-select current user if manager
    if (open && isManager && currentUser?.id) {
      setSelectedManager(currentUser.id)
    } else if (open && isSubadmin && !selectedManager) {
      setSelectedManager(null)
    }
  }, [open, isManager, isSubadmin, currentUser?.id])

  useEffect(() => {
    if (open && managerIdToUse) {
      loadActiveLoansClients()
    } else if (open && !managerIdToUse && isSubadmin) {
      setClients([])
      setTotalClients(0)
      setError(null)
    }
    // Reset search when manager changes or modal opens
    if (open) {
      setSearchQuery('')
      setExpandedClients(new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, managerIdToUse, isSubadmin])

  const loadActiveLoansClients = async () => {
    if (!managerIdToUse) return

    setLoading(true)
    setError(null)
    try {
      const data = await clientsService.getActiveLoansClients(managerIdToUse)
      setClients(data.clients || [])
      setTotalClients(data.total || 0)
    } catch (err: any) {
      console.error('Error loading active loans clients:', err)
      setError(err.response?.data?.message || 'Error al cargar los clientes con préstamos activos')
      setClients([])
      setTotalClients(0)
    } finally {
      setLoading(false)
    }
  }

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients
    
    const query = searchQuery.toLowerCase().trim()
    return clients.filter(client => {
      const nombre = client.nombre?.toLowerCase() || ''
      const telefono = client.telefono?.toLowerCase() || ''
      const direccion = client.direccion?.toLowerCase() || ''
      const loanTracks = client.prestamosActivos.map(p => p.loanTrack.toLowerCase()).join(' ')
      
      return nombre.includes(query) || 
             telefono.includes(query) || 
             direccion.includes(query) ||
             loanTracks.includes(query)
    })
  }, [clients, searchQuery])

  const formatDate = (dateString: string) => {
    const date = DateTime.fromISO(dateString)
    return date.setLocale('es').toFormat("dd 'de' MMMM 'de' yyyy")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'success'
      case 'APPROVED':
        return 'info'
      case 'PENDING':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'Activo'
      case 'APPROVED':
        return 'Aprobado'
      case 'PENDING':
        return 'Pendiente'
      default:
        return status
    }
  }

  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '')
    
    // If it starts with +54, keep it
    // If it starts with 54, add +
    // If it starts with 0 or 9, add +54
    // Otherwise, assume it's a local number and add +54
    if (cleaned.startsWith('+54')) {
      return cleaned
    } else if (cleaned.startsWith('54')) {
      return '+' + cleaned
    } else if (cleaned.startsWith('0')) {
      return '+54' + cleaned.substring(1)
    } else if (cleaned.startsWith('9')) {
      return '+54' + cleaned
    } else {
      // Assume it's a local number without country code
      return '+54' + cleaned
    }
  }

  const handlePhoneClick = (phone: string) => {
    const whatsappNumber = formatPhoneForWhatsApp(phone)
    const whatsappUrl = `https://wa.me/${whatsappNumber}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const handleExpandClient = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }

  const totalActiveLoans = useMemo(() => {
    return clients.reduce((sum, client) => sum + client.cantidadPrestamosActivos, 0)
  }, [clients])

  const filteredTotalActiveLoans = useMemo(() => {
    return filteredClients.reduce((sum, client) => sum + client.cantidadPrestamosActivos, 0)
  }, [filteredClients])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100vh' : '90vh',
          m: { xs: 0, sm: 2 },
          mt: { xs: 0, sm: 3 }
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        pt: 2,
        px: 3,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountBalance sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>
            Clientes con Préstamos Activos
          </Typography>
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
        {/* Manager Selector - Only for Subadmin */}
        {isSubadmin && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Selecciona un Manager
              </Typography>
              <Autocomplete
                options={managers}
                getOptionLabel={(option) => `${option.fullName} (${option.email})`}
                value={selectedManagerData || null}
                onChange={(_, newValue) => setSelectedManager(newValue?.id || null)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar manager"
                    placeholder="Escribe el nombre o email del manager"
                    variant="outlined"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        {option.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </Box>
                )}
                noOptionsText="No se encontraron managers"
              />
            </Box>
            <Divider sx={{ mb: 3 }} />
          </>
        )}

        {/* Manager Info - Only for Manager */}
        {isManager && currentUser && (
          <>
            <Box sx={{ mb: 3, p: 2, bgcolor: alpha('#1976d2', 0.1), borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Tus Clientes con Préstamos Activos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser.fullName} ({currentUser.email})
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
          </>
        )}

        {/* Summary Cards */}
        {managerIdToUse && !loading && !error && clients.length > 0 && (
          <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: alpha('#1976d2', 0.05) }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total de Clientes
              </Typography>
              <Typography variant="h5" fontWeight={600} color="primary">
                {searchQuery ? filteredClients.length : totalClients}
                {searchQuery && ` de ${totalClients}`}
              </Typography>
            </Paper>
            <Paper elevation={1} sx={{ p: 2, bgcolor: alpha('#1976d2', 0.05) }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total de Préstamos Activos
              </Typography>
              <Typography variant="h5" fontWeight={600} color="primary">
                {searchQuery ? filteredTotalActiveLoans : totalActiveLoans}
                {searchQuery && ` de ${totalActiveLoans}`}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Search Input */}
        {managerIdToUse && !loading && !error && clients.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, teléfono, dirección o número de préstamo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando clientes con préstamos activos...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Empty State - No Manager Selected (Only for Subadmin) */}
        {isSubadmin && !managerIdToUse && !loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <AccountBalance sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Selecciona un manager
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Elige un manager del selector para ver sus clientes con préstamos activos
            </Typography>
          </Box>
        )}

        {/* Empty State - No Clients */}
        {managerIdToUse && !loading && !error && clients.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <AccountBalance sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay clientes con préstamos activos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isManager 
                ? 'No tienes clientes con préstamos activos'
                : `${selectedManagerData?.fullName || 'Este manager'} no tiene clientes con préstamos activos`
              }
            </Typography>
          </Box>
        )}

        {/* Clients List */}
        {managerIdToUse && !loading && !error && clients.length > 0 && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Clientes con Préstamos Activos
              </Typography>
              {searchQuery && (
                <Chip 
                  label={`${filteredClients.length} de ${totalClients}`}
                  color="info"
                  size="small"
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredClients.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron clientes que coincidan con "{searchQuery}"
                  </Typography>
                </Paper>
              ) : (
                filteredClients.map((client) => (
                  <Accordion
                    key={client.id}
                    expanded={expandedClients.has(client.id)}
                    onChange={() => handleExpandClient(client.id)}
                    sx={{
                      '&:before': { display: 'none' },
                      boxShadow: 2,
                      borderRadius: 2,
                      overflow: 'hidden',
                      '&.Mui-expanded': {
                        margin: 0,
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{
                        bgcolor: expandedClients.has(client.id) ? alpha('#1976d2', 0.05) : 'background.paper',
                        '&:hover': {
                          bgcolor: alpha('#1976d2', 0.03)
                        }
                      }}
                    >
                      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2, pr: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            {client.nombre}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                            {client.telefono && (
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.7
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePhoneClick(client.telefono!)
                                }}
                              >
                                <Phone sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2" color="success.main" sx={{ textDecoration: 'underline' }}>
                                  {client.telefono}
                                </Typography>
                              </Box>
                            )}
                            {client.direccion && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Home sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: { xs: 200, sm: 400 }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {client.direccion}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                        <Chip 
                          label={`${client.cantidadPrestamosActivos} préstamo${client.cantidadPrestamosActivos !== 1 ? 's' : ''}`}
                          color="primary"
                          size="small"
                          icon={<CreditCard />}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: alpha('#1976d2', 0.1) }}>
                              <TableCell sx={{ fontWeight: 600 }}>Préstamo</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">Monto</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {client.prestamosActivos.map((prestamo) => (
                              <TableRow key={prestamo.id}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={500}>
                                    {prestamo.loanTrack}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                    <AttachMoney sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2" fontWeight={500}>
                                      {formatCurrency(prestamo.amount)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={getStatusLabel(prestamo.status)}
                                    color={getStatusColor(prestamo.status) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                      {formatDate(prestamo.createdAt)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

