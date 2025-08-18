import { Loan } from '@/types/auth';

export interface NextPaymentInfo {
  dueDate: Date;
  amount: number;
  paymentNumber: number;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface LoanProgress {
  paidPayments: number;
  totalPayments: number;
  percentageComplete: number;
  remainingPayments: number;
}

export interface InstallmentInfo {
  number: number;
  amount: number;
  dueDate: Date;
  status: 'PAGADO' | 'EN_PROCESO' | 'ATRASADO' | 'PENDIENTE';
  daysSinceDue?: number;
}

// Nuevos estados coherentes del préstamo
export type LoanStatusCoherent = 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';

/**
 * Calcula información sobre la próxima cuota de un préstamo
 */
export function calculateNextPayment(loan: Loan): NextPaymentInfo | null {
  if (!loan.firstDueDate || loan.status === 'COMPLETED' || loan.status === 'DEFAULTED') {
    return null;
  }

  // Por ahora, calculamos basado en la primera fecha de vencimiento
  // En el futuro, esto se basará en los subloans del backend
  const firstDue = new Date(loan.firstDueDate);
  const today = new Date();
  
  // Calcular días hasta el vencimiento
  const timeDiff = firstDue.getTime() - today.getTime();
  const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  // Calcular monto por cuota (simple division por ahora)
  const paymentAmount = loan.amount / loan.totalPayments;
  
  return {
    dueDate: firstDue,
    amount: paymentAmount,
    paymentNumber: 1,
    daysUntilDue,
    isOverdue: daysUntilDue < 0,
  };
}

/**
 * Calcula el progreso de un préstamo con lógica coherente
 */
export function calculateLoanProgress(loan: Loan): LoanProgress {
  // Determinar cuotas pagadas basado en el estado coherente del préstamo
  let paidPayments = 0;
  
  const coherentStatus = mapToCoherentStatus(loan.status);
  
  if (coherentStatus === 'COMPLETADO') {
    paidPayments = loan.totalPayments; // 100% pagado
  } else if (coherentStatus === 'EN_PROCESO') {
    // Calcular progreso basado en tiempo desde primera cuota
    if (loan.firstDueDate) {
      const today = new Date();
      const firstDue = new Date(loan.firstDueDate);
      const estimatedPaymentInterval = getPaymentIntervalDays(loan.paymentFrequency);
      
      if (today >= firstDue) {
        const daysSinceFirstDue = Math.floor((today.getTime() - firstDue.getTime()) / (1000 * 3600 * 24));
        const paymentsElapsed = Math.floor(daysSinceFirstDue / estimatedPaymentInterval) + 1;
        paidPayments = Math.min(paymentsElapsed - 1, loan.totalPayments - 1); // -1 porque la actual está en proceso
      }
    }
  }
  // CANCELADO = 0 cuotas pagadas
  
  const percentageComplete = (paidPayments / loan.totalPayments) * 100;
  const remainingPayments = loan.totalPayments - paidPayments;
  
  return {
    paidPayments,
    totalPayments: loan.totalPayments,
    percentageComplete: Math.min(percentageComplete, 100),
    remainingPayments: Math.max(remainingPayments, 0),
  };
}

/**
 * Calcula información detallada de cada cuota del préstamo
 */
export function calculateInstallments(loan: Loan): InstallmentInfo[] {
  const installments: InstallmentInfo[] = [];
  const amountPerPayment = loan.amount / loan.totalPayments;
  const today = new Date();
  const progress = calculateLoanProgress(loan);
  
  if (!loan.firstDueDate) {
    // Si no hay fecha de primera cuota, crear cuotas futuras
    for (let i = 1; i <= loan.totalPayments; i++) {
      installments.push({
        number: i,
        amount: amountPerPayment,
        dueDate: new Date(today.getTime() + (i * getPaymentIntervalDays(loan.paymentFrequency) * 24 * 60 * 60 * 1000)),
        status: 'PENDIENTE'
      });
    }
    return installments;
  }
  
  const firstDue = new Date(loan.firstDueDate);
  const paymentInterval = getPaymentIntervalDays(loan.paymentFrequency);
  
  for (let i = 1; i <= loan.totalPayments; i++) {
    const dueDate = new Date(firstDue.getTime() + ((i - 1) * paymentInterval * 24 * 60 * 60 * 1000));
    const daysSinceDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
    
    let status: InstallmentInfo['status'];
    
    if (i <= progress.paidPayments) {
      status = 'PAGADO';
    } else if (i === progress.paidPayments + 1 && mapToCoherentStatus(loan.status) === 'EN_PROCESO') {
      // Cuota actual en proceso
      if (daysSinceDue > 0) {
        status = 'ATRASADO';
      } else {
        status = 'EN_PROCESO';
      }
    } else {
      status = 'PENDIENTE';
    }
    
    installments.push({
      number: i,
      amount: amountPerPayment,
      dueDate,
      status,
      daysSinceDue: daysSinceDue > 0 ? daysSinceDue : undefined
    });
  }
  
  return installments;
}

/**
 * Mapea estados del backend a estados coherentes
 */
export function mapToCoherentStatus(backendStatus: string): LoanStatusCoherent {
  switch (backendStatus) {
    case 'COMPLETED':
      return 'COMPLETADO';
    case 'ACTIVE':
    case 'APPROVED':
    case 'PENDING':
      return 'EN_PROCESO';
    case 'REJECTED':
    case 'DEFAULTED':
      return 'CANCELADO';
    default:
      return 'EN_PROCESO';
  }
}

/**
 * Obtiene el número de días entre pagos según la frecuencia
 */
function getPaymentIntervalDays(frequency: string): number {
  switch (frequency) {
    case 'DAILY':
      return 1;
    case 'WEEKLY':
      return 7;
    case 'BIWEEKLY':
      return 14;
    case 'MONTHLY':
      return 30;
    default:
      return 7; // Default a semanal
  }
}

/**
 * Obtiene el color para el badge de días restantes
 */
export function getDaysUntilDueColor(daysUntilDue: number): 'error' | 'warning' | 'success' | 'info' {
  if (daysUntilDue < 0) {
    return 'error'; // Vencido
  } else if (daysUntilDue <= 3) {
    return 'warning'; // Próximo a vencer
  } else if (daysUntilDue <= 7) {
    return 'info'; // Una semana o menos
  } else {
    return 'success'; // Tiempo suficiente
  }
}

/**
 * Formatea el texto de días restantes
 */
export function formatDaysUntilDue(daysUntilDue: number): string {
  if (daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue);
    return `${overdueDays} día${overdueDays !== 1 ? 's' : ''} vencido${overdueDays !== 1 ? 's' : ''}`;
  } else if (daysUntilDue === 0) {
    return 'Vence hoy';
  } else if (daysUntilDue === 1) {
    return 'Vence mañana';
  } else {
    return `${daysUntilDue} días`;
  }
}

