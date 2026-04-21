'use client';

import { useEffect, useState, useMemo } from 'react';
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
  Skeleton,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Route as RouteIcon,
  SwapVert,
  Info,
  Save,
  Close as CloseIcon,
  AttachMoney,
  Warning,
} from '@mui/icons-material';
import { usePathname } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCollectionRoutes } from '@/hooks/useCollectionRoutes';
import { useLoans } from '@/hooks/useLoans';
import { useSubLoans } from '@/hooks/useSubLoans';
import { RouteStats } from '@/components/routes/RouteStats';
import { RouteItemCard, type RouteItemCardProps } from '@/components/routes/RouteItemCard';
import { CloseRouteModal } from '@/components/routes/CloseRouteModal';
import { PaymentModal } from '@/components/loans/PaymentModal';
import { RouteExpenseModal } from '@/components/routes/RouteExpenseModal';
import { RouteDatePicker } from '@/components/routes/RouteDatePicker';
import { RouteItemDetailModal } from '@/components/routes/RouteItemDetailModal';
import { RouteItemBottomSheet } from '@/components/routes/RouteItemBottomSheet';
import { CollectionRouteItem } from '@/services/collection-routes.service';
import collectionRoutesService from '@/services/collection-routes.service';
import RescheduleDateDialog from '@/components/loans/RescheduleDateDialog';
import { paymentsService } from '@/services/payments.service';
import { collectorWalletService } from '@/services/collector-wallet.service';
import { subLoansService, type OverdueClientEntry } from '@/services/sub-loans.service';
import { DateTime } from 'luxon';
import { AccountBalanceWallet } from '@mui/icons-material';

/**
 * Sortable wrapper for RouteItemCard using @dnd-kit
 */
interface SortableRouteItemProps {
  item: CollectionRouteItem;
  index: number;
  overdueCount: number;
  onPayment?: (item: CollectionRouteItem) => void;
  onReset?: (item: CollectionRouteItem) => void;
  onCardClick?: (item: CollectionRouteItem) => void;
  resettingSubloanId?: string | null;
  isRouteClosed?: boolean;
}

function SortableRouteItem({ item, index, overdueCount, onPayment, onReset, onCardClick, resettingSubloanId, isRouteClosed }: SortableRouteItemProps) {
  const {
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        ...(isDragging && {
          zIndex: 1,
        }),
      }}
    >
      <RouteItemCard
        item={item}
        index={index}
        overdueCount={overdueCount}
        onPayment={onPayment}
        onReset={onReset}
        onCardClick={onCardClick}
        isActive={!isRouteClosed && false} // Disable payment in reorder mode (always false), and if route is closed
        isDragging={isDragging}
        resettingSubloanId={resettingSubloanId}
        dragHandleProps={listeners}
      />
    </Box>
  );
}

/**
 * Daily Collection Route Page - Mobile-First
 * Shows today's active route with all clients to visit
 */
