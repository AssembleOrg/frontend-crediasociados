/**
 * Types for Operativa (Unified Transaction System)
 *
 * Operativa unifies income and expenses into a single transaction ledger
 * that automatically syncs with financial metrics.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type TransaccionTipo = 'ingreso' | 'egreso'

/**
 * Tipos de ingresos
 */
export type IngresoTipo =
  | 'pago_cuota'           // Payment from client (automatic from timeline)
  | 'capital_retorno'      // Capital returned from prestamista to subadmin
  | 'capital_inicial'      // Initial capital deposit (subadmin)

/**
 * Tipos de egresos
 */
export type EgresoTipo =
  | 'capital_entregado'    // Capital given from subadmin to prestamista
  | 'prestamo_otorgado'    // Loan granted from prestamista to client
  | 'combustible'          // Fuel expense
  | 'viaticos'             // Travel/per diem expense
  | 'materiales'           // Materials expense
  | 'otros'                // Other expenses

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Base transaction type
 */
export interface Transaccion {
  id: string
  userId: string                 // Who created/owns this transaction
  tipo: TransaccionTipo          // ingreso or egreso
  subTipo: IngresoTipo | EgresoTipo  // Specific type
  amount: number
  descripcion: string
  fecha: Date                    // Transaction date

  // Optional references
  subloanId?: string             // For pago_cuota
  loanId?: string                // For prestamo_otorgado

  // Metadata
  createdAt: Date
  updatedAt: Date
}

/**
 * Ingreso (Income) Transaction
 */
export interface IngresoTransaccion extends Transaccion {
  tipo: 'ingreso'
  subTipo: IngresoTipo
}

/**
 * Egreso (Expense) Transaction
 */
export interface EgresoTransaccion extends Transaccion {
  tipo: 'egreso'
  subTipo: EgresoTipo
  receiptUrl?: string            // Optional receipt attachment
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/**
 * DTO for creating an Ingreso
 */
export interface CreateIngresoDto {
  subTipo: IngresoTipo
  amount: number
  descripcion: string
  fecha: Date
  subloanId?: string
}

/**
 * DTO for creating an Egreso
 */
export interface CreateEgresoDto {
  subTipo: EgresoTipo
  amount: number
  descripcion: string
  fecha: Date
  loanId?: string
  receiptUrl?: string
}

/**
 * DTO for updating a transaction
 */
export interface UpdateTransaccionDto {
  descripcion?: string
  fecha?: Date
  receiptUrl?: string
}

// ============================================================================
// DISPLAY METADATA
// ============================================================================

/**
 * Metadata for displaying ingreso types
 */
export interface IngresoTipoMeta {
  value: IngresoTipo
  label: string
  icon: string         // MUI icon name
  color: string        // Hex color
  description: string
}

/**
 * Metadata for displaying egreso types
 */
export interface EgresoTipoMeta {
  value: EgresoTipo
  label: string
  icon: string         // MUI icon name
  color: string        // Hex color
  description: string
}

/**
 * Metadata for Ingreso types
 */
export const INGRESO_TIPOS: Record<IngresoTipo, IngresoTipoMeta> = {
  pago_cuota: {
    value: 'pago_cuota',
    label: 'Pago de Cuota',
    icon: 'Payment',
    color: '#388e3c',
    description: 'Pago recibido de cliente'
  },
  capital_retorno: {
    value: 'capital_retorno',
    label: 'Capital de Retorno',
    icon: 'TrendingUp',
    color: '#1976d2',
    description: 'Capital devuelto por prestamista'
  },
  capital_inicial: {
    value: 'capital_inicial',
    label: 'Capital Inicial',
    icon: 'AccountBalance',
    color: '#9c27b0',
    description: 'Depósito de capital inicial'
  }
}

/**
 * Metadata for Egreso types
 */
export const EGRESO_TIPOS: Record<EgresoTipo, EgresoTipoMeta> = {
  capital_entregado: {
    value: 'capital_entregado',
    label: 'Capital Entregado',
    icon: 'CallMade',
    color: '#d32f2f',
    description: 'Capital asignado a cobrador'
  },
  prestamo_otorgado: {
    value: 'prestamo_otorgado',
    label: 'Préstamo Otorgado',
    icon: 'Handshake',
    color: '#f57c00',
    description: 'Préstamo entregado a cliente'
  },
  combustible: {
    value: 'combustible',
    label: 'Combustible',
    icon: 'LocalGasStation',
    color: '#ef6c00',
    description: 'Gasto en combustible'
  },
  viaticos: {
    value: 'viaticos',
    label: 'Viáticos',
    icon: 'DirectionsCar',
    color: '#0288d1',
    description: 'Gastos de viaje'
  },
  materiales: {
    value: 'materiales',
    label: 'Materiales',
    icon: 'ShoppingCart',
    color: '#7b1fa2',
    description: 'Materiales y papelería'
  },
  otros: {
    value: 'otros',
    label: 'Otros',
    icon: 'MoreHoriz',
    color: '#757575',
    description: 'Otros gastos operativos'
  }
}

// ============================================================================
// SUMMARY TYPES
// ============================================================================

/**
 * Summary of transactions for a period
 */
export interface TransaccionSummary {
  totalIngresos: number
  totalEgresos: number
  balance: number
  countIngresos: number
  countEgresos: number
}

/**
 * Transactions grouped by tipo
 */
export interface TransaccionesByTipo {
  ingresos: IngresoTransaccion[]
  egresos: EgresoTransaccion[]
}

/**
 * Transaction filters
 */
export interface TransaccionFilters {
  tipo?: TransaccionTipo
  subTipo?: IngresoTipo | EgresoTipo
  fechaDesde?: Date
  fechaHasta?: Date
  search?: string
}
