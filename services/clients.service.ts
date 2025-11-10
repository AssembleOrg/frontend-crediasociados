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
}

export const clientsService = new ClientsService()
export default clientsService