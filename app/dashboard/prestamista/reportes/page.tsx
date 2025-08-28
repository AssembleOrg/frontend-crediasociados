'use client'

import { useState } from 'react'
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
  CircularProgress,
} from '@mui/material'
import {
  Download,
  Assessment,
  TrendingUp,
  PieChart,
  BarChart,
  DateRange,
} from '@mui/icons-material'
import { useClients } from '@/hooks/useClients'
import { useStats } from '@/hooks/useStats'

type ReportType = 'clients' | 'loans' | 'payments' | 'performance'
type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'custom'

export default function ReportesPage() {
  const { clients } = useClients()
  const { dashboardStats } = useStats()

  const [selectedReport, setSelectedReport] = useState<ReportType>('clients')
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const reportTypes = [
    { value: 'clients', label: 'Reporte de Clientes', icon: <Assessment /> },
    { value: 'loans', label: 'Reporte de Préstamos', icon: <TrendingUp /> },
    { value: 'payments', label: 'Reporte de Pagos', icon: <PieChart /> },
    { value: 'performance', label: 'Rendimiento General', icon: <BarChart /> },
  ]

  const dateRanges = [
    { value: 'week', label: 'Última Semana' },
    { value: 'month', label: 'Último Mes' },
    { value: 'quarter', label: 'Último Trimestre' },
    { value: 'year', label: 'Último Año' },
    { value: 'custom', label: 'Rango Personalizado' },
  ]

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsGenerating(false)
  }

  const handleDownloadReport = (format: 'pdf' | 'excel') => {
    // TODO: Implement actual download logic
    console.log(`Downloading ${selectedReport} report in ${format} format`)
  }

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'clients':
        return (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
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
                    {dashboardStats?.totalActiveLoans || 0}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Monto Total Prestado
                  </Typography>
                  <Typography variant="h4">
                    ${dashboardStats?.totalLoanAmount?.toLocaleString() || 0}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tasa de Pago Promedio
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {dashboardStats?.averagePaymentRate || 0}%
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
                    85%
                  </Typography>
                  <Typography color="textSecondary">
                    Pagos a Tiempo
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography color="warning.main" variant="h4">
                    10%
                  </Typography>
                  <Typography color="textSecondary">
                    Pagos Atrasados
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography color="error.main" variant="h4">
                    5%
                  </Typography>
                  <Typography color="textSecondary">
                    En Mora
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">
                    $125,000
                  </Typography>
                  <Typography color="textSecondary">
                    Cobrado Este Mes
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )

      case 'performance':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Indicadores de Rendimiento
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Card>
                <CardContent>
                  <Typography gutterBottom variant="h6">
                    Eficiencia de Cobranza
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" color="success.main">
                      92%
                    </Typography>
                    <TrendingUp color="success" />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    +5% respecto al mes anterior
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography gutterBottom variant="h6">
                    Tiempo Promedio de Aprobación
                  </Typography>
                  <Typography variant="h4" color="primary">
                    2.3 días
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Dentro del objetivo de 3 días
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography gutterBottom variant="h6">
                    Satisfacción del Cliente
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    4.8/5
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Basado en 127 evaluaciones
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography gutterBottom variant="h6">
                    ROI Promedio
                  </Typography>
                  <Typography variant="h4" color="primary">
                    18.5%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Retorno sobre inversión anual
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
              disabled={isGenerating}
              sx={{ flexGrow: 1 }}
            >
              {isGenerating ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Generando...
                </>
              ) : (
                <>
                  <Assessment sx={{ mr: 1 }} />
                  Generar
                </>
              )}
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