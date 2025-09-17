export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy?: string;
  emoji?: string;
  members: string[];
  totalExpenses: number;
  balances: { [userId: string]: number };
  inviteCode?: string;
  inviteLink?: string;
  createdAt: string;
  limit?: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  splits?: { participant: string; amount: number; percentage?: number }[];
  payers?: { name: string; amountPaid: number }[];
  splitType?: 'equal' | 'unequal' | 'percentage' | 'shares';
  date: string;
  createdAt: string;
  type: 'personal' | 'group';
  paymentMethod: string;
  category: string;
  createdBy: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  googleId?: string;
  picture?: string;
  budget?: number;
}

export interface BudgetResponse {
  success: boolean;
  budget: number;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ExpenseSplit {
  participant: string;
  amount: number;
  percentage?: number;
}

export interface Payer {
  name: string;
  amountPaid: number;
}