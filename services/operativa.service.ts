/**
 * Operativa Service - TO BE IMPLEMENTED WITH REAL API
 * 
 * ⚠️ WARNING: This service needs to be implemented with real API endpoints
 * Currently disabled - replace with actual backend calls
 * 
 * Required endpoints:
 * - GET    /api/v1/operativa/transacciones?userId={userId}
 * - GET    /api/v1/operativa/transacciones/{id}
 * - GET    /api/v1/operativa/ingresos?userId={userId}
 * - GET    /api/v1/operativa/egresos?userId={userId}
 * - POST   /api/v1/operativa/ingresos
 * - POST   /api/v1/operativa/egresos
 * - PUT    /api/v1/operativa/transacciones/{id}
 * - DELETE /api/v1/operativa/transacciones/{id}
 */

import api from './api'
import type {
  Transaccion,
  IngresoTransaccion,
  EgresoTransaccion,
  CreateIngresoDto,
  CreateEgresoDto,
  UpdateTransaccionDto
} from '@/types/operativa'

class OperativaService {
  /**
   * Get all transactions for a user
   */
  async getTransacciones(userId: string): Promise<Transaccion[]> {
    try {
      const response = await api.get(`/operativa/transacciones?userId=${userId}`)
      return response.data.data || []
    } catch (error) {
      
      return []
    }
  }

  /**
   * Get single transaction by ID
   */
  async getTransaccionById(id: string): Promise<Transaccion | null> {
    try {
      const response = await api.get(`/operativa/transacciones/${id}`)
      return response.data.data || null
    } catch (error) {
      
      return null
    }
  }

  /**
   * Create new income transaction
   */
  async createIngreso(userId: string, data: CreateIngresoDto): Promise<IngresoTransaccion> {
    const response = await api.post('/operativa/ingresos', {
      userId,
      ...data
    })
    return response.data.data
  }

  /**
   * Create new expense transaction
   */
  async createEgreso(userId: string, data: CreateEgresoDto): Promise<EgresoTransaccion> {
    const response = await api.post('/operativa/egresos', {
      userId,
      ...data
    })
    return response.data.data
  }

  /**
   * Helper method to create ingreso from payment (used by PaymentModal)
   */
  async createIngresoFromPago(
    subloanId: string,
    amount: number,
    clientName: string,
    paymentNumber: number,
    paymentDate: Date
  ): Promise<IngresoTransaccion> {
    const userId = 'current-user-id' // TODO: Get from auth context
    
    return this.createIngreso(userId, {
      amount,
      description: `Pago cuota #${paymentNumber} - ${clientName}`,
      fecha: paymentDate,
      category: 'payments',
      paymentMethod: 'cash'
    })
  }

  /**
   * Update existing transaction
   */
  async updateTransaccion(
    id: string,
    updates: UpdateTransaccionDto
  ): Promise<Transaccion | null> {
    try {
      const response = await api.put(`/operativa/transacciones/${id}`, updates)
      return response.data.data
    } catch (error) {
      
      return null
    }
  }

  /**
   * Delete transaction
   */
  async deleteTransaccion(id: string): Promise<void> {
    await api.delete(`/operativa/transacciones/${id}`)
  }

  /**
   * Get all income transactions for a user
   */
  async getIngresos(userId: string): Promise<IngresoTransaccion[]> {
    try {
      const response = await api.get(`/operativa/ingresos?userId=${userId}`)
      return response.data.data || []
    } catch (error) {
      
      return []
    }
  }

  /**
   * Get all expense transactions for a user
   */
  async getEgresos(userId: string): Promise<EgresoTransaccion[]> {
    try {
      const response = await api.get(`/operativa/egresos?userId=${userId}`)
      return response.data.data || []
    } catch (error) {
      
      return []
    }
  }
}

const operativaService = new OperativaService()
export default operativaService
