'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Download,
  Assessment,
  TrendingUp,
  PieChart,
  DateRange,
} from '@mui/icons-material'
import { useClients } from '@/hooks/useClients'
import { useLoans } from '@/hooks/useLoans'
import { useSubLoans } from '@/hooks/useSubLoans'
import { getUrgencyLevel } from '@/lib/cobros/urgencyHelpers'

type ReportType = 'clients' | 'loans' | 'payments'
type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'custom'

export default function ReportesPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

  const { clients } = useClients()
  const { loans } = useLoans()
  const { allSubLoansWithClient } = useSubLoans()

  const [selectedReport, setSelectedReport] = useState<ReportType>('clients')
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const realStats = useMemo(() => {
    const totalActiveLoans = loans.length
    const totalLoanAmount = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0)

    const paidSubLoans = allSubLoansWithClient.filter(s => s.status === 'PAID')
    const overdueSubLoans = allSubLoansWithClient.filter(s => s.dueDate && getUrgencyLevel(s.dueDate) === 'overdue')
    const partialSubLoans = allSubLoansWithClient.filter(s => s.status === 'PARTIAL')

    const totalSubLoans = allSubLoansWithClient.length
    const paymentsOnTimeRate = totalSubLoans > 0 ? Math.round((paidSubLoans.length / totalSubLoans) * 100) : 0
    const overdueRate = totalSubLoans > 0 ? Math.round((overdueSubLoans.length / totalSubLoans) * 100) : 0
    const partialRate = totalSubLoans > 0 ? Math.round((partialSubLoans.length / totalSubLoans) * 100) : 0

    const totalCollected = paidSubLoans.reduce((sum, s) => sum + (s.amount || 0), 0)
    const totalPending = allSubLoansWithClient.reduce((sum, s) => sum + (s.amount || 0), 0) - totalCollected

    const collectionEfficiency = totalSubLoans > 0 ? Math.round(((paidSubLoans.length + partialSubLoans.length) / totalSubLoans) * 100) : 0

    return {
      totalActiveLoans,
      totalLoanAmount,
      paymentsOnTimeRate,
      overdueRate,
      partialRate,
      totalCollected,
      totalPending,
      collectionEfficiency,
      totalClients: clients.length
    }
  }, [clients, loans, allSubLoansWithClient])

  const reportTypes = [
    { value: 'clients', label: 'Reporte de Clientes', icon: <Assessment /> },
    { value: 'loans', label: 'Reporte de Préstamos', icon: <TrendingUp /> },
    { value: 'payments', label: 'Reporte de Pagos', icon: <PieChart /> },
  ]

  const dateRanges = [
    { value: 'week', label: 'Última Semana' },
    { value: 'month', label: 'Último Mes' },
    { value: 'quarter', label: 'Último Trimestre' },
    { value: 'year', label: 'Último Año' },
    { value: 'custom', label: 'Rango Personalizado' },
  ]

  const handleGenerateReport = () => {
    // Report is already generated with real data
  }

  const handleDownloadReport = (format: 'pdf' | 'excel') => {
    // TODO: Implement actual download logic
    console.log(`Downloading ${selectedReport} report in ${format} format`)
  }

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'clients':
        return (
          <Box sx={{ mt: 2 }}>
            {/* Desktop Table View */}
            {!isMobile && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>DNI</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Teléfono</TableCell>
                      <TableCell>Fecha de Registro</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients.slice(0, 10).map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.fullName}</TableCell>
                        <TableCell>{client.dni || '-'}</TableCell>
                        <TableCell>{client.email || '-'}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                        <TableCell>
                          {client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-AR') : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip label="Activo" color="success" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Mobile Card View */}
            {isMobile && (
              <Grid container spacing={2}>
                {clients.slice(0, 10).map((client) => (
                  <Grid size={{ xs: 12 }} key={client.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {client.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {client.email || '-'}
                            </Typography>
                          </Box>
                          <Chip label="Activo" color="success" size="small" />
                        </Box>

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              DNI
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {client.dni || '-'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              Teléfono
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {client.phone || '-'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              Fecha de Registro
                            </Typography>
                            <Typography variant="body2">
                              {client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-AR') : '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )

      case 'loans':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resumen de Préstamos
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Préstamos Activos
                  </Typography>
                  <Typography variant="h4">
                    {realStats.totalActiveLoans}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Monto Total Prestado
                  </Typography>
                  <Typography variant="h4">
                    ${realStats.totalLoanAmount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tasa de Pago Promedio
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {realStats.paymentsOnTimeRate}%
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )

      case 'payments':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Estado de Pagos
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography color="success.main" variant="h4">
                    {realStats.paymentsOnTimeRate}%
                  </Typography>
                  <Typography color="textSecondary">
                    Pagos a Tiempo
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography color="warning.main" variant="h4">
                    {realStats.partialRate}%
                  </Typography>
                  <Typography color="textSecondary">
                    Pagos Parciales
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography color="error.main" variant="h4">
                    {realStats.overdueRate}%
                  </Typography>
                  <Typography color="textSecondary">
                    Vencidos
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">
                    ${realStats.totalCollected.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary">
                    Cobrado Total
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reportes
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Genera y descarga reportes detallados de tu actividad comercial
      </Typography>

      {/* Report Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configuración del Reporte
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Tipo de Reporte</InputLabel>
            <Select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value as ReportType)}
              label="Tipo de Reporte"
            >
              {reportTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Período</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              label="Período"
            >
              {dateRanges.map((range) => (
                <MenuItem key={range.value} value={range.value}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              sx={{ flexGrow: 1 }}
            >
              <Assessment sx={{ mr: 1 }} />
              Generar
            </Button>
          </Box>
        </Box>

        {dateRange === 'custom' && (
          <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <TextField
              label="Fecha de Inicio"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Fecha de Fin"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        )}
      </Paper>

      {/* Download Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="subtitle1">
            Descargar Reporte:
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleDownloadReport('pdf')}
          >
            PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleDownloadReport('excel')}
          >
            Excel
          </Button>
        </Box>
      </Paper>

      {/* Report Content */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <DateRange color="primary" />
          <Typography variant="h6">
            {reportTypes.find(t => t.value === selectedReport)?.label}
          </Typography>
          <Chip
            label={dateRanges.find(d => d.value === dateRange)?.label}
            color="primary"
            size="small"
          />
        </Box>

        {renderReportContent()}
      </Paper>
    </Box>
  )
}