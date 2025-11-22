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
        
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoading(true);
        setError(null);

        
        const route = await collectionRoutesService.getTodayRoute(managerId);

        if (!isMountedRef.current) {
          
          return;
        }

        setTodayRoute(route);
        setSelectedRoute(route);
        setSelectedDate(null); // Reset to today
        
      } catch (err) {
        
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
        
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoading(true);
        setError(null);

        
        const route = await collectionRoutesService.getRouteByDate(date, managerId);

        if (!isMountedRef.current) {
          
          return;
        }

        setSelectedRoute(route);
        setSelectedDate(date);
        
      } catch (err) {
        
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

      
      const fetchedRoutes = await collectionRoutesService.getRoutes(params);

      if (!isMountedRef.current) {
        
        return;
      }

      setRoutes(fetchedRoutes);
      
    } catch (err) {
      
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

      
      const route = await collectionRoutesService.getRouteById(routeId);

      if (!isMountedRef.current) {
        
        return route;
      }

      
      return route;
    } catch (err) {
      
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

        
        const updatedRoute = await collectionRoutesService.updateOrder(routeId, orderData);

        if (!isMountedRef.current) {
          
          return;
        }

        // Update today route if it's the current one
        if (todayRoute?.id === routeId) {
          setTodayRoute(updatedRoute);
        }

        
        return updatedRoute;
      } catch (err) {
        
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

        
        const closedRoute = await collectionRoutesService.closeRoute(routeId, closeData);

        if (!isMountedRef.current) {
          
          return closedRoute;
        }

        // Update today route if it's the current one
        if (todayRoute?.id === routeId) {
          setTodayRoute(closedRoute);
        }

        
        return closedRoute;
      } catch (err) {
        
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

      
      const result = await collectionRoutesService.createDailyRoutes();

      if (!isMountedRef.current) {
        
        return result;
      }

      
      
      // Refresh today route
      await fetchTodayRoute();
      
      return result;
    } catch (err) {
      
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

