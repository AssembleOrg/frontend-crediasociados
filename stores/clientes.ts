import { create } from 'zustand'
import type { Cliente } from '@/types/prestamo'

interface ClientesStore {
  clientes: Cliente[]
  clienteSeleccionado: Cliente | null
  loading: boolean
  
  setClientes: (clientes: Cliente[]) => void
  setClienteSeleccionado: (cliente: Cliente | null) => void
  agregarCliente: (cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => void
  actualizarCliente: (id: string, datos: Partial<Cliente>) => void
  eliminarCliente: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useClientesStore = create<ClientesStore>((set, get) => ({
  clientes: [],
  clienteSeleccionado: null,
  loading: false,

  setClientes: (clientes: Cliente[]) => set({ clientes }),
  
  setClienteSeleccionado: (cliente: Cliente | null) => set({ clienteSeleccionado: cliente }),

  setLoading: (loading: boolean) => set({ loading }),

  agregarCliente: (clienteData) => {
    const nuevoCliente: Cliente = {
      id: `cliente-${Date.now()}`,
      fechaRegistro: new Date(),
      ...clienteData
    }
    
    set((state) => ({ 
      clientes: [...state.clientes, nuevoCliente] 
    }))
  },

  actualizarCliente: (id: string, datos: Partial<Cliente>) => {
    set((state) => ({
      clientes: state.clientes.map(cliente => 
        cliente.id === id ? { ...cliente, ...datos } : cliente
      ),
      clienteSeleccionado: state.clienteSeleccionado?.id === id 
        ? { ...state.clienteSeleccionado, ...datos }
        : state.clienteSeleccionado
    }))
  },

  eliminarCliente: (id: string) => {
    set((state) => ({
      clientes: state.clientes.filter(cliente => cliente.id !== id),
      clienteSeleccionado: state.clienteSeleccionado?.id === id 
        ? null 
        : state.clienteSeleccionado
    }))
  }
}))