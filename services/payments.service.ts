import api from './api';
import type {
  Payment,
  PaymentDistribution,
  PaginatedResponse,
} from '@/types/auth';

/**
 * Payment Distribution Result from Backend
 * When a payment exceeds the subloan amount, excess is distributed to previous PARTIAL subloans
 */
interface PaymentResponse {
  payment: Payment;
  subLoan: {
    id: string;
    status: 'PARTIAL' | 'PAID';
    paidAmount: number;
    totalAmount: number;
    remainingAmount: number;
  };
  distributedPayments: PaymentDistribution[];
}

/**
 * Request payload for registering a single payment
 */
interface RegisterPaymentRequest {
  subLoanId: string;
  amount: number;
  currency: 'ARS' | 'USD';
  paymentDate: string;
  description?: string;
}

/**
 * Request payload for registering multiple payments at once
 */
interface BulkRegisterRequest {
  payments: RegisterPaymentRequest[];
}

/**
 * Bulk payment response - array of individual payment responses
 */
interface BulkPaymentResponse {
  results: PaymentResponse[];
  failedPayments?: Array<{
    subLoanId: string;
    error: string;
  }>;
}

/**
 * Payment history for a specific subloan
 */
interface PaymentHistoryResponse {
  subLoan: {
    id: string;
    paymentNumber: number;
    totalAmount: number;
    paidAmount: number;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  };
  payments: Payment[];
  paymentHistory?: Array<{
    date: string;
    amount: number;
    balance: number;
  }>;
}

class PaymentsService {
  /**
   * Register a payment for a specific SubLoan
   * Handles partial payments and excess distribution automatically
   *
   * @param data Payment details
   * @returns Payment response with subloan status update and distribution info
   */
  async registerPayment(data: RegisterPaymentRequest): Promise<PaymentResponse> {
    const response = await api.post('/payments/register', data);
    return response.data.data;
  }

  /**
   * Register multiple payments at once
   * Useful for bulk operations or importing multiple payments
   *
   * @param data Bulk payment request with array of payments
   * @returns Array of payment responses
   */
  async bulkRegisterPayments(data: BulkRegisterRequest): Promise<BulkPaymentResponse> {
    const response = await api.post('/payments/bulk-register', data);
    return response.data.data;
  }

  /**
   * Get payment history for a specific SubLoan
   * Shows all payments made and their distribution
   *
   * @param subLoanId The SubLoan ID to get history for
   * @returns Payment history with payment details and distribution info
   */
  async getPaymentHistory(subLoanId: string): Promise<PaymentHistoryResponse> {
    const response = await api.get(`/payments/subloan/${subLoanId}`);
    return response.data.data;
  }

  /**
   * Helper: Calculate excess payment distribution
   * Shows what would happen if we make a payment
   * (This is informational - the backend handles actual distribution)
   *
   * @param paymentAmount The amount being paid
   * @param subLoanTotalAmount The total amount expected for this subloan
   * @param alreadyPaidAmount How much has been paid already
   * @returns Object with final status and excess amount
   */
  calculatePaymentResult(
    paymentAmount: number,
    subLoanTotalAmount: number,
    alreadyPaidAmount: number
  ): {
    newPaidAmount: number;
    newStatus: 'PARTIAL' | 'PAID';
    remainingAmount: number;
    excessAmount: number;
  } {
    const totalOwed = subLoanTotalAmount - alreadyPaidAmount;
    const newPaidAmount = alreadyPaidAmount + paymentAmount;

    return {
      newPaidAmount: Math.min(newPaidAmount, subLoanTotalAmount),
      newStatus: newPaidAmount >= subLoanTotalAmount ? 'PAID' : 'PARTIAL',
      remainingAmount: Math.max(0, subLoanTotalAmount - newPaidAmount),
      excessAmount: Math.max(0, newPaidAmount - subLoanTotalAmount),
    };
  }

  /**
   * Format payment date for API (ISO string)
   */
  formatPaymentDate(date: Date): string {
    return date.toISOString();
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService;