/**
 * Formatea el monto en pesos argentinos
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Obtiene el color del chip para el estado coherente del préstamo
 */
export function getLoanStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  const coherentStatus = mapToCoherentStatus(status);
  
  switch (coherentStatus) {
    case 'EN_PROCESO':
      return 'primary';
    case 'COMPLETADO':
      return 'success';
    case 'CANCELADO':
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Traduce el estado del préstamo a español coherente
 */
export function translateLoanStatus(status: string): string {
  const coherentStatus = mapToCoherentStatus(status);
  
  switch (coherentStatus) {
    case 'EN_PROCESO':
      return 'En Proceso';
    case 'COMPLETADO':
      return 'Completado';
    case 'CANCELADO':
      return 'Cancelado';
    default:
      return 'En Proceso';
  }
}

/**
 * Obtiene el color para el estado de cuota individual
 */
export function getInstallmentStatusColor(status: InstallmentInfo['status']): 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'PAGADO':
      return 'success';
    case 'EN_PROCESO':
      return 'warning';
    case 'ATRASADO':
      return 'error';
    case 'PENDIENTE':
      return 'info';
    default:
      return 'info';
  }
}

/**
 * Obtiene el icono para el estado de cuota individual
 */
export function getInstallmentStatusIcon(status: InstallmentInfo['status']): string {
  switch (status) {
    case 'PAGADO':
      return '✅';
    case 'EN_PROCESO':
      return '🟡';
    case 'ATRASADO':
      return '🔴';
    case 'PENDIENTE':
      return '⏳';
    default:
      return '⏳';
  }
}