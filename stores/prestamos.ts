import { create } from 'zustand'
import type { Prestamo, Pago } from '@/types/prestamo'

interface PrestamosStore {
  prestamos: Prestamo[]
  prestamoSeleccionado: Prestamo | null
  loading: boolean
  
  setPrestamos: (prestamos: Prestamo[]) => void
  setPrestamoSeleccionado: (prestamo: Prestamo | null) => void
  agregarPrestamo: (prestamo: Omit<Prestamo, 'id' | 'pagos'>) => void
  actualizarPrestamo: (id: string, datos: Partial<Prestamo>) => void
  eliminarPrestamo: (id: string) => void
  registrarPago: (prestamoId: string, pago: Omit<Pago, 'id'>) => void
  setLoading: (loading: boolean) => void
  calcularMontosCredito: (monto: number, interes: number, cuotas: number, tipoInteres: 'diario' | 'mensual') => { montoTotal: number, valorCuota: number }
}

export const usePrestamosStore = create<PrestamosStore>((set, get) => ({
  prestamos: [],
  prestamoSeleccionado: null,
  loading: false,

  setPrestamos: (prestamos: Prestamo[]) => set({ prestamos }),
  
  setPrestamoSeleccionado: (prestamo: Prestamo | null) => set({ prestamoSeleccionado: prestamo }),

  setLoading: (loading: boolean) => set({ loading }),

  calcularMontosCredito: (monto: number, interes: number, cuotas: number, tipoInteres: 'diario' | 'mensual') => {
    const montoTotal = monto * (1 + (interes / 100))
    const valorCuota = montoTotal / cuotas
    
    return { montoTotal, valorCuota }
  },

  agregarPrestamo: (prestamoData) => {
    const { montoTotal, valorCuota } = get().calcularMontosCredito(
      prestamoData.monto,
      prestamoData.interes,
      prestamoData.cuotas,
      prestamoData.tipoInteres
    )

    const nuevoPrestamo: Prestamo = {
      id: `prestamo-${Date.now()}`,
      ...prestamoData,
      montoTotal,
      valorCuota,
      estado: 'activo',
      pagos: []
    }
    
    set((state) => ({ 
      prestamos: [...state.prestamos, nuevoPrestamo] 
    }))
  },

  actualizarPrestamo: (id: string, datos: Partial<Prestamo>) => {
    set((state) => ({
      prestamos: state.prestamos.map(prestamo => 
        prestamo.id === id ? { ...prestamo, ...datos } : prestamo
      ),
      prestamoSeleccionado: state.prestamoSeleccionado?.id === id 
        ? { ...state.prestamoSeleccionado, ...datos }
        : state.prestamoSeleccionado
    }))
  },

  eliminarPrestamo: (id: string) => {
    set((state) => ({
      prestamos: state.prestamos.filter(prestamo => prestamo.id !== id),
      prestamoSeleccionado: state.prestamoSeleccionado?.id === id 
        ? null 
        : state.prestamoSeleccionado
    }))
  },

  registrarPago: (prestamoId: string, pagoData: Omit<Pago, 'id'>) => {
    const nuevoPago: Pago = {
      id: `pago-${Date.now()}`,
      ...pagoData
    }

    set((state) => ({
      prestamos: state.prestamos.map(prestamo => 
        prestamo.id === prestamoId 
          ? { ...prestamo, pagos: [...prestamo.pagos, nuevoPago] }
          : prestamo
      )
    }))
  }
}))