import { subLoansService } from './sub-loans.service'
import { loansService } from './loans.service'
import { clientsService } from './clients.service'
import type { components } from '@/types/api-generated'
import type { PaginationParams } from '@/types/auth'

type SubLoanResponseDto = components['schemas']['SubLoanResponseDto']
type LoanListResponseDto = components['schemas']['LoanListResponseDto']
type ClientResponseDto = components['schemas']['ClientResponseDto']

export interface SubLoanWithClientInfo extends SubLoanResponseDto {
  clientId?: string
  clientName?: string
  clientFullData?: ClientResponseDto
}

/**
 * SubLoans Lookup Service
 * 
 * Combines SubLoans with Client information by:
 * SubLoan.loanId → Loan.clientId → Client.fullName
 * 
 * This service handles the complex relationship resolution
 * between SubLoans, Loans, and Clients.
 */
class SubLoansLookupService {
  private loansCache: Map<string, LoanListResponseDto> = new Map()
  private clientsCache: Map<string, ClientResponseDto> = new Map()
  private isLoadingLoans: boolean = false
  private isLoadingClients: boolean = false
  
  /**
   * Clear caches - useful for forcing fresh data
   */
  clearCache(): void {
    this.loansCache.clear()
    this.clientsCache.clear()
  }

  /**
   * Get all SubLoans enriched with client information
   */
  async getAllSubLoansWithClientInfo(params?: PaginationParams): Promise<SubLoanWithClientInfo[]> {
    try {
      // 1. Get all subloans
      const subLoansResponse = await subLoansService.getAllSubLoans(params)
      const subLoans = subLoansResponse.data

      if (subLoans.length === 0) {
        return []
      }

      // 2. Get loans mapping (loanId → clientId)
      await this.loadLoansCache()

      // 3. Get clients data
      await this.loadClientsCache()

      // 4. Enrich subloans with client info (with lazy loading for missing clients)
      const enrichedSubLoans: SubLoanWithClientInfo[] = await Promise.all(
        subLoans.map(async subLoan => {
          const loan = this.loansCache.get(subLoan.loanId)
          const clientId = loan?.clientId
          
          // Try cache first, then lazy load if needed
          let client = clientId ? this.clientsCache.get(clientId) : undefined
          if (!client && clientId) {
            const loadedClient = await this.loadClientById(clientId)
            client = loadedClient || undefined
          }

          return {
            ...subLoan,
            clientId,
            clientName: client?.fullName,
            clientFullData: client
          }
        })
      )

      return enrichedSubLoans

    } catch (error) {
      console.error('Error al enriquecer subpréstamos con información del cliente:', error)
      throw new Error('No se pudieron cargar los datos de cuotas. Por favor, intente nuevamente.')
    }
  }

  /**
   * Get today due SubLoans enriched with client information
   */
  async getTodayDueSubLoansWithClientInfo(params?: PaginationParams): Promise<SubLoanWithClientInfo[]> {
    try {
      // 1. Get today due subloans
      const subLoansResponse = await subLoansService.getTodayDueSubLoans(params)
      const subLoans = subLoansResponse.data

      if (subLoans.length === 0) {
        return []
      }

      // 2. Get loans mapping (loanId → clientId)
      await this.loadLoansCache()

      // 3. Get clients data
      await this.loadClientsCache()

      // 4. Enrich subloans with client info (with lazy loading for missing clients)
      const enrichedSubLoans: SubLoanWithClientInfo[] = await Promise.all(
        subLoans.map(async subLoan => {
          const loan = this.loansCache.get(subLoan.loanId)
          const clientId = loan?.clientId
          
          // Try cache first, then lazy load if needed
          let client = clientId ? this.clientsCache.get(clientId) : undefined
          if (!client && clientId) {
            const loadedClient = await this.loadClientById(clientId)
            client = loadedClient || undefined
          }

          return {
            ...subLoan,
            clientId,
            clientName: client?.fullName,
            clientFullData: client
          }
        })
      )

      return enrichedSubLoans

    } catch (error) {
      console.error('Error al enriquecer subpréstamos vencidos hoy con información del cliente:', error)
      throw new Error('No se pudieron cargar los datos de cuotas vencidas. Por favor, intente nuevamente.')
    }
  }

  /**
   * Load loans cache (loanId → LoanListResponseDto)
   */
  private async loadLoansCache(): Promise<void> {
    // Anti-concurrency protection
    if (this.loansCache.size > 0) {
      return // Already loaded
    }

    if (this.isLoadingLoans) {
      // Wait for current loading to complete
      while (this.isLoadingLoans) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      return // Loading completed by other call
    }

    this.isLoadingLoans = true
    try {
      // Loading loans cache (initialized by SubLoansProvider)
      const loans = await loansService.getActiveLoansWithClientId()
      loans.forEach(loan => {
        this.loansCache.set(loan.id, loan)
      })
    } catch (error) {
      console.error('Error al cargar caché de préstamos:', error)
      throw error
    } finally {
      this.isLoadingLoans = false
    }
  }

  /**
   * Load clients cache (clientId → ClientResponseDto)
   * Uses pagination - loads first 20 clients, more can be loaded on demand
   */
  private async loadClientsCache(): Promise<void> {
    // Anti-concurrency protection
    if (this.clientsCache.size > 0) {
      return // Already loaded
    }

    if (this.isLoadingClients) {
      // Wait for current loading to complete
      while (this.isLoadingClients) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      return // Loading completed by other call
    }

    this.isLoadingClients = true
    try {
      // Loading initial clients cache (first page)
      // Load first page with sensible limit
      const clientsResponse = await clientsService.getClients({ page: 1, limit: 20 })
      const clients = clientsResponse.data
      clients.forEach(client => {
        this.clientsCache.set(client.id, client)
      })
      
      // Log if there are more clients available
      if (clientsResponse.meta && clientsResponse.meta.totalPages > 1) {
        console.log(`Note: ${clientsResponse.meta.totalPages - 1} more pages available (${clientsResponse.meta.total - clients.length} more clients)`)
      }
    } catch (error) {
      console.error('Error al cargar caché de clientes:', error)
      throw error
    } finally {
      this.isLoadingClients = false
    }
  }

  /**
   * Load a specific client by ID if not in cache
   * This allows lazy loading of clients that weren't in the first page
   */
  private async loadClientById(clientId: string): Promise<ClientResponseDto | null> {
    if (this.clientsCache.has(clientId)) {
      return this.clientsCache.get(clientId) || null
    }

    try {
      console.log('Loading specific client from API:', clientId)
      const client = await clientsService.getClientById(clientId)
      this.clientsCache.set(client.id, client)
      console.log('Client loaded and cached:', client.fullName)
      return client
    } catch (error) {
      console.error('Error al cargar cliente específico:', clientId, error)
      return null
    }
  }

  /**
   * Get client info by loan ID
   */
  async getClientByLoanId(loanId: string): Promise<ClientResponseDto | null> {
    await this.loadLoansCache()
    await this.loadClientsCache()

    const loan = this.loansCache.get(loanId)
    if (!loan?.clientId) return null

    return this.clientsCache.get(loan.clientId) || null
  }
}

export const subLoansLookupService = new SubLoansLookupService()
export default subLoansLookupService