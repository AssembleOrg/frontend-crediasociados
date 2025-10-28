import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Core stats interfaces
interface DashboardStats {
  totalPrestamos: number;
  montoTotalPrestado: number;
  montoTotalCobrado: number;
  clientesActivos: number;
  prestamistasCantidad: number;
  tasaCobranza: number;
  prestamosVencidos: number;
  prestamosActivos: number;
  montoPromedioPrestamo: number;
  ingresosDelMes: number;
  crecimientoMensual: number;
}

interface PeriodStats {
  periodo: 'diario' | 'semanal' | 'mensual' | 'anual';
  fechaInicio: Date;
  fechaFin: Date;
  prestamosOtorgados: number;
  montoOtorgado: number;
  pagosRecibidos: number;
  montoCobrado: number;
  clientesNuevos: number;
  morosidad: number;
}

interface StatsState {
  dashboardStats: DashboardStats;
  periodStats: PeriodStats[];
  selectedPeriod: 'diario' | 'semanal' | 'mensual' | 'anual';
  ultimaActualizacion: Date | null;
  filters: {
    fechaDesde?: Date;
    fechaHasta?: Date;
    prestamista?: string;
    tipoReporte?: 'general' | 'prestamista' | 'cliente';
  };
}

interface StatsStore extends StatsState {
  // Simple synchronous setters only - NO async logic here
  setDashboardStats: (stats: DashboardStats) => void;
  setPeriodStats: (stats: PeriodStats[]) => void;
  addPeriodStat: (stat: PeriodStats) => void;
  setSelectedPeriod: (period: StatsState['selectedPeriod']) => void;
  setFilters: (filters: Partial<StatsState['filters']>) => void;
  setUltimaActualizacion: (fecha: Date) => void;
  clearStats: () => void;

  // Centralized calculations - single source of truth
  getStatsByPeriod: (periodo: StatsState['selectedPeriod']) => PeriodStats[];
  getCurrentMonthStats: () => PeriodStats | null;
  getGrowthTrend: () => {
    porcentaje: number;
    tendencia: 'crecimiento' | 'decrecimiento' | 'estable';
  };
  getTopMetrics: () => {
    titulo: string;
    valor: number | string;
    cambio?: number;
  }[];
  getEfficiencyMetrics: () => {
    cobranza: number;
    aprovacion: number;
    retencion: number;
  };
}

const defaultDashboardStats: DashboardStats = {
  totalPrestamos: 0,
  montoTotalPrestado: 0,
  montoTotalCobrado: 0,
  clientesActivos: 0,
  prestamistasCantidad: 0,
  tasaCobranza: 0,
  prestamosVencidos: 0,
  prestamosActivos: 0,
  montoPromedioPrestamo: 0,
  ingresosDelMes: 0,
  crecimientoMensual: 0,
};

export const useStatsStore = create<StatsStore>()(
  immer((set, get) => ({
    // Initial state
    dashboardStats: defaultDashboardStats,
    periodStats: [],
    selectedPeriod: 'mensual',
    ultimaActualizacion: null,
    filters: {},

    // Simple synchronous actions only
    setDashboardStats: (stats: DashboardStats) => {
      set((state) => {
        state.dashboardStats = stats;
        state.ultimaActualizacion = new Date();
      });
    },

    setPeriodStats: (stats: PeriodStats[]) => {
      set((state) => {
        state.periodStats = stats;
        state.ultimaActualizacion = new Date();
      });
    },

    addPeriodStat: (stat: PeriodStats) => {
      set((state) => {
        // Remove existing stat for same period if exists
        state.periodStats = state.periodStats.filter(
          (s) =>
            s.periodo !== stat.periodo ||
            s.fechaInicio.getTime() !== stat.fechaInicio.getTime()
        );
        state.periodStats.push(stat);
        state.periodStats.sort(
          (a, b) => b.fechaInicio.getTime() - a.fechaInicio.getTime()
        );
      });
    },

    setSelectedPeriod: (period: StatsState['selectedPeriod']) => {
      set((state) => {
        state.selectedPeriod = period;
      });
    },

    setFilters: (filters: Partial<StatsState['filters']>) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters };
      });
    },

    setUltimaActualizacion: (fecha: Date) => {
      set((state) => {
        state.ultimaActualizacion = fecha;
      });
    },

    clearStats: () => {
      set((state) => {
        state.dashboardStats = defaultDashboardStats;
        state.periodStats = [];
        state.ultimaActualizacion = null;
        state.filters = {};
      });
    },

    // Alias for clearStats (used by cache manager)
    clearCache: () => {
      get().clearStats();
    },

    // Centralized calculations - single source of truth
    getStatsByPeriod: (periodo: StatsState['selectedPeriod']) => {
      return get().periodStats.filter((stat) => stat.periodo === periodo);
    },

    getCurrentMonthStats: () => {
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

      return (
        get().periodStats.find(
          (stat) =>
            stat.periodo === 'mensual' &&
            stat.fechaInicio.getTime() === inicioMes.getTime()
        ) || null
      );
    },

    getGrowthTrend: () => {
      const stats = get().getStatsByPeriod('mensual').slice(0, 2);

      if (stats.length < 2) {
        return { porcentaje: 0, tendencia: 'estable' as const };
      }

      const actual = stats[0].montoOtorgado;
      const anterior = stats[1].montoOtorgado;

      if (anterior === 0) {
        return { porcentaje: 0, tendencia: 'estable' as const };
      }

      const porcentaje = ((actual - anterior) / anterior) * 100;

      let tendencia: 'crecimiento' | 'decrecimiento' | 'estable';
      if (porcentaje > 5) tendencia = 'crecimiento';
      else if (porcentaje < -5) tendencia = 'decrecimiento';
      else tendencia = 'estable';

      return { porcentaje: Math.round(porcentaje * 100) / 100, tendencia };
    },

    getTopMetrics: () => {
      const { dashboardStats } = get();
      const growth = get().getGrowthTrend();

      return [
        {
          titulo: 'Préstamos Activos',
          valor: dashboardStats.prestamosActivos,
          cambio: growth.porcentaje,
        },
        {
          titulo: 'Monto Total Prestado',
          valor: `$${dashboardStats.montoTotalPrestado.toLocaleString()}`,
        },
        {
          titulo: 'Tasa de Cobranza',
          valor: `${dashboardStats.tasaCobranza}%`,
        },
        {
          titulo: 'Clientes Activos',
          valor: dashboardStats.clientesActivos,
        },
      ];
    },

    getEfficiencyMetrics: () => {
      const { dashboardStats } = get();

      return {
        cobranza: dashboardStats.tasaCobranza,
        aprovacion:
          dashboardStats.totalPrestamos > 0
            ? (dashboardStats.prestamosActivos /
                dashboardStats.totalPrestamos) *
              100
            : 0,
        retencion:
          dashboardStats.clientesActivos > 0
            ? ((dashboardStats.clientesActivos -
                dashboardStats.prestamosVencidos) /
                dashboardStats.clientesActivos) *
              100
            : 0,
      };
    },
  }))
);
