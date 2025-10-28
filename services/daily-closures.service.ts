import api from './api';
import type {
  DailyClosure,
  DailyClosureListResponse,
  DailyClosureByDateResponse,
  CreateDailyClosureRequest,
  CreateDailyClosureResponse,
  GetDailyClosuresParams,
  SubLoanForClosure,
} from '@/types/daily-closures';

class DailyClosuresService {
  /**
   * Create a new daily closure
   * Registers all collected payments and expenses for the day
   *
   * @param data Daily closure details with expenses
   * @returns Created daily closure with all details
   */
  async createClosure(data: CreateDailyClosureRequest): Promise<CreateDailyClosureResponse> {
    const response = await api.post('/daily-closures', data);
    return response.data.data;
  }

  /**
   * Get all daily closures for the authenticated manager
   * Paginated with optional date filters
   *
   * @param params Pagination and filter parameters
   * @returns List of daily closures with pagination metadata
   */
  async getMyClosure(params: GetDailyClosuresParams = {}): Promise<DailyClosureListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    const queryString = searchParams.toString();
    const url = queryString ? `/daily-closures/my-closures?${queryString}` : '/daily-closures/my-closures';

    const response = await api.get(url);
    return response.data.data;
  }

  /**
   * Get detailed view of a specific daily closure
   * Includes all expenses and related information
   *
   * @param closureId The closure ID to retrieve
   * @returns Complete closure details
   */
  async getClosureById(closureId: string): Promise<DailyClosure> {
    const response = await api.get(`/daily-closures/${closureId}`);
    return response.data.data;
  }

  /**
   * Get closure information for a specific date
   * Shows the closure and all subloans that were due on that date
   *
   * @param date Date in format YYYY-MM-DD
   * @returns Closure info and subloans due on that date
   */
  async getClosureByDate(date: string): Promise<DailyClosureByDateResponse> {
    const response = await api.get(`/daily-closures/date/${date}`);
    return response.data.data;
  }

  /**
   * Get all subloans due on a specific date
   * Used when creating a closure to know what payments were expected
   *
   * @param date Date in format YYYY-MM-DD
   * @returns Array of subloans due on that date
   */
  async getSubLoansByDate(date: string): Promise<SubLoanForClosure[]> {
    const response = await api.get(`/daily-closures/subloans-by-date/${date}`);
    return response.data.data;
  }

  /**
   * Format date for API requests
   * Converts Date to YYYY-MM-DD format
   */
  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper: Calculate summary statistics from closures
   */
  calculateSummary(closures: DailyClosure[]): {
    totalCollected: number;
    totalExpenses: number;
    netAmount: number;
    averageDaily: number;
  } {
    const totals = closures.reduce(
      (acc, closure) => ({
        collected: acc.collected + closure.totalCollected,
        expenses: acc.expenses + closure.totalExpenses,
        net: acc.net + closure.netAmount,
      }),
      { collected: 0, expenses: 0, net: 0 }
    );

    return {
      totalCollected: totals.collected,
      totalExpenses: totals.expenses,
      netAmount: totals.net,
      averageDaily: closures.length > 0 ? totals.net / closures.length : 0,
    };
  }

  /**
   * Helper: Group expenses by category
   */
  groupExpensesByCategory(closure: DailyClosure): Record<string, number> {
    return closure.expenses.reduce(
      (acc, expense) => ({
        ...acc,
        [expense.category]: (acc[expense.category] || 0) + expense.amount,
      }),
      {} as Record<string, number>
    );
  }
}

export const dailyClosuresService = new DailyClosuresService();
export default dailyClosuresService;
