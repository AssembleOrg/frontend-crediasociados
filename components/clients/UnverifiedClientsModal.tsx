'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
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
  Button,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material'
import { Close, VerifiedUser, Phone, Home, CheckCircle, Search, Warning } from '@mui/icons-material'
import { clientsService } from '@/services/clients.service'

interface UnverifiedClientsModalProps {
  open: boolean
  onClose: () => void
}

export default function UnverifiedClientsModal({ open, onClose }: UnverifiedClientsModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [clients, setClients] = useState<Array<{
    id: string
    nombre: string
    telefono?: string
    direccion?: string
  }>>([])
  const [totalClients, setTotalClients] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [clientToVerify, setClientToVerify] = useState<{ id: string; nombre: string } | null>(null)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (open) {
      loadUnverifiedClients()
    }
  }, [open])

  const loadUnverifiedClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await clientsService.getUnverifiedClients()
      setClients(data.clients || [])
      setTotalClients(data.total || 0)
    } catch (err: any) {
      // Error loading unverified clients
      setError(err.response?.data?.message || 'Error al cargar los clientes no verificados')
      setClients([])
      setTotalClients(0)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyClick = (client: { id: string; nombre: string }) => {
    setClientToVerify(client)
    setConfirmDialogOpen(true)
    setConfirmText('')
  }

  const handleConfirmClose = () => {
    setConfirmDialogOpen(false)
    setClientToVerify(null)
    setConfirmText('')
  }

  const handleVerifyClient = async () => {
    if (!clientToVerify) return
    
    if (confirmText.toLowerCase().trim() !== 'confirmar') {
      return
    }

    setConfirmDialogOpen(false)
    setVerifyingIds(prev => new Set(prev).add(clientToVerify.id))
    
    try {
      await clientsService.verifyClient(clientToVerify.id)
      // Remove client from list and update total
      setClients(prev => prev.filter(c => c.id !== clientToVerify.id))
      setTotalClients(prev => Math.max(0, prev - 1))
    } catch (err: any) {
      // Error verifying client
      setError(err.response?.data?.message || 'Error al verificar el cliente')
    } finally {
      setVerifyingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(clientToVerify.id)
        return newSet
      })
      setClientToVerify(null)
      setConfirmText('')
    }
  }

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) {
      return clients
    }
    
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
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VerifiedUser sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" component="div" fontWeight={600}>
              Clientes No Verificados
            </Typography>
            {totalClients > 0 && (
              <Chip 
                label={`${totalClients} pendiente${totalClients !== 1 ? 's' : ''}`}
                size="small"
                sx={{ 
                  mt: 0.5,
                  bgcolor: 'error.main',
                  color: 'white',
                  fontWeight: 600,
                  height: 24
                }}
              />
            )}
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
        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando clientes no verificados...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && clients.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <VerifiedUser sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay clientes pendientes de verificación
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Todos los clientes de tus managers están verificados
            </Typography>
          </Box>
        )}

        {/* Clients Table */}
        {!loading && !error && clients.length > 0 && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Clientes Pendientes de Verificación
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {searchQuery && (
                  <Chip 
                    label={`${filteredClients.length} de ${totalClients}`}
                    color="info"
                    size="small"
                  />
                )}
                <Chip 
                  label={`${totalClients} cliente${totalClients !== 1 ? 's' : ''}`}
                  color="warning"
                  size="small"
                />
              </Box>
            </Box>

            {/* Search Input */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, teléfono o dirección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  }
                }}
              />
            </Box>

            {/* No Search Results */}
            {searchQuery && filteredClients.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Search sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No se encontraron resultados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Intenta con otros términos de búsqueda
                </Typography>
              </Box>
            )}
            {(!searchQuery || filteredClients.length > 0) && (
              <TableContainer 
                component={Paper} 
                elevation={0}
                sx={{ 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  overflow: 'auto',
                  maxHeight: isMobile ? 'calc(100vh - 380px)' : 'calc(90vh - 330px)'
                }}
              >
                <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha('#FFD700', 0.1) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                      {!isMobile && (
                        <TableCell sx={{ fontWeight: 600 }}>Teléfono</TableCell>
                      )}
                      {!isMobile && (
                        <TableCell sx={{ fontWeight: 600 }}>Dirección</TableCell>
                      )}
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredClients.map((client) => {
                    const isVerifying = verifyingIds.has(client.id)
                    return (
                      <TableRow 
                        key={client.id}
                        sx={{ 
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.warning.main, 0.02) 
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">
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
                        <TableCell align="right">
                          <Tooltip title="Verificar cliente">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={isVerifying ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                              onClick={() => handleVerifyClick(client)}
                              disabled={isVerifying}
                              sx={{
                                minWidth: { xs: 'auto', sm: 140 },
                                px: { xs: 1.5, sm: 2 }
                              }}
                            >
                              {isMobile ? '' : 'Verificar'}
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleConfirmClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          pb: 1
        }}>
          <Warning sx={{ color: 'warning.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>
            Confirmar Verificación
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 1 }}>
            <Typography variant="body1" paragraph>
              Estás a punto de verificar al cliente{' '}
              <Box component="span" sx={{ fontWeight: 600 }}>
                {clientToVerify?.nombre}
              </Box>
              .
            </Typography>
            <Alert severity="info" sx={{ mb: 3, mt: 2 }}>
              Una vez verificado, el cobrador podrá comenzar a otorgar préstamos a este cliente.
            </Alert>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Para confirmar, escribe{' '}
              <Box component="span" sx={{ fontWeight: 600 }}>
                "confirmar"
              </Box>
              {' '}en el campo a continuación:
            </Typography>
            <TextField
              fullWidth
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe 'confirmar' aquí"
              sx={{ mt: 2 }}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleConfirmClose} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleVerifyClient}
            variant="contained"
            color="success"
            disabled={confirmText.toLowerCase().trim() !== 'confirmar'}
            startIcon={<CheckCircle />}
          >
            Verificar Cliente
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}


