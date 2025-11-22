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
  Divider
} from '@mui/material'
import { Close, PersonOff, Phone, Home, CalendarToday, Search } from '@mui/icons-material'
import { clientsService } from '@/services/clients.service'
import { useUsers } from '@/hooks/useUsers'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface InactiveClientsModalProps {
  open: boolean
  onClose: () => void
}

export default function InactiveClientsModal({ open, onClose }: InactiveClientsModalProps) {
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
    fechaUltimoPrestamo?: string
  }>>([])
  const [totalClients, setTotalClients] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      loadInactiveClients()
    } else if (open && !managerIdToUse && isSubadmin) {
      setClients([])
      setTotalClients(0)
      setError(null)
    }
    // Reset search when manager changes or modal opens
    if (open) {
      setSearchQuery('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, managerIdToUse, isSubadmin])

  const loadInactiveClients = async () => {
    if (!managerIdToUse) return

    setLoading(true)
    setError(null)
    try {
      const data = await clientsService.getInactiveClients(managerIdToUse)
      setClients(data.clients || [])
      setTotalClients(data.total || 0)
    } catch (err: any) {
      // Error loading inactive clients
      setError(err.response?.data?.message || 'Error al cargar los clientes inactivos')
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
      
      return nombre.includes(query) || 
             telefono.includes(query) || 
             direccion.includes(query)
    })
  }, [clients, searchQuery])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
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
        background: 'linear-gradient(135deg, #85220D 0%, #A03015 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonOff sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>
            Clientes Inactivos
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
            <Box sx={{ mb: 3, p: 2, bgcolor: alpha('#85220D', 0.1), borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Tus Clientes Inactivos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser.fullName} ({currentUser.email})
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
          </>
        )}

        {/* Search Input */}
        {managerIdToUse && !loading && !error && clients.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, teléfono o dirección..."
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
              Cargando clientes inactivos...
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
            <PersonOff sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Selecciona un manager
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Elige un manager del selector para ver sus clientes inactivos
            </Typography>
          </Box>
        )}

        {/* Empty State - No Clients */}
        {managerIdToUse && !loading && !error && clients.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PersonOff sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay clientes inactivos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isManager 
                ? 'No tienes clientes sin préstamos activos'
                : `${selectedManagerData?.fullName || 'Este manager'} no tiene clientes sin préstamos activos`
              }
            </Typography>
          </Box>
        )}

        {/* Clients Table */}
        {managerIdToUse && !loading && !error && clients.length > 0 && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Clientes Sin Préstamos Activos
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {searchQuery && (
                  <Chip 
                    label={`${filteredClients.length} de ${totalClients}`}
                    color="info"
                    size="small"
                  />
                )}
                <Chip 
                  label={`${totalClients} cliente${totalClients !== 1 ? 's' : ''}`}
                  color="primary"
                  size="small"
                />
              </Box>
            </Box>
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'auto',
                maxHeight: isMobile ? 'calc(100vh - 400px)' : 'calc(90vh - 350px)'
              }}
            >
              <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#85220D', 0.1) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                    {!isMobile && (
                      <TableCell sx={{ fontWeight: 600 }}>Teléfono</TableCell>
                    )}
                    {!isMobile && (
                      <TableCell sx={{ fontWeight: 600 }}>Dirección</TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 600 }}>Último Préstamo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isMobile ? 2 : 4} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron clientes que coincidan con "{searchQuery}"
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                    <TableRow 
                      key={client.id}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.primary.main, 0.02) 
                        },
                        '&:last-child td': { border: 0 }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {client.nombre}
                        </Typography>
                        {isMobile && (
                          <>
                            {client.telefono && (
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5, 
                                  mt: 0.5,
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
                                <Phone sx={{ fontSize: 14, color: 'success.main' }} />
                                <Typography 
                                  variant="caption" 
                                  color="success.main"
                                  sx={{ textDecoration: 'underline' }}
                                >
                                  {client.telefono}
                                </Typography>
                              </Box>
                            )}
                            {client.direccion && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <Home sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {client.direccion}
                                </Typography>
                              </Box>
                            )}
                          </>
                        )}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          {client.telefono ? (
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
                              <Typography 
                                variant="body2"
                                color="success.main"
                                sx={{ textDecoration: 'underline' }}
                              >
                                {client.telefono}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>
                          {client.direccion ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Home sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {client.direccion}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {client.fechaUltimoPrestamo ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {formatDate(client.fechaUltimoPrestamo)}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip 
                            label="Sin préstamos"
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