export default function RutasPage() {
  const pathname = usePathname();
  const {
    todayRoute,
    selectedRoute,
    selectedDate,
    isLoading,
    error,
    fetchTodayRoute,
    fetchRouteByDate,
    closeRoute,
    updateRouteOrder,
  } = useCollectionRoutes();
  const { fetchLoans } = useLoans();
  const { fetchAllSubLoansWithClientInfo } = useSubLoans();

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionRouteItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<CollectionRouteItem | null>(null);
  // Search & filter state (iOS filter bar)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'debt'>('pending');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetConfirmModalOpen, setResetConfirmModalOpen] = useState(false);
  const [itemToReset, setItemToReset] = useState<CollectionRouteItem | null>(null);
  const [resettingSubloanId, setResettingSubloanId] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [rescheduleItem, setRescheduleItem] = useState<CollectionRouteItem | null>(null);
  
  // Drag & Drop State
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedItems, setReorderedItems] = useState<CollectionRouteItem[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  
  // Wallet Balance State
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWalletBalance, setLoadingWalletBalance] = useState(false);
  const [walletDayLabel, setWalletDayLabel] = useState<string>('');

  // Overdue map: loanTrack → count of overdue installments (single fetch, no N+1)
  const [overdueClients, setOverdueClients] = useState<OverdueClientEntry[]>([]);

  // Fetch route on mount and when pathname changes
  useEffect(() => {
    // Rutas page mounted/changed
    fetchTodayRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    setLoadingWalletBalance(true);
    try {
      const balanceData = await collectorWalletService.getMyBalance();
      setWalletBalance(balanceData.balance);
    } catch (error) {
      // Error fetching wallet balance - set to null to show loading state
      setWalletBalance(null);
    } finally {
      setLoadingWalletBalance(false);
    }
  };

  // Fetch wallet balance on mount
  useEffect(() => {
    fetchWalletBalance();
  }, []);

  // Single fetch for overdue data — builds loanTrack → overdueCount map (no N+1)
  useEffect(() => {
    subLoansService.getOverdueClients()
      .then((res) => setOverdueClients(res?.clients ?? []))
      .catch(() => { /* graceful degradation — cards show 0 badge */ });
  }, []);

  // O(1) lookup per card: loanTrack → total overdue installment count
  const overdueMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const entry of overdueClients) {
      for (const loan of entry.loans) {
        map[loan.loanTrack] = (map[loan.loanTrack] ?? 0) + loan.overdueInstallments.length;
      }
    }
    return map;
  }, [overdueClients]);

  // Avoid hydration mismatches by computing "today" label only on client
  useEffect(() => {
    setWalletDayLabel(DateTime.now().setLocale('es').toFormat("cccc, d 'de' MMMM"));
  }, []);

  // Update reorderedItems when selectedRoute changes
  // Filter out items without subLoan to prevent errors
  useEffect(() => {
    const route = selectedRoute || todayRoute;
    if (route?.items) {
      // Only include items that have a subLoan
      setReorderedItems(route.items.filter(item => item.subLoan != null));
    }
  }, [selectedRoute, todayRoute]);

  const handleRefresh = () => {
    setSuccessMessage(null);
    if (selectedDate) {
      fetchRouteByDate(selectedDate);
    } else {
      fetchTodayRoute();
    }
    // Refresh wallet balance as well
    fetchWalletBalance();
  };

  const handleDateSelect = (date: string) => {
    setSuccessMessage(null);
    setIsReorderMode(false);
    fetchRouteByDate(date);
  };

  const handleTodaySelect = () => {
    setSuccessMessage(null);
    setIsReorderMode(false);
    fetchTodayRoute();
  };

  const handleOpenPaymentModal = (item: CollectionRouteItem) => {
    setSelectedItem(item);
    setPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedItem(null);
  };

  const handleOpenDetailModal = (item: CollectionRouteItem) => {
    setSelectedDetailItem(item);
    // Use BottomSheet on mobile — the old Dialog stays as desktop fallback
    setBottomSheetOpen(true);
    setDetailModalOpen(false);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setBottomSheetOpen(false);
    setSelectedDetailItem(null);
  };

  const handlePaymentFromDetail = (item: CollectionRouteItem) => {
    handleCloseDetailModal();
    handleOpenPaymentModal(item);
  };

  const handlePaymentSuccess = () => {
    // Refresh route to get updated amounts
    fetchTodayRoute();
    // Refresh wallet balance after payment
    fetchWalletBalance();
    // Refresh loans and subloans to update progress (e.g., "6 de 10" -> "9 de 10")
    fetchLoans();
    fetchAllSubLoansWithClientInfo();
  };

  const handleReschedule = (item: CollectionRouteItem) => {
    setRescheduleItem(item);
  };

  const handleRescheduleSave = async (isoDate: string) => {
    if (!rescheduleItem) return;
    await collectionRoutesService.rescheduleRouteItem(
      rescheduleItem.id,
      isoDate + 'T12:00:00.000Z',
    );
    setRescheduleItem(null);
    setSuccessMessage('Cuota reprogramada y eliminada de la ruta');
    // Refresh route data
    fetchTodayRoute();
    fetchAllSubLoansWithClientInfo();
  };

  const handleResetPayments = (item: CollectionRouteItem) => {
    if (!item.subLoanId) return;
    setItemToReset(item);
    setResetConfirmModalOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!itemToReset?.subLoanId) return;

    setResettingSubloanId(itemToReset.subLoanId);
    setResetError(null);
    setResetConfirmModalOpen(false);

    try {
      await paymentsService.resetPayments(itemToReset.subLoanId);
      // Refresh route to get updated amounts
      fetchTodayRoute();
      // Refresh wallet balance after reset
      fetchWalletBalance();
      // Refresh loans and subloans to update progress after reset
      fetchLoans();
      fetchAllSubLoansWithClientInfo();
      setSuccessMessage('✅ Pagos reseteados exitosamente');
      setItemToReset(null);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al resetear los pagos';
      setResetError(errorMessage);
      setSuccessMessage(`❌ ${errorMessage}`);
      setTimeout(() => setResetError(null), 5000);
    } finally {
      setResettingSubloanId(null);
    }
  };

  const handleCancelReset = () => {
    setResetConfirmModalOpen(false);
    setItemToReset(null);
  };

  const handleOpenCloseModal = () => {
    setCloseModalOpen(true);
  };

  const handleCloseCloseModal = () => {
    setCloseModalOpen(false);
  };

  const handleConfirmClose = async (notes: string) => {
    if (!currentRoute) return;

    try {
      await closeRoute(currentRoute.id, { notes });
      setSuccessMessage('✅ Ruta cerrada exitosamente');
      setCloseModalOpen(false);
      await fetchTodayRoute(); // Refresh to show closed status
    } catch (err) {
      // Error closing route
      // Error is handled by the modal
    }
  };

  // Drag & Drop Sensors - Optimized for mobile touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to activate - prevents accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms delay for touch - allows scrolling
        tolerance: 5, // 5px tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag & Drop Handlers
  const handleToggleReorderMode = () => {
    if (isReorderMode) {
      // Cancel reorder - reset to original
      setReorderedItems(todayRoute?.items || []);
    }
    setIsReorderMode(!isReorderMode);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = reorderedItems.findIndex((item) => item.id === active.id);
    const newIndex = reorderedItems.findIndex((item) => item.id === over.id);

    setReorderedItems(arrayMove(reorderedItems, oldIndex, newIndex));
  };

  const handleSaveOrder = async () => {
    if (!currentRoute?.id || !updateRouteOrder) return;

    setIsSavingOrder(true);
    try {
      const orderData = {
        items: reorderedItems.map((item, index) => ({
          itemId: item.id,
          orderIndex: index,
        })),
      };
      await updateRouteOrder(currentRoute.id, orderData);
      setSuccessMessage('✅ Orden actualizado exitosamente');
      setIsReorderMode(false);
      await fetchTodayRoute(); // Refresh to confirm
    } catch (err) {
      // Error saving order
      setSuccessMessage('❌ Error al guardar el orden');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Loading state
  if (isLoading && !todayRoute) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  // Current route to display
  // If a date is selected, only show selectedRoute (even if null)
  // If viewing today, show todayRoute
  const isViewingToday = !selectedDate;
  const currentRoute = isViewingToday ? todayRoute : selectedRoute;

  // Filter items with the new iOS filter bar logic
  const getFilteredItems = (items: CollectionRouteItem[]) => {
    let result = items.filter(item => item.subLoan != null);

    // Search by client name
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(item => item.clientName.toLowerCase().includes(q));
    }

    // Status filter
    switch (statusFilter) {
      case 'pending':
        result = result.filter(item => item.subLoan?.status === 'PENDING' || item.subLoan?.status === 'PARTIAL' || item.subLoan?.status === 'OVERDUE');
        break;
      case 'paid':
        result = result.filter(item => item.subLoan?.status === 'PAID');
        break;
      case 'debt':
        // Items that are OVERDUE themselves
        result = result.filter(item => item.subLoan?.status === 'OVERDUE');
        break;
      default:
        break;
    }

    return result;
  };

  // Keep showOnlyPending as a derived value for backward compat with reorder mode
  const showOnlyPending = statusFilter === 'pending';

  const filteredItems = currentRoute?.items ? getFilteredItems(currentRoute.items) : [];
  const filteredReorderedItems = showOnlyPending
    ? reorderedItems.filter(item => item.subLoan != null && (item.subLoan?.status === 'PENDING' || item.subLoan?.status === 'PARTIAL' || item.subLoan?.status === 'OVERDUE'))
    : reorderedItems.filter(item => item.subLoan != null);

  // No route for selected date
  if (!currentRoute && !isLoading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Date Picker Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Ruta de Cobro
          </Typography>
          <RouteDatePicker
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onTodaySelect={handleTodaySelect}
          />
        </Box>

        <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          <RouteIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isViewingToday ? 'No hay ruta activa para hoy' : 'No hay ruta para esta fecha'}
          </Typography>
          {selectedDate && (
            <Typography variant="body1" color="text.primary" sx={{ mb: 2, fontWeight: 500 }}>
              {DateTime.fromISO(selectedDate).setLocale('es').toFormat("cccc, d 'de' MMMM 'de' yyyy")}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isViewingToday
              ? 'Las rutas se crean automáticamente a las 4:15 AM si hay cobros pendientes para el día.'
              : 'No se encontraron cobros pendientes para la fecha seleccionada. Selecciona otra fecha o regresa a "Hoy".'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<Refresh />} onClick={handleRefresh}>
              Actualizar
            </Button>
            {!isViewingToday && (
              <Button variant="outlined" onClick={handleTodaySelect}>
                Ir a Hoy
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    );
  }

  const isRouteClosed = currentRoute?.status === 'CLOSED';
  const routeDate = currentRoute
    ? DateTime.fromISO(currentRoute.routeDate).setLocale('es').toFormat("cccc, d 'de' MMMM")
    : '';

  return (
    <Box sx={{ p: { xs: 0.5, sm: 2, md: 3 }, maxWidth: 1200, mx: 'auto', pb: { xs: 10, sm: 3 }, bgcolor: '#F2F2F7', minHeight: '100dvh' }}>
      {/* Header - Mobile Optimized */}
      <Box sx={{ mb: 2 }}>
        {/* Title and Date Picker Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: { xs: 1.5, sm: 2 },
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <RouteIcon color="primary" sx={{ fontSize: { xs: 24, sm: 28 } }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  flexWrap: 'wrap'
                }}
              >
                Ruta de Cobro
                {isRouteClosed && <Chip label="Cerrada" color="default" size="small" />}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  textTransform: 'capitalize',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {routeDate}
              </Typography>
            </Box>
          </Box>
          
          {/* Date Picker */}
          <RouteDatePicker
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onTodaySelect={handleTodaySelect}
          />
        </Box>

        {/* Action Buttons - Mobile Grid */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'auto auto auto' },
            gap: 1,
            justifyContent: { sm: 'flex-start' }
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: { xs: 18, sm: 20 } }} />}
            onClick={handleRefresh}
            disabled={isLoading}
            size="small"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 0.75, sm: 1 }
            }}
          >
            Actualizar
          </Button>
          {currentRoute && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<AttachMoney sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              onClick={() => setExpenseModalOpen(true)}
              size="small"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 0.75, sm: 1 }
              }}
            >
              Gastos
            </Button>
          )}
          {!isRouteClosed && todayRoute && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              onClick={handleOpenCloseModal}
              size="small"
              sx={{ 
                gridColumn: { xs: 'span 2', sm: 'auto' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 0.75, sm: 1 }
              }}
            >
              Cerrar Ruta
            </Button>
          )}
        </Box>
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats - Mobile Optimized */}
      {currentRoute && (
        <Box sx={{ mb: { xs: 1.5, sm: 3 } }}>
          <RouteStats
            totalCollected={currentRoute.totalCollected}
            totalExpenses={currentRoute.totalExpenses}
            totalLoaned={currentRoute.totalLoaned}
            netAmount={currentRoute.netAmount}
          />
        </Box>
      )}

      {/* Wallet Balance Card */}
      <Box sx={{ mb: { xs: 1.5, sm: 3 } }}>
        <Card
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, sm: 2 },
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              color: 'primary.main',
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'primary.lighter',
            }}
          >
            <AccountBalanceWallet />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.5 }}
            >
              Wallet de Cobros
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.7rem', display: 'block' }}
            >
              Saldo del día actual{walletDayLabel ? ` (${walletDayLabel})` : ''}
            </Typography>
            {loadingWalletBalance ? (
              <CircularProgress size={20} />
            ) : (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: walletBalance !== null && walletBalance > 0 ? 'success.main' : 'text.primary',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                {walletBalance !== null
                  ? `$${walletBalance.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                  : 'N/A'}
              </Typography>
            )}
          </Box>
        </Card>
      </Box>

      {/* Info Alert - Mobile Compact */}
      {currentRoute && !isRouteClosed && (
        <Alert 
          severity="info" 
          icon={<Info sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
          sx={{ 
            mb: { xs: 1.5, sm: 3 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            '& .MuiAlert-message': {
              py: { xs: 0.5, sm: 1 }
            }
          }}
        >
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Los montos se actualizan automáticamente al registrar pagos. Al cerrar la ruta, se guardarán permanentemente.
          </Typography>
        </Alert>
      )}

      {/* Closed Notes - Mobile Compact */}
      {isRouteClosed && currentRoute?.notes && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: { xs: 1.5, sm: 3 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
            Notas del Cierre:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {currentRoute?.notes}
          </Typography>
        </Alert>
      )}

      {/* Items Header - Mobile Optimized */}
      {currentRoute && currentRoute.items.length > 0 && (
        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          {/* Title and Toggle Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
              mb: 1,
            gap: 1,
              flexWrap: 'wrap',
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '0.938rem', sm: '1.25rem' },
              fontWeight: { xs: 600, sm: 500 }
            }}
          >
              Clientes del Día ({showOnlyPending ? filteredItems.length : currentRoute?.items.length || 0})
            </Typography>
            
            {/* iOS filter chips */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              {(['all', 'pending', 'paid', 'debt'] as const).map((f) => {
                const labels = { all: 'Todos', pending: 'Pendientes', paid: 'Pagados', debt: 'Vencidos' };
                return (
                  <Chip
                    key={f}
                    label={labels[f]}
                    size="small"
                    onClick={() => setStatusFilter(f)}
                    variant={statusFilter === f ? 'filled' : 'outlined'}
                    color={statusFilter === f ? 'primary' : 'default'}
                    sx={{ minHeight: 32, fontWeight: statusFilter === f ? 700 : 500 }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Action Buttons Row */}
          {!isRouteClosed && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
              {isReorderMode ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CloseIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                    onClick={handleToggleReorderMode}
                    disabled={isSavingOrder}
                    sx={{
                      fontSize: { xs: '0.688rem', sm: '0.813rem' },
                      px: { xs: 1, sm: 1.5 },
                      py: { xs: 0.5, sm: 0.75 }
                    }}
                  >
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Cancelar</Box>
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={isSavingOrder ? <CircularProgress size={14} /> : <Save sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                    onClick={handleSaveOrder}
                    disabled={isSavingOrder}
                    sx={{
                      fontSize: { xs: '0.688rem', sm: '0.813rem' },
                      px: { xs: 1, sm: 1.5 },
                      py: { xs: 0.5, sm: 0.75 }
                    }}
                  >
                    {isSavingOrder ? (
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Guardando...</Box>
                    ) : (
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Guardar</Box>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SwapVert sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                  onClick={handleToggleReorderMode}
                  sx={{
                    fontSize: { xs: '0.688rem', sm: '0.813rem' },
                    px: { xs: 1, sm: 1.5 },
                    py: { xs: 0.5, sm: 0.75 }
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Reordenar</Box>
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* iOS Search Bar */}
      {currentRoute && currentRoute.items.length > 0 && (
        <Box
          sx={{
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1,
            py: 0.75,
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: '0.5px solid',
            borderColor: 'divider',
          }}
        >
          <Info sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              flex: 1,
              fontSize: '1rem',
              fontFamily: 'inherit',
              color: 'inherit',
              minWidth: 0,
            }}
          />
          {searchQuery && (
            <Box
              component="button"
              onClick={() => setSearchQuery('')}
              sx={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                p: 0,
                display: 'flex',
                alignItems: 'center',
                color: 'text.disabled',
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </Box>
          )}
        </Box>
      )}

      {/* Route Items - Mobile Optimized with Skeleton Loading */}
      {isLoading ? (
        // Skeleton Loading State
        <Box sx={{ px: { xs: 0, sm: 0 } }}>
          {[1, 2, 3].map((index) => (
            <Card key={index} elevation={1} sx={{ mb: 1 }}>
              <CardContent sx={{ p: { xs: 1.25, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant="circular" width={45} height={28} />
                  <Skeleton variant="text" width="40%" height={24} />
                  <Box sx={{ flex: 1 }} />
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width={85} height={36} sx={{ borderRadius: 1 }} />
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1,
                    mt: 1,
                    pt: 1,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ textAlign: 'center' }}>
                      <Skeleton variant="text" width="60%" height={16} sx={{ mx: 'auto' }} />
                      <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto' }} />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : currentRoute && currentRoute.items.length > 0 ? (
        isReorderMode ? (
          // Drag & Drop Mode with @dnd-kit - Touch enabled
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredReorderedItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Box sx={{ px: { xs: 0, sm: 1 }, py: 0.5 }}>
                {filteredReorderedItems.map((item, index) => (
                  <SortableRouteItem
                    key={item.id}
                    item={item}
                    index={index}
                    overdueCount={overdueMap[item.subLoan?.loan?.loanTrack ?? ''] ?? 0}
                    onPayment={!isRouteClosed ? handleOpenPaymentModal : undefined}
                    onReset={!isRouteClosed ? handleResetPayments : undefined}
                    onCardClick={handleOpenDetailModal}
                    resettingSubloanId={resettingSubloanId}
                    isRouteClosed={isRouteClosed}
                  />
                ))}
              </Box>
            </SortableContext>
          </DndContext>
        ) : (
          // Normal Mode - Optimized spacing for mobile
          <Box sx={{ px: { xs: 0, sm: 0 } }}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
              <RouteItemCard
                key={item.id}
                item={item}
                index={index}
                overdueCount={overdueMap[item.subLoan?.loan?.loanTrack ?? ''] ?? 0}
                onPayment={!isRouteClosed ? handleOpenPaymentModal : undefined}
                onReset={!isRouteClosed ? handleResetPayments : undefined}
                onReschedule={!isRouteClosed ? handleReschedule : undefined}
                onCardClick={handleOpenDetailModal}
                isActive={!isRouteClosed}
                resettingSubloanId={resettingSubloanId}
              />
              ))
            ) : (
              <Paper 
                elevation={1} 
                sx={{ 
                  p: { xs: 3, sm: 4 }, 
                  textAlign: 'center',
                  mx: { xs: 1, sm: 0 }
                }}
              >
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  {showOnlyPending 
                    ? 'No hay cobros pendientes. Desactiva el filtro para ver todos los cobros.'
                    : 'No hay items en esta ruta'
                  }
                </Typography>
              </Paper>
            )}
          </Box>
        )
      ) : (
        <Paper 
          elevation={1} 
          sx={{ 
            p: { xs: 3, sm: 4 }, 
            textAlign: 'center',
            mx: { xs: 1, sm: 0 }
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            No hay items en esta ruta
          </Typography>
        </Paper>
      )}

      {/* Modals */}
      <CloseRouteModal
        open={closeModalOpen}
        onClose={handleCloseCloseModal}
        route={todayRoute}
        onConfirm={handleConfirmClose}
      />

      {selectedItem && selectedItem.subLoan && selectedItem.subLoanId && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={handleClosePaymentModal}
          subloan={{
            id: selectedItem.subLoanId,
            paymentNumber: selectedItem.subLoan.paymentNumber,
            amount: selectedItem.subLoan.amount,
            totalAmount: selectedItem.subLoan.totalAmount,
            paidAmount: selectedItem.subLoan.paidAmount,
            status: selectedItem.subLoan.status,
            dueDate: selectedItem.subLoan.dueDate,
            outstandingBalance: selectedItem.subLoan.outstandingBalance,
            clientName: selectedItem.clientName,
          }}
          clientName={selectedItem.clientName}
          mode="single"
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Expense Modal */}
      {currentRoute && (
        <RouteExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        routeId={currentRoute.id}
        expenses={currentRoute.expenses || []}
        isRouteClosed={isRouteClosed}
        onExpenseUpdated={() => {
            fetchTodayRoute();
            setSuccessMessage('✅ Gastos actualizados');
          }}
        />
      )}

      {/* Detail BottomSheet (iOS-style) — replaces old Dialog on all screen sizes */}
      <RouteItemBottomSheet
        open={bottomSheetOpen}
        onClose={handleCloseDetailModal}
        item={selectedDetailItem}
        isRouteClosed={isRouteClosed}
        onPayment={!isRouteClosed ? handlePaymentFromDetail : undefined}
        onReschedule={!isRouteClosed ? (item) => { handleCloseDetailModal(); handleReschedule(item); } : undefined}
        onReset={!isRouteClosed ? (item) => { handleCloseDetailModal(); handleResetPayments(item); } : undefined}
        resettingSubloanId={resettingSubloanId}
      />

      {/* Legacy Detail Modal — kept for desktop fallback, normally not opened */}
      <RouteItemDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        item={selectedDetailItem}
        onPayment={!isRouteClosed ? handlePaymentFromDetail : undefined}
      />

      {/* Reschedule Date Dialog */}
      <RescheduleDateDialog
        open={!!rescheduleItem}
        onClose={() => setRescheduleItem(null)}
        onSave={handleRescheduleSave}
        title={`Reprogramar Cuota #${rescheduleItem?.subLoan?.paymentNumber || ''} - ${rescheduleItem?.clientName || ''}`}
        currentDueDate={rescheduleItem?.subLoan?.dueDate}
      />

      {/* Reset Confirmation Modal */}
      <Dialog
        open={resetConfirmModalOpen}
        onClose={handleCancelReset}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 3 },
            m: { xs: 1, sm: 2 },
            mt: { xs: 'auto', sm: 2 },
            width: { xs: '100%', sm: 'auto' }
          }
        }}
        sx={{ '& .MuiDialog-container': { alignItems: { xs: 'flex-end', sm: 'center' } } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 1.5,
            pt: 2,
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Warning sx={{ color: 'warning.main', fontSize: 22, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              Resetear cuota #{itemToReset?.subLoan?.paymentNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Esta acción no se puede deshacer
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 2, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              'Todos los pagos registrados de esta cuota',
              'Los efectos en las wallets (créditos revertidos)',
              'Los registros de ruta del día, si aplica',
            ].map((item) => (
              <Box
                key={item}
                sx={{ pl: 1.5, py: 0.5, borderLeft: '3px solid', borderColor: 'warning.main' }}
              >
                <Typography variant="body2" color="text.secondary">{item}</Typography>
              </Box>
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Solo disponible si el último pago fue en las últimas 24 horas.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2,
            pt: 1,
            pb: 'calc(16px + env(safe-area-inset-bottom))',
            gap: 1,
            borderTop: 1,
            borderColor: 'divider'
          }}
        >
          <Button onClick={handleCancelReset} variant="outlined" fullWidth>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmReset}
            variant="contained"
            color="warning"
            fullWidth
            startIcon={<Refresh />}
            disabled={resettingSubloanId === itemToReset?.subLoanId}
          >
            {resettingSubloanId === itemToReset?.subLoanId ? 'Reseteando...' : 'Resetear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity={successMessage?.startsWith('❌') ? 'error' : 'success'}
          variant="filled"
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

