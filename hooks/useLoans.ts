import { useCallback, useEffect } from 'react'
import { useLoansStore } from '@/stores/loans'
import { loansService } from '@/services/loans.service'
import { apiLoanToLoan, loanToCreateDto } from '@/types/transforms'
import type { Loan, PaginationParams, CreateLoanDto } from '@/types/auth'

/**
 * THE CONDUCTOR - useLoans Hook
 * 
 * Business logic controller that orchestrates:
 * - Async operations (API calls via service)
 * - State management (simple commands to store)  
 * - Data transformations (API ↔ Frontend)
 * - Loading states and error handling
 */
export function useLoans() {
  const {
    loans,
    isLoading,
    error,
    setLoans,
    addLoan,
    updateLoan,
    removeLoan,
    setLoading,
    setError,
    reset,
    getTotalLoans,
    getActiveLoansByStatus,
    getLoanById,
    getLoansByClient,
    getLoanByTrack,
    getFilteredLoans,
  } = useLoansStore()

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = useCallback(async (params?: PaginationParams) => {
    try {
      setLoading(true)
      setError(null)

      // 🧪 MOCK DATA COHERENTE PARA TESTING - ELIMINAR DESPUÉS
      // Base de fechas: 15 de agosto de 2025
      const baseDate = new Date("2025-08-15"); // HOY
      
      const mockLoans: Loan[] = [
        {
          id: "mock-loan-1",
          clientId: "mock-client-1",
          loanTrack: "LOAN-2025-001",
          amount: 180000,
          baseInterestRate: 0.15, // 15%
          penaltyInterestRate: 0.05, // 5%
          currency: "ARS",
          status: "COMPLETED", // ✅ COMPLETADO (6/6 cuotas pagadas)
          paymentFrequency: "WEEKLY",
          paymentDay: "FRIDAY",
          totalPayments: 6,
          requestDate: new Date("2025-06-01"),
          approvedDate: new Date("2025-06-02"),
          completedDate: new Date("2025-08-01"),
          firstDueDate: new Date("2025-06-06"), // Primera cuota: 6 de junio
          description: "Renovación de equipos",
          createdAt: new Date("2025-06-01"),
          updatedAt: new Date("2025-08-01"),
          client: {
            id: "mock-client-1",
            fullName: "María González",
            dni: "12345678",
            cuit: "27-12345678-9",
            phone: "+54911234567",
            email: "maria@email.com",
            address: "Av. Corrientes 1234, CABA",
            createdAt: new Date("2025-05-15"),
            updatedAt: new Date("2025-05-15")
          }
        },
        {
          id: "mock-loan-2",
          clientId: "mock-client-2",
          loanTrack: "LOAN-2025-002",
          amount: 240000,
          baseInterestRate: 0.12, // 12%
          penaltyInterestRate: 0.03, // 3%
          currency: "ARS",
          status: "ACTIVE", // 🟡 EN_PROCESO (3/6 cuotas pagadas, cuota 4 en proceso)
          paymentFrequency: "WEEKLY",
          paymentDay: "FRIDAY",
          totalPayments: 6,
          requestDate: new Date("2025-07-01"),
          approvedDate: new Date("2025-07-02"),
          firstDueDate: new Date("2025-07-25"), // Primera cuota: 25 julio -> 3 cuotas atrás
          description: "Capital de trabajo",
          createdAt: new Date("2025-07-01"),
          updatedAt: new Date("2025-08-10"),
          client: {
            id: "mock-client-2",
            fullName: "Carlos Rodriguez",
            dni: "87654321",
            cuit: "20-87654321-4",
            phone: "+54911987654",
            email: "carlos@empresa.com",
            address: "San Martín 567, La Plata",
            createdAt: new Date("2025-06-20"),
            updatedAt: new Date("2025-06-20")
          }
        },
        {
          id: "mock-loan-3",
          clientId: "mock-client-3",
          loanTrack: "LOAN-2025-003",
          amount: 160000,
          baseInterestRate: 0.18, // 18%
          penaltyInterestRate: 0.07, // 7%
          currency: "ARS",
          status: "ACTIVE", // 🔴 EN_PROCESO (1/4 cuotas, cuota 2 ATRASADA)
          paymentFrequency: "BIWEEKLY",
          paymentDay: "MONDAY",
          totalPayments: 4,
          requestDate: new Date("2025-07-10"),
          approvedDate: new Date("2025-07-11"),
          firstDueDate: new Date("2025-07-29"), // Primera: 29 julio, Segunda: 12 agosto (ATRASADA)
          description: "Compra de maquinaria",
          createdAt: new Date("2025-07-10"),
          updatedAt: new Date("2025-08-05"),
          client: {
            id: "mock-client-3",
            fullName: "Ana Martínez",
            dni: "11223344",
            cuit: "27-11223344-1",
            phone: "+54911555666",
            email: "ana@mipyme.com.ar",
            address: "Belgrano 890, Córdoba",
            createdAt: new Date("2025-06-15"),
            updatedAt: new Date("2025-06-15")
          }
        },
        {
          id: "mock-loan-4",
          clientId: "mock-client-4",
          loanTrack: "LOAN-2025-004",
          amount: 400000,
          baseInterestRate: 0.10, // 10%
          penaltyInterestRate: 0.02, // 2%
          currency: "ARS",
          status: "ACTIVE", // ⏳ EN_PROCESO (0/8 cuotas, apenas comenzó)
          paymentFrequency: "WEEKLY",
          paymentDay: "TUESDAY",
          totalPayments: 8,
          requestDate: new Date("2025-08-10"),
          approvedDate: new Date("2025-08-12"),
          firstDueDate: new Date("2025-08-20"), // Primera cuota: 20 agosto (futuro)
          description: "Expansión de negocio",
          createdAt: new Date("2025-08-10"),
          updatedAt: new Date("2025-08-12"),
          client: {
            id: "mock-client-4",
            fullName: "Roberto Silva",
            dni: "55667788",
            cuit: "20-55667788-2",
            phone: "+54911777888",
            email: "roberto@local.com",
            address: "Rivadavia 2345, Buenos Aires",
            createdAt: new Date("2025-07-15"),
            updatedAt: new Date("2025-07-15")
          }
        },
        {
          id: "mock-loan-5",
          clientId: "mock-client-5",
          loanTrack: "LOAN-2025-005",
          amount: 90000,
          baseInterestRate: 0.14, // 14%
          penaltyInterestRate: 0.04, // 4%
          currency: "ARS",
          status: "REJECTED", // ❌ CANCELADO
          paymentFrequency: "WEEKLY",
          paymentDay: "THURSDAY",
          totalPayments: 5,
          requestDate: new Date("2025-08-01"),
          firstDueDate: new Date("2025-08-08"), // No importa, fue cancelado
          description: "Emergencia familiar",
          createdAt: new Date("2025-08-01"),
          updatedAt: new Date("2025-08-05"),
          client: {
            id: "mock-client-5",
            fullName: "Laura Fernández",
            dni: "99887766",
            cuit: "27-99887766-8",
            phone: "+54911666777",
            email: "laura@personal.com",
            address: "Mitre 1122, Rosario",
            createdAt: new Date("2025-07-18"),
            updatedAt: new Date("2025-07-18")
          }
        }
      ]

      console.log('🧪 USANDO MOCK DATA PARA TESTING DE UI')
      console.log('📊 Préstamos simulados:', mockLoans.length)
      console.log('📋 Estados:', mockLoans.map(l => `${l.loanTrack}: ${l.status}`))
      
      setLoans(mockLoans)

      // 🚫 COMENTADO TEMPORALMENTE - DESCOMENTAR PARA USAR BACKEND REAL
      // const response = await loansService.getLoans(params)
      // const transformedLoans = response.data.map(apiLoanToLoan)
      // setLoans(transformedLoans)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al cargar préstamos: ${errorMessage}`)
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setLoans])

  const fetchLoanById = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const apiLoan = await loansService.getLoanById(id)
      const loan = apiLoanToLoan(apiLoan)
      
      // Update the loan in the store if it exists, otherwise add it
      const existingLoan = getLoanById(id)
      if (existingLoan) {
        updateLoan(id, loan)
      } else {
        addLoan(loan)
      }

      return loan
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al cargar préstamo: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, getLoanById, updateLoan, addLoan])

  const createLoan = useCallback(async (loanData: Omit<Loan, 'id' | 'status' | 'requestDate' | 'approvedDate' | 'completedDate' | 'createdAt' | 'updatedAt' | 'client'>) => {
    try {
      setLoading(true)
      setError(null)

      const createDto = loanToCreateDto(loanData)
      const apiLoan = await loansService.createLoan(createDto)
      const newLoan = apiLoanToLoan(apiLoan)
      
      addLoan(newLoan)
      return newLoan
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al crear préstamo: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, addLoan])

  const updateLoanById = useCallback(async (id: string, loanData: Partial<CreateLoanDto>) => {
    try {
      setLoading(true)
      setError(null)

      const apiLoan = await loansService.updateLoan(id, loanData)
      const updatedLoan = apiLoanToLoan(apiLoan)
      
      updateLoan(id, updatedLoan)
      return updatedLoan
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al actualizar préstamo: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, updateLoan])

  const deleteLoan = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      await loansService.deleteLoan(id)
      removeLoan(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al eliminar préstamo: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, removeLoan])

  const searchLoanByTracking = useCallback(async (dni: string, tracking: string) => {
    try {
      setLoading(true)
      setError(null)

      const apiLoan = await loansService.getLoanByTracking(dni, tracking)
      // This endpoint returns LoanTrackingResponseDto which has a different structure
      // For now, we'll just return the raw response since it's for public tracking
      return apiLoan
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al buscar préstamo: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  return {
    loans,
    isLoading,
    error,
    fetchLoans,
    fetchLoanById,
    createLoan,
    updateLoan: updateLoanById,
    deleteLoan,
    searchLoanByTracking,
    reset,
    getTotalLoans,
    getActiveLoansByStatus,
    getLoanById,
    getLoansByClient,
    getLoanByTrack,
    getFilteredLoans,
  }
}