import { subLoansService } from './sub-loans.service'
import { loansService } from './loans.service'
import { clientsService } from './clients.service'
import type { components } from '@/types/api-generated'
import type { PaginationParams, LoanListResponseDto } from '@/types/auth'
import type { SubLoanResponseDto } from '@/types/export'

type ClientResponseDto = components['schemas']['ClientResponseDto']

export interface SubLoanWithClientInfo {
  id?: string
  loanId?: string
  amount?: number
  paidAmount?: number
  status?: string
  dueDate?: string
  createdAt?: string
  paymentNumber?: number
  totalAmount?: number
  outstandingBalance?: number
  notes?: string | null
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
  private loansLoadingPromise: Promise<void> | null = null
  private clientsLoadingPromise: Promise<void> | null = null
  // Deduplication: prevent multiple concurrent fetches for the same client ID
  private pendingClientFetches: Map<string, Promise<ClientResponseDto | null>> = new Map()
  
  /**
   * Clear caches - useful for forcing fresh data
   */
  clearCache(): void {
    this.loansCache.clear()
    this.clientsCache.clear()
    this.pendingClientFetches.clear()
  }

  /**
   * Get all SubLoans enriched with client information
   * OPTIMIZED: Uses client info directly from loans (no extra API calls)
   */
  async getAllSubLoansWithClientInfo(params?: PaginationParams): Promise<SubLoanWithClientInfo[]> {
    try {
      // 1. Get all subloans
      const subLoans = await subLoansService.getAllSubLoans()

      if (subLoans.length === 0) {
        return []
      }

      // 2. Get loans mapping (loanId → loan with client info)
      await this.loadLoansCache()

      // 3. Enrich subloans with client info FROM LOANS (no extra client API calls)
      const enrichedSubLoans: SubLoanWithClientInfo[] = subLoans.map(subLoan => {
        const loan = this.loansCache.get(subLoan.loanId)
        // Use client info directly from the loan response
        const client = loan?.client as any
        
        return {
          ...subLoan,
          clientId: client?.id || loan?.clientId,
          clientName: client?.fullName,
          clientFullData: client
        }
      })

      return enrichedSubLoans

    } catch (error) {
      
      throw new Error('No se pudieron cargar los datos de cuotas. Por favor, intente nuevamente.')
    }
  }

  /**
   * Get today due SubLoans enriched with client information
   * OPTIMIZED: Uses client info directly from loans (no extra API calls)
   */
  async getTodayDueSubLoansWithClientInfo(params?: PaginationParams): Promise<SubLoanWithClientInfo[]> {
    try {
      // 1. Get today due subloans
      const subLoans = await subLoansService.getTodayDueSubLoans()

      if (subLoans.length === 0) {
        return []
      }

      // 2. Get loans mapping (loanId → loan with client info)
      await this.loadLoansCache()

      // 3. Enrich subloans with client info FROM LOANS (no extra client API calls)
      const enrichedSubLoans: SubLoanWithClientInfo[] = subLoans.map(subLoan => {
        const loan = this.loansCache.get(subLoan.loanId)
        // Use client info directly from the loan response
        const client = loan?.client as any
        
        return {
          ...subLoan,
          clientId: client?.id || loan?.clientId,
          clientName: client?.fullName,
          clientFullData: client
        }
      })

      return enrichedSubLoans

    } catch (error) {
      
      throw new Error('No se pudieron cargar los datos de cuotas vencidas. Por favor, intente nuevamente.')
    }
  }

  /**
   * Load loans cache (loanId → LoanListResponseDto)
   */
  private async loadLoansCache(): Promise<void> {
    if (this.loansCache.size > 0) {
      return
    }

    if (this.loansLoadingPromise) {
      await this.loansLoadingPromise
      return
    }

    this.loansLoadingPromise = (async () => {
      try {
        const loans = await loansService.getActiveLoansWithClientId()
        loans.forEach(loan => {
          this.loansCache.set(loan.id, loan)
        })
      } catch (error) {
        
        throw error
      } finally {
        this.loansLoadingPromise = null
      }
    })()

    await this.loansLoadingPromise
  }

  /**
   * Load clients cache (clientId → ClientResponseDto)
   * Uses pagination - loads first 20 clients, more can be loaded on demand
   */
  private async loadClientsCache(): Promise<void> {
    if (this.clientsCache.size > 0) {
      return
    }

    if (this.clientsLoadingPromise) {
      await this.clientsLoadingPromise
      return
    }

    this.clientsLoadingPromise = (async () => {
      try {
        const clientsResponse = await clientsService.getClients({ page: 1, limit: 20 })
        const clients = clientsResponse.data
        clients.forEach(client => {
          this.clientsCache.set(client.id, client)
        })

        if (clientsResponse.meta && clientsResponse.meta.totalPages > 1) {
        }
      } catch (error) {
        
        throw error
      } finally {
        this.clientsLoadingPromise = null
      }
    })()

    await this.clientsLoadingPromise
  }

  /**
   * Load a specific client by ID if not in cache
   * This allows lazy loading of clients that weren't in the first page
   * Uses deduplication to prevent multiple concurrent fetches for the same ID
   */
  private async loadClientById(clientId: string): Promise<ClientResponseDto | null> {
    // Check cache first
    if (this.clientsCache.has(clientId)) {
      return this.clientsCache.get(clientId) || null
    }

    // Check if there's already a pending fetch for this client
    const pendingFetch = this.pendingClientFetches.get(clientId)
    if (pendingFetch) {
      return pendingFetch
    }

    // Create a new fetch promise and store it for deduplication
    const fetchPromise = (async (): Promise<ClientResponseDto | null> => {
      try {
        const client = await clientsService.getClientById(clientId)
        this.clientsCache.set(client.id, client)
        return client
      } catch (error) {
        return null
      } finally {
        // Clean up the pending fetch
        this.pendingClientFetches.delete(clientId)
      }
    })()

    this.pendingClientFetches.set(clientId, fetchPromise)
    return fetchPromise
  }

  /**
   * Get client info by loan ID
   */
  async getClientByLoanId(loanId: string): Promise<ClientResponseDto | null> {
    await this.loadLoansCache()
    await this.loadClientsCache()

    const loan = this.loansCache.get(loanId)
    if (!loan?.client?.id) return null

    return this.clientsCache.get(loan.client?.id) || null
  }
}

export const subLoansLookupService = new SubLoansLookupService()
export default subLoansLookupService