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
  Skeleton,
  Snackbar,
  FormControlLabel,
  Switch,
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
import { RouteStats } from '@/components/routes/RouteStats';
import { RouteItemCard } from '@/components/routes/RouteItemCard';
import { CloseRouteModal } from '@/components/routes/CloseRouteModal';
import { PaymentModal } from '@/components/loans/PaymentModal';
import { RouteExpenseModal } from '@/components/routes/RouteExpenseModal';
import { RouteDatePicker } from '@/components/routes/RouteDatePicker';
import { CollectionRouteItem } from '@/services/collection-routes.service';
import { DateTime } from 'luxon';

/**
 * Sortable wrapper for RouteItemCard using @dnd-kit
 */
interface SortableRouteItemProps {
  item: CollectionRouteItem;
  index: number;
  onPayment: (item: CollectionRouteItem) => void;
}

function SortableRouteItem({ item, index, onPayment }: SortableRouteItemProps) {
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
        onPayment={onPayment}
        isActive={false} // Disable payment in reorder mode
        isDragging={isDragging}
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

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionRouteItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Drag & Drop State
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedItems, setReorderedItems] = useState<CollectionRouteItem[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  
  // Filter State - Show only pending by default
  const [showOnlyPending, setShowOnlyPending] = useState(true);

  // Fetch route on mount and when pathname changes
  useEffect(() => {
    console.log('🔄 Rutas page mounted/changed');
    fetchTodayRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Update reorderedItems when selectedRoute changes
  useEffect(() => {
    const route = selectedRoute || todayRoute;
    if (route?.items) {
      setReorderedItems(route.items);
    }
  }, [selectedRoute, todayRoute]);

  const handleRefresh = () => {
    setSuccessMessage(null);
    if (selectedDate) {
      fetchRouteByDate(selectedDate);
    } else {
      fetchTodayRoute();
    }
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

  const handlePaymentSuccess = () => {
    // Refresh route to get updated amounts
    fetchTodayRoute();
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
      console.error('Error closing route:', err);
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
      console.error('Error saving order:', err);
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

  // Filter items based on toggle - Purely visual filter
  const getFilteredItems = (items: CollectionRouteItem[]) => {
    if (!showOnlyPending) return items;
    return items.filter(item => item.subLoan.status === 'PENDING');
  };

  const filteredItems = currentRoute?.items ? getFilteredItems(currentRoute.items) : [];
  const filteredReorderedItems = showOnlyPending 
    ? reorderedItems.filter(item => item.subLoan.status === 'PENDING')
    : reorderedItems;

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
    <Box sx={{ p: { xs: 1, sm: 3 }, maxWidth: 1200, mx: 'auto', pb: { xs: 10, sm: 3 } }}>
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
            netAmount={currentRoute.netAmount}
          />
        </Box>
      )}

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
            
            {/* Filter Toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyPending}
                    onChange={(e) => setShowOnlyPending(e.target.checked)}
                    size="small"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.75rem', sm: '0.813rem' } }}>
                    Solo Pendientes
                  </Typography>
                }
                sx={{ m: 0 }}
              />
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
                    onPayment={handleOpenPaymentModal}
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
                  onPayment={handleOpenPaymentModal}
                  isActive={!isRouteClosed}
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

      {selectedItem && (
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

