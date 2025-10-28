import { useState, useCallback, useRef, useEffect } from 'react';
import collectionRoutesService, {
  CollectionRoute,
  UpdateOrderDto,
  CloseRouteDto,
  GetRoutesParams,
} from '@/services/collection-routes.service';
import { useAuth } from '@/hooks/useAuth';

export function useCollectionRoutes() {
  const { user } = useAuth();
  const [todayRoute, setTodayRoute] = useState<CollectionRoute | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<CollectionRoute | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [routes, setRoutes] = useState<CollectionRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Race condition prevention
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch today's active route
   */
  const fetchTodayRoute = useCallback(
    async (managerId?: string) => {
      if (isLoadingRef.current) {
        console.log('⏳ Already fetching today route, skipping...');
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoading(true);
        setError(null);

        console.log('🔄 Fetching today route...');
        const route = await collectionRoutesService.getTodayRoute(managerId);

        if (!isMountedRef.current) {
          console.log('⚠️ Component unmounted, skipping state update');
          return;
        }

        setTodayRoute(route);
        setSelectedRoute(route);
        setSelectedDate(null); // Reset to today
        console.log('✅ Today route fetched:', route ? route.id : 'No route for today');
      } catch (err) {
        console.error('❌ Error fetching today route:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Error al cargar ruta del día');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
      }
    },
    []
  );

  /**
   * Fetch route by specific date
   */
  const fetchRouteByDate = useCallback(
    async (date: string, managerId?: string) => {
      if (isLoadingRef.current) {
        console.log('⏳ Already fetching route, skipping...');
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoading(true);
        setError(null);

        console.log('🔄 Fetching route for date:', date);
        const route = await collectionRoutesService.getRouteByDate(date, managerId);

        if (!isMountedRef.current) {
          console.log('⚠️ Component unmounted, skipping state update');
          return;
        }

        setSelectedRoute(route);
        setSelectedDate(date);
        console.log('✅ Route fetched for date:', date, route ? route.id : 'No route');
      } catch (err) {
        console.error('❌ Error fetching route by date:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Error al cargar ruta');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
      }
    },
    []
  );

  /**
   * Fetch routes with filters (for historical view)
   */
  const fetchRoutes = useCallback(async (params?: GetRoutesParams) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching routes with filters:', params);
      const fetchedRoutes = await collectionRoutesService.getRoutes(params);

      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, skipping state update');
        return;
      }

      setRoutes(fetchedRoutes);
      console.log('✅ Routes fetched:', fetchedRoutes.length);
    } catch (err) {
      console.error('❌ Error fetching routes:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Error al cargar rutas');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Fetch specific route by ID
   */
  const fetchRouteById = useCallback(async (routeId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching route by ID:', routeId);
      const route = await collectionRoutesService.getRouteById(routeId);

      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, skipping state update');
        return route;
      }

      console.log('✅ Route fetched:', route.id);
      return route;
    } catch (err) {
      console.error('❌ Error fetching route:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Error al cargar ruta');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Update order of route items (drag & drop)
   */
  const updateOrder = useCallback(
    async (routeId: string, orderData: UpdateOrderDto) => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Updating route order:', routeId);
        const updatedRoute = await collectionRoutesService.updateOrder(routeId, orderData);

        if (!isMountedRef.current) {
          console.log('⚠️ Component unmounted, skipping state update');
          return;
        }

        // Update today route if it's the current one
        if (todayRoute?.id === routeId) {
          setTodayRoute(updatedRoute);
        }

        console.log('✅ Route order updated');
        return updatedRoute;
      } catch (err) {
        console.error('❌ Error updating route order:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Error al actualizar orden');
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [todayRoute]
  );

  /**
   * Close route (end of day)
   */
  const closeRoute = useCallback(
    async (routeId: string, closeData: CloseRouteDto) => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Closing route:', routeId);
        const closedRoute = await collectionRoutesService.closeRoute(routeId, closeData);

        if (!isMountedRef.current) {
          console.log('⚠️ Component unmounted, skipping state update');
          return closedRoute;
        }

        // Update today route if it's the current one
        if (todayRoute?.id === routeId) {
          setTodayRoute(closedRoute);
        }

        console.log('✅ Route closed successfully');
        return closedRoute;
      } catch (err) {
        console.error('❌ Error closing route:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Error al cerrar ruta');
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [todayRoute]
  );

  /**
   * Create daily routes manually (admin only, for testing)
   */
  const createDailyRoutes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Creating daily routes...');
      const result = await collectionRoutesService.createDailyRoutes();

      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, skipping state update');
        return result;
      }

      console.log('✅ Daily routes created:', result.createdRoutes.length);
      
      // Refresh today route
      await fetchTodayRoute();
      
      return result;
    } catch (err) {
      console.error('❌ Error creating daily routes:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Error al crear rutas');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchTodayRoute]);

  return {
    todayRoute,
    selectedRoute,
    selectedDate,
    routes,
    isLoading,
    error,
    fetchTodayRoute,
    fetchRouteByDate,
    fetchRoutes,
    fetchRouteById,
    updateOrder,
    updateRouteOrder: updateOrder, // Alias for consistency
    closeRoute,
    createDailyRoutes,
  };
}

