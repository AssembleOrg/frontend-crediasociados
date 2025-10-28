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
}

export const clientsService = new ClientsService()
export default clientsService