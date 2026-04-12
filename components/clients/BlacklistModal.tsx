'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
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
  Button,
  alpha,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material'
import { Close, Block, Add, Delete, Search } from '@mui/icons-material'
import { blacklistService } from '@/services/blacklist.service'
import type { BlacklistedClient } from '@/services/blacklist.service'
import { DateTime } from 'luxon'

interface BlacklistModalProps {
  open: boolean
  onClose: () => void
}

export default function BlacklistModal({ open, onClose }: BlacklistModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [entries, setEntries] = useState<BlacklistedClient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Add form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDni, setNewDni] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newReason, setNewReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadData()
      setShowAddForm(false)
      setSearchQuery('')
    }
  }, [open])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await blacklistService.getAll()
      setEntries(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar la lista negra')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newDni.trim() || !newFullName.trim() || !newReason.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      await blacklistService.add({
        dni: newDni.trim(),
        fullName: newFullName.trim(),
        reason: newReason.trim(),
      })
      setNewDni('')
      setNewFullName('')
      setNewReason('')
      setShowAddForm(false)
      loadData()
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Error al agregar')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await blacklistService.remove(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch {
      // Error removing
    }
  }

  const filtered = searchQuery.trim()
    ? entries.filter(e => {
        const q = searchQuery.toLowerCase()
        return (
          e.fullName.toLowerCase().includes(q) ||
          e.dni.toLowerCase().includes(q) ||
          e.reason.toLowerCase().includes(q)
        )
      })
    : entries

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
          maxHeight: isMobile ? '100vh' : '90vh',
          m: { xs: 0, sm: 2 },
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          pt: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #424242 0%, #616161 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Block sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>
            Lista Negra de Clientes
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 3 }, bgcolor: 'background.default' }}>
        {/* Actions bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', mt: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowAddForm(!showAddForm)}
            sx={{ bgcolor: '#424242', '&:hover': { bgcolor: '#333' } }}
          >
            {showAddForm ? 'Cancelar' : 'Agregar'}
          </Button>
          <TextField
            placeholder="Buscar por nombre, DNI o motivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>

        {/* Add Form */}
        {showAddForm && (
          <Paper sx={{ p: 2, mb: 3, border: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Agregar a Lista Negra
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="DNI"
                value={newDni}
                onChange={(e) => setNewDni(e.target.value)}
                size="small"
                required
              />
              <TextField
                label="Nombre completo"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                size="small"
                required
              />
            </Box>
            <TextField
              label="Motivo"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={2}
              required
              sx={{ mb: 2 }}
            />
            {addError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {addError}
              </Alert>
            )}
            <Button
              variant="contained"
              color="error"
              onClick={handleAdd}
              disabled={adding || !newDni.trim() || !newFullName.trim() || !newReason.trim()}
              startIcon={adding ? <CircularProgress size={16} /> : <Block />}
            >
              {adding ? 'Agregando...' : 'Agregar a Lista Negra'}
            </Button>
          </Paper>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={40} />
          </Box>
        )}

        {/* Error */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {/* Empty */}
        {!loading && !error && entries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Block sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Lista negra vacia
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No hay clientes en la lista negra
            </Typography>
          </Box>
        )}

        {/* Table */}
        {!loading && !error && entries.length > 0 && (
          <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#424242', 0.06) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>DNI</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Motivo</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Fecha</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Accion</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {entry.fullName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{entry.dni}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                        {entry.reason}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption">
                        {DateTime.fromISO(entry.createdAt).toFormat('dd/MM/yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemove(entry.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  )
}
