/**
 * SINGLE SOURCE OF TRUTH - Cálculos de préstamos centralizados
 * Todas las funciones de cálculo en un solo lugar para evitar inconsistencias
 */

export interface LoanCalculationInput {
  monto: number
  interes: number // Porcentaje (ej: 5 para 5%)
  cuotas: number
  fechaInicio: Date
}

export interface LoanCalculationResult {
  montoTotal: number
  valorCuota: number
  interesTotalMonto: number
  interesProcentaje: number
  cronogramaPagos: PaymentScheduleItem[]
}

export interface PaymentScheduleItem {
  nroCuota: number
  fechaVencimiento: Date
  monto: number
  estado: 'pendiente' | 'pagada' | 'vencida'
}

/**
 * Calcula todos los valores de un préstamo
 */
export function calculateLoan(input: LoanCalculationInput): LoanCalculationResult {
  const { monto, interes, cuotas, fechaInicio } = input
  
  // Cálculo del monto total con interés simple
  const interesTotalMonto = (monto * interes) / 100
  const montoTotal = monto + interesTotalMonto
  const valorCuota = montoTotal / cuotas

  // Generar cronograma de pagos
  const cronogramaPagos: PaymentScheduleItem[] = []
  
  for (let i = 1; i <= cuotas; i++) {
    const fechaVencimiento = new Date(fechaInicio)
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i)
    
    cronogramaPagos.push({
      nroCuota: i,
      fechaVencimiento,
      monto: valorCuota,
      estado: 'pendiente'
    })
  }

  return {
    montoTotal,
    valorCuota,
    interesTotalMonto,
    interesProcentaje: interes,
    cronogramaPagos
  }
}

/**
 * Formatea cantidad como moneda argentina
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

/**
 * Calcula días entre dos fechas
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Determina si una cuota está vencida
 */
export function isPaymentOverdue(fechaVencimiento: Date): boolean {
  return new Date() > fechaVencimiento
}

/**
 * Calcula estadísticas de una cartera de préstamos
 */
export interface PortfolioStats {
  totalPrestado: number
  totalRecaudar: number
  totalVencido: number
  prestamosPendientes: number
  clientesActivos: number
}

export function calculatePortfolioStats(prestamos: Array<{
  monto: number
  montoTotal: number
  estado: string
  clienteId: string
  cuotas: Array<{
    fechaVencimiento: Date
    monto: number
    estado: 'pendiente' | 'pagada' | 'vencida'
  }>
}>): PortfolioStats {
  const totalPrestado = prestamos.reduce((sum, p) => sum + p.monto, 0)
  const totalRecaudar = prestamos.reduce((sum, p) => sum + p.montoTotal, 0)
  
  let totalVencido = 0
  prestamos.forEach(prestamo => {
    prestamo.cuotas.forEach(cuota => {
      if (cuota.estado === 'pendiente' && isPaymentOverdue(cuota.fechaVencimiento)) {
        totalVencido += cuota.monto
      }
    })
  })

  const prestamosPendientes = prestamos.filter(p => p.estado === 'activo').length
  const clientesActivos = new Set(prestamos.map(p => p.clienteId)).size

  return {
    totalPrestado,
    totalRecaudar,
    totalVencido,
    prestamosPendientes,
    clientesActivos
  }
}