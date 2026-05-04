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
  InputAdornment,
  Snackbar,
} from '@mui/material'
import { Close, VerifiedUser, Phone, Home, CheckCircle, Search, Work, Description } from '@mui/icons-material'
import { clientsService } from '@/services/clients.service'
// commented by july
// import { blacklistService } from '@/services/blacklist.service'

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
    dni?: string
    telefono?: string
    direccion?: string
    work?: string
    description?: string
  }>>([])
  const [totalClients, setTotalClients] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [clientToVerify, setClientToVerify] = useState<{ id: string; nombre: string; dni?: string } | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })
  // commented by july
  // const [blacklistWarning, setBlacklistWarning] = useState<string | null>(null)

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

  const handleVerifyClick = async (client: { id: string; nombre: string; dni?: string }) => {
    setClientToVerify(client)
    setConfirmText('')

    // commented by july
    // if (client.dni) {
    //   try {
    //     const result = await blacklistService.checkDni(client.dni)
    //     if (result.isBlacklisted && result.entry) {
    //       setBlacklistWarning(
    //         `CLIENTE EN LISTA NEGRA: ${result.entry.fullName} (DNI: ${result.entry.dni}) - Motivo: ${result.entry.reason}`
    //       )
    //     }
    //   } catch {
    //     // If check fails, don't block - just skip warning
    //   }
    // }

    setConfirmDialogOpen(true)
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
    
    const nombreCliente = clientToVerify.nombre
    try {
      await clientsService.verifyClient(clientToVerify.id)
      setClients(prev => prev.filter(c => c.id !== clientToVerify.id))
      setTotalClients(prev => Math.max(0, prev - 1))
      setSnackbar({ open: true, message: `"${nombreCliente}" fue verificado exitosamente`, severity: 'success' })
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error al verificar el cliente', severity: 'error' })
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
      const work = client.work?.toLowerCase() || ''
      const description = client.description?.toLowerCase() || ''
      
      return nombre.includes(query) || 
             telefono.includes(query) || 
             direccion.includes(query) ||
             work.includes(query) ||
             description.includes(query)
    })
  }, [clients, searchQuery])

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
                placeholder="Buscar por nombre, teléfono, dirección, oficio o descripción..."
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
                      {!isMobile && (
                        <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Oficio</TableCell>
                      )}
                      {!isMobile && (
                        <TableCell sx={{ fontWeight: 600, minWidth: 150, maxWidth: 200 }}>Descripción</TableCell>
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
                              {client.work && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Work sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {client.work}
                                  </Typography>
                                </Box>
                              )}
                              {client.description && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 0.5 }}>
                                  <Description sx={{ fontSize: 14, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
                                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {client.description}
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
                        {!isMobile && (
                          <TableCell>
                            {client.work ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Work sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {client.work}
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
                            {client.description ? (
                              <Tooltip title={client.description} arrow>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                  <Description sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      maxWidth: 200, 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      lineHeight: 1.4
                                    }}
                                  >
                                    {client.description}
                                  </Typography>
                                </Box>
                              </Tooltip>
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
                              variant={isVerifying ? 'contained' : 'outlined'}
                              color="success"
                              size="small"
                              startIcon={isVerifying ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                              onClick={() => handleVerifyClick(client)}
                              disabled={isVerifying}
                              sx={{
                                minWidth: { xs: 'auto', sm: 130 },
                                px: { xs: 1.5, sm: 2 },
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.03)',
                                },
                              }}
                            >
                              {isVerifying ? 'Verificando...' : (isMobile ? '' : 'Verificar')}
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
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            m: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 400 },
          }
        }}
      >
        <Box sx={{ px: 3, pt: 3.5, pb: 3 }}>
          {/* Title */}
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: 'text.primary', letterSpacing: -0.3 }}>
            Verificar cliente
          </Typography>

          {/* Subtitle */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            Para habilitar los préstamos a{' '}
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
              {clientToVerify?.nombre}
            </Box>
            , escribe{' '}
            <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
              "confirmar"
            </Box>
            {' '}abajo.
          </Typography>

          {/* Input */}
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && confirmText.toLowerCase().trim() === 'confirmar') handleVerifyClient()
            }}
            placeholder="confirmar"
            autoFocus
            size="small"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                minHeight: 44,
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': { borderColor: 'text.disabled' },
                '&.Mui-focused fieldset': { borderColor: 'text.primary', borderWidth: 1.5 },
              },
              '& input': { fontSize: '0.9375rem' },
            }}
          />

          {/* Botón principal — ancho completo */}
          <Button
            fullWidth
            onClick={handleVerifyClient}
            variant="contained"
            disableElevation
            disabled={confirmText.toLowerCase().trim() !== 'confirmar'}
            sx={{
              minHeight: 48,
              borderRadius: 2,
              fontSize: '0.9375rem',
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: 'success.main',
              '&:hover': { bgcolor: 'success.dark' },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
              mb: 1,
            }}
          >
            Verificar
          </Button>

          {/* Botón cancelar — ghost */}
          <Button
            fullWidth
            onClick={handleConfirmClose}
            variant="text"
            sx={{
              minHeight: 44,
              borderRadius: 2,
              fontSize: '0.9375rem',
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
            }}
          >
            Cancelar
          </Button>
        </Box>
      </Dialog>
    </Dialog>

    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  )
}


