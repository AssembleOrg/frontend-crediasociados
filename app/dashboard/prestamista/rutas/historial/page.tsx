'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Stack,
} from '@mui/material';
import {
  History,
  Refresh,
  ExpandMore,
  ExpandLess,
  CalendarToday,
} from '@mui/icons-material';
import { usePathname } from 'next/navigation';
import { useCollectionRoutes } from '@/hooks/useCollectionRoutes';
import { RouteStats } from '@/components/routes/RouteStats';
import { DateTime } from 'luxon';

/**
 * Route History Page - Mobile-First
 * Shows historical closed routes
 */
export default function RutasHistorialPage() {
  const pathname = usePathname();
  const { routes, isLoading, error, fetchRoutes } = useCollectionRoutes();

  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [dateFilter ] = useState({
    dateFrom: DateTime.now().startOf('month').toISODate() || '',
    dateTo: DateTime.now().endOf('month').toISODate() || '',
  });

  // Fetch routes on mount
  useEffect(() => {
    console.log('🔄 Route history page mounted');
    fetchRoutes({
      status: 'CLOSED',
      dateFrom: dateFilter.dateFrom,
      dateTo: dateFilter.dateTo,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleRefresh = () => {
    fetchRoutes({
      status: 'CLOSED',
      dateFrom: dateFilter.dateFrom,
      dateTo: dateFilter.dateTo,
    });
  };

  const toggleExpand = (routeId: string) => {
    setExpandedRouteId(expandedRouteId === routeId ? null : routeId);
  };

  const formatDate = (dateString: string) => {
    return DateTime.fromISO(dateString).setLocale('es').toFormat("cccc, d 'de' MMMM yyyy");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <History color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Historial de Rutas
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Consulta rutas cerradas del mes actual
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <IconButton
            onClick={handleRefresh}
            disabled={isLoading}
            size="small"
            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
          >
            <Refresh />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isLoading}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {isLoading && routes.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No routes */}
      {!isLoading && routes.length === 0 && (
        <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          <History sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No hay rutas cerradas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Aquí aparecerán las rutas cerradas del mes actual.
          </Typography>
        </Paper>
      )}

      {/* Routes List */}
      {routes.length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {routes.length} ruta{routes.length !== 1 ? 's' : ''} encontrada
            {routes.length !== 1 ? 's' : ''}
          </Typography>

          <Stack spacing={2}>
            {routes.map((route) => (
              <Card
                key={route.id}
                elevation={2}
                sx={{
                  borderLeft: 4,
                  borderLeftColor: 'success.main',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  {/* Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            textTransform: 'capitalize',
                          }}
                        >
                          {formatDate(route.routeDate)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Cerrada el {DateTime.fromISO(route.closedAt || route.updatedAt).setLocale('es').toFormat('dd/MM/yyyy HH:mm')}
                      </Typography>
                    </Box>
                    <Chip label="Cerrada" color="success" size="small" />
                  </Box>

                  {/* Stats Summary */}
                  <Box sx={{ mb: 2 }}>
                    <RouteStats
                      totalCollected={route.totalCollected}
                      totalExpenses={route.totalExpenses}
                      netAmount={route.netAmount}
                    />
                  </Box>

                  {/* Client Stats */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                      gap: 2,
                      mb: 2,
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Total Clientes:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {route.items.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Clientes Pagados:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {route.items.filter((item) => item.subLoan.status === 'PAID').length}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Expand Button */}
                  <Button
                    fullWidth
                    variant="text"
                    size="small"
                    endIcon={expandedRouteId === route.id ? <ExpandLess /> : <ExpandMore />}
                    onClick={() => toggleExpand(route.id)}
                    sx={{ textTransform: 'none' }}
                  >
                    {expandedRouteId === route.id ? 'Ver menos' : 'Ver detalles'}
                  </Button>

                  {/* Expanded Details */}
                  {expandedRouteId === route.id && (
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }} />

                      {/* Notes */}
                      {route.notes && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                            Notas del Cierre:
                          </Typography>
                          <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2" color="text.secondary">
                              {route.notes}
                            </Typography>
                          </Paper>
                        </Box>
                      )}

                      {/* Clients List */}
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Clientes ({route.items.length}):
                      </Typography>
                      <Stack spacing={1}>
                        {route.items.map((item, index) => (
                          <Paper
                            key={item.id}
                            elevation={0}
                            sx={{
                              p: 2,
                              bgcolor: 'grey.50',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 1,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                #{index + 1} - {item.clientName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Cuota #{item.subLoan.paymentNumber}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color="success.main"
                              >
                                {formatCurrency(item.amountCollected)}
                              </Typography>
                              <Chip
                                label={item.subLoan.status}
                                size="small"
                                color={
                                  item.subLoan.status === 'PAID' ? 'success' : 'default'
                                }
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

