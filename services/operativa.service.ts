/**
 * Operativa Service (Mock Implementation)
 *
 * Handles CRUD operations for the unified transaction system.
 * Currently uses in-memory mock data for frontend development.
 */

import type {
  Transaccion,
  IngresoTransaccion,
  EgresoTransaccion,
  CreateIngresoDto,
  CreateEgresoDto,
  UpdateTransaccionDto
} from '@/types/operativa'

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TRANSACTIONS: Transaccion[] = [
  // Ingresos
  {
    id: 'trans-1',
    userId: 'manager-1',
    tipo: 'ingreso',
    subTipo: 'pago_cuota',
    amount: 5000,
    descripcion: 'Pago cuota #3 - Cliente: Juan Pérez',
    fecha: new Date('2025-10-01'),
    subloanId: 'subloan-123',
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-01')
  },
  {
    id: 'trans-2',
    userId: 'manager-1',
    tipo: 'ingreso',
    subTipo: 'pago_cuota',
    amount: 3500,
    descripcion: 'Pago cuota #2 - Cliente: María González',
    fecha: new Date('2025-09-30'),
    subloanId: 'subloan-456',
    createdAt: new Date('2025-09-30'),
    updatedAt: new Date('2025-09-30')
  },
  {
    id: 'trans-3',
    userId: 'subadmin-1',
    tipo: 'ingreso',
    subTipo: 'capital_inicial',
    amount: 300000,
    descripcion: 'Depósito inicial de capital operativo',
    fecha: new Date('2025-09-01'),
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-09-01')
  },

  // Egresos
  {
    id: 'trans-4',
    userId: 'manager-1',
    tipo: 'egreso',
    subTipo: 'combustible',
    amount: 2500,
    descripcion: 'Nafta para visitas a clientes - Zona Norte',
    fecha: new Date('2025-10-01'),
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-01')
  },
  {
    id: 'trans-5',
    userId: 'manager-1',
    tipo: 'egreso',
    subTipo: 'viaticos',
    amount: 1500,
    descripcion: 'Almuerzo reunión con clientes',
    fecha: new Date('2025-09-29'),
    createdAt: new Date('2025-09-29'),
    updatedAt: new Date('2025-09-29')
  },
  {
    id: 'trans-6',
    userId: 'subadmin-1',
    tipo: 'egreso',
    subTipo: 'capital_entregado',
    amount: 100000,
    descripcion: 'Capital asignado a Manager Juan Pérez',
    fecha: new Date('2025-09-15'),
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2025-09-15')
  },
  {
    id: 'trans-7',
    userId: 'manager-1',
    tipo: 'egreso',
    subTipo: 'materiales',
    amount: 800,
    descripcion: 'Papelería y formularios',
    fecha: new Date('2025-09-28'),
    createdAt: new Date('2025-09-28'),
    updatedAt: new Date('2025-09-28')
  }
]

// ============================================================================
// SERVICE CLASS
// ============================================================================

class OperativaService {
  private transacciones: Transaccion[] = [...MOCK_TRANSACTIONS]
  private nextId = MOCK_TRANSACTIONS.length + 1

  /**
   * Simulate API delay
   */
  private async mockDelay(ms: number = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get all transactions for a user
   */
  async getTransacciones(userId: string): Promise<Transaccion[]> {
    await this.mockDelay()
    return this.transacciones
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }

  /**
   * Get a single transaction by ID
   */
  async getTransaccionById(id: string): Promise<Transaccion | null> {
    await this.mockDelay(200)
    return this.transacciones.find((t) => t.id === id) || null
  }

  /**
   * Create an Ingreso transaction
   */
  async createIngreso(userId: string, data: CreateIngresoDto): Promise<IngresoTransaccion> {
    await this.mockDelay()

    const newTransaccion: IngresoTransaccion = {
      id: `trans-${this.nextId++}`,
      userId,
      tipo: 'ingreso',
      subTipo: data.subTipo,
      amount: data.amount,
      descripcion: data.descripcion,
      fecha: data.fecha,
      subloanId: data.subloanId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.transacciones.push(newTransaccion)
    return newTransaccion
  }

  /**
   * Create an Egreso transaction
   */
  async createEgreso(userId: string, data: CreateEgresoDto): Promise<EgresoTransaccion> {
    await this.mockDelay()

    const newTransaccion: EgresoTransaccion = {
      id: `trans-${this.nextId++}`,
      userId,
      tipo: 'egreso',
      subTipo: data.subTipo,
      amount: data.amount,
      descripcion: data.descripcion,
      fecha: data.fecha,
      loanId: data.loanId,
      receiptUrl: data.receiptUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.transacciones.push(newTransaccion)
    return newTransaccion
  }

  /**
   * Special method: Create ingreso from cuota payment
   * This is called automatically when a payment is registered in the timeline
   */
  async createIngresoFromPago(
    userId: string,
    subloanId: string,
    amount: number,
    clientName: string,
    cuotaNumber: number,
    fecha: Date
  ): Promise<IngresoTransaccion> {
    const descripcion = `Pago cuota #${cuotaNumber} - Cliente: ${clientName}`

    return this.createIngreso(userId, {
      subTipo: 'pago_cuota',
      amount,
      descripcion,
      fecha,
      subloanId
    })
  }

  /**
   * Update a transaction
   */
  async updateTransaccion(
    id: string,
    updates: UpdateTransaccionDto
  ): Promise<Transaccion | null> {
    await this.mockDelay()

    const index = this.transacciones.findIndex((t) => t.id === id)
    if (index === -1) {
      throw new Error('Transaction not found')
    }

    this.transacciones[index] = {
      ...this.transacciones[index],
      ...updates,
      updatedAt: new Date()
    }

    return this.transacciones[index]
  }

  /**
   * Delete a transaction
   */
  async deleteTransaccion(id: string): Promise<void> {
    await this.mockDelay()

    const index = this.transacciones.findIndex((t) => t.id === id)
    if (index === -1) {
      throw new Error('Transaction not found')
    }

    this.transacciones.splice(index, 1)
  }

  /**
   * Get all ingresos for a user
   */
  async getIngresos(userId: string): Promise<IngresoTransaccion[]> {
    await this.mockDelay(250)
    return this.transacciones
      .filter((t) => t.userId === userId && t.tipo === 'ingreso')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) as IngresoTransaccion[]
  }

  /**
   * Get all egresos for a user
   */
  async getEgresos(userId: string): Promise<EgresoTransaccion[]> {
    await this.mockDelay(250)
    return this.transacciones
      .filter((t) => t.userId === userId && t.tipo === 'egreso')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) as EgresoTransaccion[]
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const operativaService = new OperativaService()
