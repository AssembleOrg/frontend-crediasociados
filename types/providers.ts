// Config genérica para providers jerárquicos
export interface HierarchicalDataProviderConfig<TStore = unknown> {
  store: TStore
  isBasicDataFresh: (store: TStore) => boolean
  isDetailedDataFresh: (store: TStore) => boolean
  hasBasicData: (store: TStore) => boolean
  clearAllData: (store: TStore) => void
}

// Base para configuraciones de provider
export interface ProviderConfigBase {
  userType: string
  dataEndpoints: {
    basic: string
    detailed: string
  }
  cacheTime?: number
}

// Interface para stores que tienen datos básicos y detallados
export interface HierarchicalStore {
  // Métodos de frescura de datos
  isBasicDataFresh(): boolean
  isDetailedDataFresh(): boolean

  // Métodos de limpieza
  clearAllData(): void

  // Estado de datos
  hasBasicData(): boolean
  hasDetailedData(): boolean
}

// Específico para SubadminStore (basado en el error que vimos)
export interface SubadminStore extends HierarchicalStore {
  managers: Array<{
    id: string
    name: string
    email: string
  }>

  // Datos básicos
  basicData: any[]

  // Timestamps para cache
  lastFetch: Date | null
  lastDetailedFetch: Date | null
}

// Para AdminStore
export interface AdminStore extends HierarchicalStore {
  basicData: any[]
  detailedData: any[]
  reports: any | null

  // Cache timestamps
  lastFetch: Date | null
  lastDetailedFetch: Date | null

  // Métodos adicionales
  invalidateCache(): void
  getAggregatedTotals(): {
    totalClients: number
    totalAmount: number
    totalLoans: number
  }
}

// Props base para cualquier provider de datos
export interface DataProviderProps {
  children: React.ReactNode
}

// Config específica para provider admin
export type AdminProviderConfig = HierarchicalDataProviderConfig<AdminStore>

// Config específica para provider subadmin
export type SubadminProviderConfig = HierarchicalDataProviderConfig<SubadminStore>