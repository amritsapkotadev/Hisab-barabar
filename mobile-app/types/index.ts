// A group member is identified by a stable, group-scoped `id` that never
// changes and never collides — even if two members share the same display
// `name`. `userId` links the entry to a real registered account (enabling a
// real avatar via `picture`); it's absent for ghost/placeholder members who
// haven't signed up yet.
export interface GroupMember {
  id: string;
  name: string;
  userId?: string;
  picture?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy?: string;
  emoji?: string;
  members: GroupMember[];
  totalExpenses: number;
  /** Keyed by each member's stable `id` (see GroupMember), not their name. */
  balances: { [memberId: string]: number };
  inviteCode?: string;
  inviteLink?: string;
  createdAt: string;
  limit?: number;
  netSettlements?: { fromUserId: string; toUserId: string; amount: number }[];
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  /** For group expenses, this is a GroupMember.id, not a display name. */
  paidBy: string;
  /** For group expenses, these are GroupMember.id values, not display names. */
  participants: string[];
  splits?: { participant: string; amount: number; percentage?: number }[];
  payers?: { name: string; amountPaid: number }[];
  splitType?: 'equal' | 'unequal' | 'percentage' | 'shares';
  date: string;
  createdAt: string;
  updatedAt?: string;
  revision?: number;
  offlinePending?: boolean;
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
  authProvider?: 'email' | 'google' | 'both';
}

export interface PersonalExpensesResponse {
  success: boolean;
  data: Expense[];
  summary: {
    count: number;
    monthlySpent: number;
  };
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