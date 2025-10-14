/**
 * LoadingStateExample.tsx
 * 
 * Example component showing how to use loading states from DashboardDataProvider
 * instead of blocking overlays.
 * 
 * Copy this pattern to your dashboard components.
 */

'use client';

import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';
import { useDashboardDataProvider } from '@/components/providers/DashboardDataProvider';
import { useFinanzasStore } from '@/stores/finanzas';

/**
 * Example 1: Simple Loading State
 */
export function FinanzasSummaryCard() {
  const { loadingStates } = useDashboardDataProvider();
  const { financialSummary } = useFinanzasStore();

  if (loadingStates.finanzas) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Resumen Financiero</Typography>
        <Typography variant="h4">
          ${financialSummary?.totalCapital || 0}
        </Typography>
      </CardContent>
    </Card>
  );
}

/**
 * Example 2: Loading State with Refresh
 */
export function OperativaSection() {
  const { loadingStates, refreshOperativa } = useDashboardDataProvider();
  const { transacciones } = useFinanzasStore();

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Operativa</Typography>
          <button onClick={refreshOperativa} disabled={loadingStates.operativa}>
            {loadingStates.operativa ? 'Cargando...' : 'Refrescar'}
          </button>
        </Box>

        {loadingStates.operativa ? (
          <Box mt={2}>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={60} />
          </Box>
        ) : (
          <Box mt={2}>
            {transacciones.map((t) => (
              <Typography key={t.id}>{t.description}</Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Example 3: Conditional Rendering Based on Loading
 */
export function SubLoansTable() {
  const { loadingStates, isInitialLoading } = useDashboardDataProvider();
  const { todayDueSubLoans } = useFinanzasStore();

  // Show nothing during initial load
  if (isInitialLoading) {
    return null;
  }

  // Show skeleton during refresh
  if (loadingStates.subLoans) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  // Show empty state
  if (todayDueSubLoans.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            No hay cuotas vencidas hoy
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Show data
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Cuotas Vencidas Hoy</Typography>
        {/* Table content */}
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Multiple Loading States
 */
export function DashboardOverview() {
  const { loadingStates, isInitialLoading } = useDashboardDataProvider();

  const isAnyLoading = 
    loadingStates.subLoans || 
    loadingStates.operativa || 
    loadingStates.finanzas;

  return (
    <Box>
      {/* Global loading indicator (non-blocking) */}
      {isAnyLoading && !isInitialLoading && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 70, 
            right: 20, 
            zIndex: 1000,
            bgcolor: 'primary.main',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1
          }}
        >
          <Typography variant="caption">Actualizando datos...</Typography>
        </Box>
      )}

      {/* Sections load independently */}
      <Box display="grid" gap={2}>
        <FinanzasSummaryCard />
        <OperativaSection />
        <SubLoansTable />
      </Box>
    </Box>
  );
}

/**
 * Example 5: Error State Handling
 */
export function FinanzasWithErrorHandling() {
  const { loadingStates, refreshFinanzas } = useDashboardDataProvider();
  const { financialSummary } = useFinanzasStore();

  if (loadingStates.finanzas) {
    return <Skeleton variant="rectangular" height={200} />;
  }

  // If no data after loading, show error state
  if (!financialSummary) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">
            Error al cargar datos financieros
          </Typography>
          <button onClick={refreshFinanzas}>
            Reintentar
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Finanzas</Typography>
        {/* Content */}
      </CardContent>
    </Card>
  );
}

/**
 * Usage in Dashboard Pages:
 * 
 * // app/dashboard/subadmin/page.tsx
 * import { FinanzasSummaryCard, OperativaSection } from '@/components/dashboard/LoadingStateExample';
 * 
 * export default function SubadminDashboard() {
 *   return (
 *     <Box>
 *       <FinanzasSummaryCard />
 *       <OperativaSection />
 *     </Box>
 *   );
 * }
 */



