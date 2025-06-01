import { supabase } from './supabase';
import { Expense, ExpenseSplit, SplitMode } from '@/types';

export async function createExpense(
  groupId: string,
  title: string,
  amount: number,
  paidById: string,
  date: string,
  category: string | null,
  description: string | null,
  splits: { userId: string; amount: number; splitMode: SplitMode }[]
) {
  // Start a transaction by using a single connection
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert([
      {
        group_id: groupId,
        title,
        amount,
        paid_by: paidById,
        date,
        category,
        description,
      },
    ])
    .select('*')
    .single();

  if (expenseError || !expense) {
    return { error: expenseError };
  }

  // Insert all the splits
  const splitsToInsert = splits.map((split) => ({
    expense_id: expense.id,
    user_id: split.userId,
    amount: split.amount,
    split_mode: split.splitMode,
  }));

  const { error: splitsError } = await supabase
    .from('expense_splits')
    .insert(splitsToInsert);

  if (splitsError) {
    return { error: splitsError };
  }

  return { data: expense };
}

export async function getExpenses(groupId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      profiles!expenses_paid_by_fkey (
        id,
        display_name,
        avatar_url
      ),
      expense_splits (
        id,
        amount,
        split_mode,
        user_id,
        profiles (
          id,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) return { error };

  // Transform the data to a more convenient format
  const expenses = data.map((expense) => ({
    ...expense,
    paidBy: expense.profiles,
    splits: expense.expense_splits.map((split) => ({
      ...split,
      user: split.profiles,
    })),
  }));

  return { data: expenses };
}

export async function getExpenseDetails(expenseId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      profiles!expenses_paid_by_fkey (
        id,
        display_name,
        avatar_url
      ),
      expense_splits (
        id,
        amount,
        split_mode,
        user_id,
        profiles (
          id,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('id', expenseId)
    .single();

  if (error) return { error };

  // Transform the data to a more convenient format
  const expense = {
    ...data,
    paidBy: data.profiles,
    splits: data.expense_splits.map((split) => ({
      ...split,
      user: split.profiles,
    })),
  };

  return { data: expense };
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<Expense>,
  splits?: { id?: string; userId: string; amount: number; splitMode: SplitMode }[]
) {
  // Update the expense
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', expenseId)
    .select('*')
    .single();

  if (expenseError || !expense) {
    return { error: expenseError };
  }

  // If splits are provided, update them
  if (splits) {
    // Delete existing splits
    await supabase
      .from('expense_splits')
      .delete()
      .eq('expense_id', expenseId);

    // Insert new splits
    const splitsToInsert = splits.map((split) => ({
      expense_id: expenseId,
      user_id: split.userId,
      amount: split.amount,
      split_mode: split.splitMode,
    }));

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splitsToInsert);

    if (splitsError) {
      return { error: splitsError };
    }
  }

  return { data: expense };
}

export async function deleteExpense(expenseId: string) {
  // Delete splits first (cascade delete would work too if set up in the database)
  const { error: splitError } = await supabase
    .from('expense_splits')
    .delete()
    .eq('expense_id', expenseId);

  if (splitError) {
    return { error: splitError };
  }

  // Then delete the expense
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  return { error };
}

export async function createSettlement(
  groupId: string,
  fromUserId: string,
  toUserId: string,
  amount: number,
  notes: string | null
) {
  const { data, error } = await supabase
    .from('settlements')
    .insert([
      {
        group_id: groupId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount,
        notes,
      },
    ])
    .select('*')
    .single();

  return { data, error };
}

export async function getSettlements(groupId: string) {
  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      profiles!settlements_from_user_id_fkey (
        id,
        display_name,
        avatar_url
      ),
      profiles!settlements_to_user_id_fkey (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) return { error };

  // Transform the data to a more convenient format
  const settlements = data.map((settlement) => ({
    id: settlement.id,
    amount: settlement.amount,
    notes: settlement.notes,
    createdAt: settlement.created_at,
    fromUser: settlement['profiles!settlements_from_user_id_fkey'],
    toUser: settlement['profiles!settlements_to_user_id_fkey'],
  }));

  return { data: settlements };
}

export async function calculateBalances(groupId: string, userId: string) {
  // This is a complex calculation that would typically be done on the server side
  // with a stored procedure or function, but here's a simplified version
  
  // 1. Get all expenses for the group
  const { data: expenses, error: expensesError } = await getExpenses(groupId);
  
  if (expensesError) return { error: expensesError };
  
  // 2. Get all settlements for the group
  const { data: settlements, error: settlementsError } = await getSettlements(groupId);
  
  if (settlementsError) return { error: settlementsError };
  
  // 3. Calculate balances
  const balances = new Map<string, number>();
  
  // Process expenses
  expenses.forEach(expense => {
    // The payer gets credit
    const payerId = expense.paidBy.id;
    balances.set(payerId, (balances.get(payerId) || 0) + expense.amount);
    
    // Everyone who owes pays
    expense.splits.forEach(split => {
      const owerId = split.user.id;
      balances.set(owerId, (balances.get(owerId) || 0) - split.amount);
    });
  });
  
  // Process settlements
  settlements.forEach(settlement => {
    const fromId = settlement.fromUser.id;
    const toId = settlement.toUser.id;
    
    balances.set(fromId, (balances.get(fromId) || 0) - settlement.amount);
    balances.set(toId, (balances.get(toId) || 0) + settlement.amount);
  });
  
  // 4. Get user details for all users in the balances
  const userIds = Array.from(balances.keys());
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds);
  
  if (profilesError) return { error: profilesError };
  
  // 5. Format the balances
  const formattedBalances = profiles.map(profile => ({
    userId: profile.id,
    name: profile.display_name,
    avatarUrl: profile.avatar_url,
    amount: balances.get(profile.id) || 0,
  }));
  
  // 6. Sort by amount (positive balances first)
  formattedBalances.sort((a, b) => b.amount - a.amount);
  
  return { data: formattedBalances };
}