import api from './api';
import type { components } from '@/types/api-generated';

// Types from backend
type CollectionRouteStatus = 'ACTIVE' | 'CLOSED';

export interface CollectionRouteItem {
  id: string;
  routeId: string;
  subLoanId: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  orderIndex: number;
  amountCollected: number;
  amountSpent: number;
  netAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  subLoan: {
    id: string;
    paymentNumber: number;
    amount: number;
    totalAmount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
    loan: {
      loanTrack: string;
      amount: number;
      currency: string;
    };
  };
  expenseDetails?: Array<{
    transactionId: string;
    amount: number;
    description: string;
    transactionDate: string;
  }>;
}

export interface CollectionRoute {
  id: string;
  managerId: string;
  routeDate: string;
  status: CollectionRouteStatus;
  totalCollected: number;
  totalExpenses: number;
  totalLoaned?: number; // Dinero prestado (se mostrará como negativo)
  netAmount: number;
  notes?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: CollectionRouteItem[];
  expenses?: RouteExpense[]; // New field for route expenses
  manager?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface UpdateOrderDto {
  items: Array<{
    itemId: string;
    orderIndex: number;
  }>;
}

export interface CloseRouteDto {
  notes?: string;
}

export interface GetRoutesParams {
  status?: CollectionRouteStatus;
  dateFrom?: string;    // Can be YYYY-MM-DD (for single day) or ISO string (for range start)
  dateTo?: string;      // Optional - for range queries (ISO string)
  managerId?: string;
}

export type ExpenseCategory = 'COMBUSTIBLE' | 'CONSUMO' | 'REPARACIONES' | 'OTROS';

export interface RouteExpense {
  id: string;
  routeId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRouteExpenseDto {
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export interface UpdateRouteExpenseDto {
  category?: ExpenseCategory;
  amount?: number;
  description?: string;
}

export interface TodayExpensesResponse {
  date: string;
  total: number;
  totalAmount: number;
  expenses: Array<{
    monto: number;
    categoria: ExpenseCategory;
    descripcion: string;
    nombreManager: string;
    emailManager: string;
    fechaGasto: string;
  }>;
}

class CollectionRoutesService {
  /**
   * Get today's active route for the current manager
   */
  async getTodayRoute(managerId?: string): Promise<CollectionRoute | null> {
    try {
      const params = managerId ? { managerId } : {};
      const response = await api.get('/collection-routes/today', { params });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No route for today
      }
      throw error;
    }
  }

  /**
   * Get route by specific date
   */
  async getRouteByDate(date: string, managerId?: string): Promise<CollectionRoute | null> {
    try {
      // Send just dateFrom with the date (YYYY-MM-DD format)
      // Backend will interpret as the full day
      const params: any = { dateFrom: date };
      if (managerId) {
        params.managerId = managerId;
      }
      
      const response = await api.get('/collection-routes', { params });
      const routes = response.data.data;
      
      return routes.length > 0 ? routes[0] : null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get routes with filters (historical view)
   */
  async getRoutes(params?: GetRoutesParams): Promise<CollectionRoute[]> {
    const response = await api.get('/collection-routes', { params });
    return response.data.data;
  }

  /**
   * Get specific route by ID
   */
  async getRouteById(routeId: string): Promise<CollectionRoute> {
    const response = await api.get(`/collection-routes/${routeId}`);
    return response.data.data;
  }

  /**
   * Update order of route items
   */
  async updateOrder(routeId: string, orderData: UpdateOrderDto): Promise<CollectionRoute> {
    const response = await api.put(`/collection-routes/${routeId}/order`, orderData);
    return response.data.data;
  }

  /**
   * Close a route (end of day)
   */
  async closeRoute(routeId: string, closeData: CloseRouteDto): Promise<CollectionRoute> {
    const response = await api.post(`/collection-routes/${routeId}/close`, closeData);
    return response.data.data;
  }

  /**
   * Manually create daily routes (admin only, for testing)
   */
  async createDailyRoutes(): Promise<{
    message: string;
    createdRoutes: Array<{
      managerId: string;
      managerName: string;
      routeId: string;
      itemsCount: number;
    }>;
    date: string;
  }> {
    const response = await api.post('/collection-routes/create-daily');
    return response.data.data;
  }

  /**
   * Create a new expense for a route
   */
  async createRouteExpense(
    routeId: string,
    expenseData: CreateRouteExpenseDto
  ): Promise<RouteExpense> {
    const response = await api.post(`/collection-routes/${routeId}/expenses`, expenseData);
    return response.data.data;
  }

  /**
   * Update an existing expense
   */
  async updateRouteExpense(
    expenseId: string,
    expenseData: UpdateRouteExpenseDto
  ): Promise<RouteExpense> {
    const response = await api.put(`/collection-routes/expenses/${expenseId}`, expenseData);
    return response.data.data;
  }

  /**
   * Delete an expense
   */
  async deleteRouteExpense(expenseId: string): Promise<{ message: string }> {
    const response = await api.delete(`/collection-routes/expenses/${expenseId}`);
    return response.data;
  }

  /**
   * Get today's expenses
   */
  async getTodayExpenses(): Promise<TodayExpensesResponse> {
    const response = await api.get('/collection-routes/today/expenses');
    return response.data.data || response.data;
  }
}

const collectionRoutesService = new CollectionRoutesService();
export default collectionRoutesService;

