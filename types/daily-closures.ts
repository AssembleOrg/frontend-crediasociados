/**
 * Daily Closures Types
 * Types for managing daily operations and expenses
 */

// Expense categories for daily operations
export enum ExpenseCategory {
  COMBUSTIBLE = 'COMBUSTIBLE',
  CONSUMO = 'CONSUMO',
  REPARACIONES = 'REPARACIONES',
  OTROS = 'OTROS',
}

/**
 * Individual expense entry in a daily closure
 */
export interface Expense {
  id: string;
  dailyClosureId: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Daily closure record containing collected payments and expenses
 */
export interface DailyClosure {
  id: string;
  userId: string; // Manager ID
  closureDate: Date;
  totalCollected: number; // Total amount collected during the day
  totalExpenses: number; // Sum of all expenses
  netAmount: number; // totalCollected - totalExpenses
  notes?: string;
  expenses: Expense[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SubLoan info for daily closure view
 * Used when querying subloans by date
 */
export interface SubLoanForClosure {
  id: string;
  loanTrack: string;
  paymentNumber: number;
  amount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  dueDate: Date;
  daysOverdue: number;
  client: {
    id: string;
    fullName: string;
    dni?: string;
    phone?: string;
  };
  loan: {
    id: string;
    loanTrack: string;
    amount: number;
  };
}

/**
 * Request payload for creating a daily closure
 */
export interface CreateDailyClosureRequest {
  closureDate: string; // ISO date string YYYY-MM-DD
  totalCollected: number;
  expenses: CreateExpenseRequest[];
  notes?: string;
}

/**
 * Expense request payload
 */
export interface CreateExpenseRequest {
  category: ExpenseCategory;
  amount: number;
  description?: string;
}

/**
 * Response from creating a daily closure
 */
export interface CreateDailyClosureResponse {
  id: string;
  userId: string;
  closureDate: Date;
  totalCollected: number;
  totalExpenses: number;
  netAmount: number;
  expenses: Expense[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated response for daily closures list
 */
export interface DailyClosureListResponse {
  data: DailyClosure[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Response from getting closures by date
 */
export interface DailyClosureByDateResponse {
  closure?: DailyClosure;
  subLoans: SubLoanForClosure[];
}

/**
 * Query parameters for getting daily closures
 */
export interface GetDailyClosuresParams {
  page?: number;
  limit?: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/**
 * Expense category display name
 */
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.COMBUSTIBLE]: 'Combustible',
  [ExpenseCategory.CONSUMO]: 'Consumo',
  [ExpenseCategory.REPARACIONES]: 'Reparaciones',
  [ExpenseCategory.OTROS]: 'Otros',
};

/**
 * Helper function to get expense category color for UI
 */
export const getExpenseCategoryColor = (category: ExpenseCategory): string => {
  const colors: Record<ExpenseCategory, string> = {
    [ExpenseCategory.COMBUSTIBLE]: '#FF6B6B', // Red
    [ExpenseCategory.CONSUMO]: '#4ECDC4', // Teal
    [ExpenseCategory.REPARACIONES]: '#FFD93D', // Yellow
    [ExpenseCategory.OTROS]: '#95E1D3', // Green
  };
  return colors[category];
};
