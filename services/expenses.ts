import { supabase } from './supabase';

export type ExpenseSplit = {
  userId: string;
  paidAmount: number;
  owedAmount: number;
};

export async function createExpense(
  groupId: string,
  title: string,
  amount: number,
  paidBy: string,
  date: Date,
  splits: ExpenseSplit[]
) {
  // Start a transaction
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert([
      {
        group_id: groupId,
        title,
        amount,
        created_by: paidBy,
        date: date.toISOString(),
      }
    ])
    .select()
    .single();

  if (expenseError || !expense) {
    return { error: expenseError };
  }

  // Insert all splits
  const splitsToInsert = splits.map(split => ({
    expense_id: expense.id,
    user_id: split.userId,
    paid_amount: split.paidAmount,
    owed_amount: split.owedAmount,
  }));

  const { error: splitsError } = await supabase
    .from('expense_splits')
    .insert(splitsToInsert);

  if (splitsError) {
    return { error: splitsError };
  }

  return { data: expense };
}

export async function getExpenses(userId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      profiles!created_by (
        id,
        display_name,
        avatar_url
      ),
      expense_splits (
        user_id,
        paid_amount,
        owed_amount,
        profiles (
          id,
          display_name,
          avatar_url
        )
      )
    `)
    .order('date', { ascending: false });

  return { data, error };
}

export async function getExpenseDetails(expenseId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      profiles!created_by (
        id,
        display_name,
        avatar_url
      ),
      expense_splits (
        user_id,
        paid_amount,
        owed_amount,
        profiles (
          id,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('id', expenseId)
    .single();

  return { data, error };
}

export async function calculateBalances(groupId: string) {
  const { data: expenses, error: expensesError } = await getExpenses(groupId);
  
  if (expensesError) return { error: expensesError };
  
  const balances = new Map<string, number>();
  
  expenses?.forEach(expense => {
    // Add the paid amount to the payer's balance
    const currentPayerBalance = balances.get(expense.created_by) || 0;
    balances.set(expense.created_by, currentPayerBalance + expense.amount);
    
    // Subtract owed amounts from each participant
    expense.expense_splits.forEach(split => {
      const currentBalance = balances.get(split.user_id) || 0;
      balances.set(split.user_id, currentBalance - split.owed_amount);
    });
  });
  
  return { data: Object.fromEntries(balances) };
}