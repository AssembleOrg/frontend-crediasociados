import { create } from 'zustand'

interface StatsData {
  totalPrestamos: number
  montoTotalPrestado: number
  montoTotalCobrado: number
  clientesActivos: number
  prestamistasCantidad: number
  tasaCobranza: number
  prestamosVencidos: number
  prestamosActivos: number
}

interface StatsStore {
  stats: StatsData
  loading: boolean
  ultimaActualizacion: Date | null
  
  setStats: (stats: StatsData) => void
  setLoading: (loading: boolean) => void
  actualizarStats: () => void
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  stats: {
    totalPrestamos: 0,
    montoTotalPrestado: 0,
    montoTotalCobrado: 0,
    clientesActivos: 0,
    prestamistasCantidad: 0,
    tasaCobranza: 0,
    prestamosVencidos: 0,
    prestamosActivos: 0
  },
  loading: false,
  ultimaActualizacion: null,

  setLoading: (loading: boolean) => set({ loading }),

  setStats: (stats: StatsData) => set({ 
    stats, 
    ultimaActualizacion: new Date() 
  }),

  actualizarStats: () => {
    set({ loading: true })
    
    // Aquí conectarías con el backend para obtener las estadísticas reales
    setTimeout(() => {
      const mockStats: StatsData = {
        totalPrestamos: 157,
        montoTotalPrestado: 2450000,
        montoTotalCobrado: 1890000,
        clientesActivos: 89,
        prestamistasCantidad: 12,
        tasaCobranza: 77.1,
        prestamosVencidos: 8,
        prestamosActivos: 134
      }
      
      get().setStats(mockStats)
      set({ loading: false })
    }, 1000)
  }
}))