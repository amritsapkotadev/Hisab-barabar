import { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type GroupMember = Database['public']['Tables']['group_members']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type ExpenseSplit = Database['public']['Tables']['expense_splits']['Row'];
export type Settlement = Database['public']['Tables']['settlements']['Row'];

export type User = {
  id: string;
  email: string;
};

export type SplitMode = 'equal' | 'percent' | 'custom';

export type ExpenseWithDetails = Expense & {
  paidBy: Profile;
  splits: (ExpenseSplit & {
    user: Profile;
  })[];
};

export type GroupWithMembers = Group & {
  members: (GroupMember & {
    profile: Profile;
  })[];
};

export type Balance = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  amount: number; // positive means they owe you, negative means you owe them
};

export type GroupSummary = {
  id: string;
  name: string;
  memberCount: number;
  totalExpenses: number;
  yourBalance: number; // positive means group owes you, negative means you owe the group
  recentActivity: {
    type: 'expense' | 'settlement';
    id: string;
    amount: number;
    date: string;
    title: string;
  } | null;
};

export type ExpenseCategory = 
  | 'food' 
  | 'transportation' 
  | 'accommodation' 
  | 'entertainment' 
  | 'shopping' 
  | 'utilities' 
  | 'healthcare' 
  | 'education' 
  | 'travel' 
  | 'other';

export type ThemeType = 'light' | 'dark' | 'system';