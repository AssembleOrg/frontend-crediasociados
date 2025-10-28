'use client'

import React, { memo, useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  TextField,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material'
import {
  Edit,
  Delete,
  Search,
  TrendingUp,
  TrendingDown,
  Payment,
  CallMade,
  Handshake,
  LocalGasStation,
  DirectionsCar,
  ShoppingCart,
  MoreHoriz,
  AccountBalance
} from '@mui/icons-material'
import type { Transaccion, TransaccionTipo } from '@/types/operativa'
import { INGRESO_TIPOS, EGRESO_TIPOS } from '@/types/operativa'

interface TransaccionesTableProps {
  transacciones: Transaccion[]
  isLoading?: boolean
  onEdit?: (transaccion: Transaccion) => void
  onDelete?: (id: string) => void
  showActions?: boolean
}

const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('es-AR')}`
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getTransaccionIcon = (transaccion: Transaccion) => {
  if (transaccion.tipo === 'ingreso') {
    const meta = INGRESO_TIPOS[transaccion.subTipo as keyof typeof INGRESO_TIPOS]
    switch (meta.icon) {
      case 'Payment':
        return <Payment fontSize="small" />
      case 'TrendingUp':
        return <TrendingUp fontSize="small" />
      case 'AccountBalance':
        return <AccountBalance fontSize="small" />
      default:
        return <TrendingUp fontSize="small" />
    }
  } else {
    const meta = EGRESO_TIPOS[transaccion.subTipo as keyof typeof EGRESO_TIPOS]
    switch (meta.icon) {
      case 'CallMade':
        return <CallMade fontSize="small" />
      case 'Handshake':
        return <Handshake fontSize="small" />
      case 'LocalGasStation':
        return <LocalGasStation fontSize="small" />
      case 'DirectionsCar':
        return <DirectionsCar fontSize="small" />
      case 'ShoppingCart':
        return <ShoppingCart fontSize="small" />
      case 'MoreHoriz':
        return <MoreHoriz fontSize="small" />
      default:
        return <TrendingDown fontSize="small" />
    }
  }
}

const getTransaccionColor = (tipo: TransaccionTipo): 'success' | 'error' => {
  return tipo === 'ingreso' ? 'success' : 'error'
}

const getTransaccionLabel = (transaccion: Transaccion): string => {
  if (transaccion.tipo === 'ingreso') {
    return INGRESO_TIPOS[transaccion.subTipo as keyof typeof INGRESO_TIPOS]?.label || transaccion.subTipo
  } else {
    return EGRESO_TIPOS[transaccion.subTipo as keyof typeof EGRESO_TIPOS]?.label || transaccion.subTipo
  }
}

const TransaccionesTable = memo(function TransaccionesTable({
  transacciones,
  isLoading = false,
  onEdit,
  onDelete,
  showActions = true
}: TransaccionesTableProps) {
  const [tabValue, setTabValue] = useState<'all' | 'ingreso' | 'egreso'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter by tab
  const filteredByTab = transacciones.filter((t) => {
    if (tabValue === 'all') return true
    return t.tipo === tabValue
  })

  // Filter by search
  const filteredTransacciones = filteredByTab.filter((t) => {
    if (!searchTerm) return true
    return t.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const totalIngresos = filteredTransacciones
    .filter((t) => t.tipo === 'ingreso')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalEgresos = filteredTransacciones
    .filter((t) => t.tipo === 'egreso')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIngresos - totalEgresos

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Registro de Transacciones
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          Cargando transacciones...
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Registro de Transacciones
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingresos y egresos unificados
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Todas" value="all" />
          <Tab label="Ingresos" value="ingreso" icon={<TrendingUp />} iconPosition="start" />
          <Tab label="Egresos" value="egreso" icon={<TrendingDown />} iconPosition="start" />
        </Tabs>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Buscar por descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          size="small"
        />
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Total Ingresos
            </Typography>
            <Typography variant="h5" color="success.main" fontWeight="bold">
              {formatCurrency(totalIngresos)}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Total Egresos
            </Typography>
            <Typography variant="h5" color="error.main" fontWeight="bold">
              {formatCurrency(totalEgresos)}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Balance
            </Typography>
            <Typography
              variant="h5"
              color={balance >= 0 ? 'success.main' : 'error.main'}
              fontWeight="bold"
            >
              {formatCurrency(balance)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="right">Monto</TableCell>
                {showActions && <TableCell align="center">Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransacciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 6 : 5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No hay transacciones registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransacciones.map((transaccion) => (
                  <TableRow key={transaccion.id} hover>
                    <TableCell>
                      <Chip
                        icon={transaccion.tipo === 'ingreso' ? <TrendingUp /> : <TrendingDown />}
                        label={transaccion.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        color={getTransaccionColor(transaccion.tipo)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTransaccionIcon(transaccion)}
                        <Typography variant="body2">
                          {getTransaccionLabel(transaccion)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{transaccion.descripcion}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(transaccion.fecha)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color={transaccion.tipo === 'ingreso' ? 'success.main' : 'error.main'}
                      >
                        {transaccion.tipo === 'ingreso' ? '+' : '-'}
                        {formatCurrency(transaccion.amount)}
                      </Typography>
                    </TableCell>
                    {showActions && (
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          {onEdit && (
                            <IconButton
                              size="small"
                              onClick={() => onEdit(transaccion)}
                              color="primary"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          )}
                          {onDelete && (
                            <IconButton
                              size="small"
                              onClick={() => onDelete(transaccion.id)}
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filteredTransacciones.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">No hay transacciones registradas</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredTransacciones.map((transaccion) => (
              <Card key={transaccion.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Chip
                      icon={transaccion.tipo === 'ingreso' ? <TrendingUp /> : <TrendingDown />}
                      label={transaccion.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      color={getTransaccionColor(transaccion.tipo)}
                      size="small"
                    />
                    {showActions && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {onEdit && (
                          <IconButton size="small" onClick={() => onEdit(transaccion)} color="primary">
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                        {onDelete && (
                          <IconButton size="small" onClick={() => onDelete(transaccion.id)} color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getTransaccionIcon(transaccion)}
                    <Typography variant="subtitle2" fontWeight="bold">
                      {getTransaccionLabel(transaccion)}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {transaccion.descripcion}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(transaccion.fecha)}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={transaccion.tipo === 'ingreso' ? 'success.main' : 'error.main'}
                    >
                      {transaccion.tipo === 'ingreso' ? '+' : '-'}
                      {formatCurrency(transaccion.amount)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  )
})

export default TransaccionesTable
