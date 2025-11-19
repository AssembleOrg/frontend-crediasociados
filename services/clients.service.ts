import api from './api'
import type { 
  ClientResponseDto, 
  CreateClientDto, 
  UpdateClientDto,
  PaginationParams,
  PaginatedResponse
} from '@/types/auth'

/**
 * THE MESSENGER - Clients Service
 * Simple, testable functions that only communicate with the API.
 * No state management, no complex logic - just API calls.
 */
class ClientsService {
  async getClients(params: PaginationParams = {}): Promise<PaginatedResponse<ClientResponseDto>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const url = queryString ? `/clients?${queryString}` : '/clients'
    
    const response = await api.get(url)
    
    return {
      data: response.data.data.data,
      meta: response.data.data.meta
    }
  }

  async getClientById(id: string): Promise<ClientResponseDto> {
    const response = await api.get(`/clients/${id}`)
    return response.data.data
  }

  async createClient(clientData: CreateClientDto): Promise<ClientResponseDto> {
    const response = await api.post('/clients', clientData)
    return response.data.data
  }

  async updateClient(id: string, clientData: UpdateClientDto): Promise<ClientResponseDto> {
    const response = await api.patch(`/clients/${id}`, clientData)
    return response.data.data
  }

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`)
  }

  async searchClient(query: string): Promise<ClientResponseDto[]> {
    const response = await api.get(`/clients/search?q=${encodeURIComponent(query)}`)
    return response.data.data
  }

  /**
   * Search client by DNI or CUIT
   * @param dni - DNI to search
   * @param cuit - CUIT to search
   * @returns Client found or null
   */
  async searchByDniOrCuit(dni?: string, cuit?: string): Promise<ClientResponseDto | null> {
    const params = new URLSearchParams()
    if (dni) params.append('dni', dni)
    if (cuit) params.append('cuit', cuit)

    const queryString = params.toString()
    if (!queryString) {
      throw new Error('DNI or CUIT is required')
    }

    try {
      const response = await api.get(`/clients/search?${queryString}`)
      return response.data.data
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Get inactive clients for a specific manager
   * Only available for SUBADMIN role
   * @param managerId - Manager ID to get inactive clients for
   */
  async getInactiveClients(managerId: string): Promise<{
    total: number
    clients: Array<{
      id: string
      nombre: string
      telefono?: string
      direccion?: string
      fechaUltimoPrestamo?: string
    }>
  }> {
    const response = await api.get(`/clients/inactive?managerId=${managerId}`)
    return response.data.data || response.data
  }

  /**
   * Get clients with active loans for a specific manager
   * @param managerId - Manager ID to get clients with active loans for
   */
  async getActiveLoansClients(managerId: string): Promise<{
    total: number
    clients: Array<{
      id: string
      nombre: string
      telefono?: string
      direccion?: string
      cantidadPrestamosActivos: number
      prestamosActivos: Array<{
        id: string
        loanTrack: string
        amount: number
        status: string
        createdAt: string
      }>
    }>
  }> {
    const response = await api.get(`/clients/active-loans?managerId=${managerId}`)
    return response.data.data || response.data
  }

  /**
   * Get unverified clients (only for SUBADMIN)
   * Returns clients from managers created by the subadmin that are not verified
   */
  async getUnverifiedClients(): Promise<{
    total: number
    clients: Array<{
      id: string
      nombre: string
      telefono?: string
      direccion?: string
    }>
  }> {
    // Using the same pattern as other endpoints - api.get() automatically adds auth token via interceptor
    const response = await api.get('/clients/unverified')
    return response.data.data || response.data
  }

  /**
   * Verify a client (only for SUBADMIN)
   * Can only verify clients from managers that the subadmin created
   * @param clientId - Client ID to verify
   */
  async verifyClient(clientId: string): Promise<ClientResponseDto> {
    const response = await api.patch(`/clients/${clientId}/verify`)
    return response.data.data || response.data
  }
}

export const clientsService = new ClientsService()
export default clientsService