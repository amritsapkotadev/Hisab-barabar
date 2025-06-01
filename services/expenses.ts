import { supabase } from './supabase';
import { Expense, ExpensePayer, SplitDetails, SplitMethod } from '@/types';

export async function createExpense(
  groupId: string,
  title: string,
  amount: number,
  payers: { userId: string; amount: number }[],
  splitMethod: SplitMethod,
  splitDetails: SplitDetails,
  date: string,
  category: string | null,
  description: string | null,
) {
  // Start a transaction
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert([
      {
        group_id: groupId,
        title,
        amount,
        split_method: splitMethod,
        split_details: splitDetails,
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

  // Insert all payers
  const payersToInsert = payers.map((payer) => ({
    expense_id: expense.id,
    user_id: payer.userId,
    amount_paid: payer.amount,
  }));

  const { error: payersError } = await supabase
    .from('expense_payers')
    .insert(payersToInsert);

  if (payersError) {
    return { error: payersError };
  }

  return { data: expense };
}

export async function getExpenses(groupId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      expense_payers (
        id,
        amount_paid,
        user_id,
        profiles (
          id,
          display_name,
          avatar_url
        )
      ),
      groups (
        id,
        name,
        description
      )
    `)
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) return { error };

  // Transform the data to a more convenient format
  const expenses = data.map((expense) => ({
    ...expense,
    payers: expense.expense_payers.map((payer) => ({
      ...payer,
      user: payer.profiles,
    })),
    group: expense.groups,
    splitDetails: expense.split_details as SplitDetails,
  }));

  return { data: expenses };
}

export async function getExpenseDetails(expenseId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      expense_payers (
        id,
        amount_paid,
        user_id,
        profiles (
          id,
          display_name,
          avatar_url
        )
      ),
      groups (
        id,
        name,
        description
      )
    `)
    .eq('id', expenseId)
    .single();

  if (error) return { error };

  // Transform the data
  const expense = {
    ...data,
    payers: data.expense_payers.map((payer) => ({
      ...payer,
      user: payer.profiles,
    })),
    group: data.groups,
    splitDetails: data.split_details as SplitDetails,
  };

  return { data: expense };
}

export async function calculateBalances(groupId: string, userId: string) {
  const { data: expenses, error: expensesError } = await getExpenses(groupId);
  
  if (expensesError) return { error: expensesError };
  
  const balances = new Map<string, number>();
  
  // Process expenses
  expenses.forEach(expense => {
    // Add what each person paid
    expense.payers.forEach(payer => {
      const payerId = payer.user_id;
      balances.set(payerId, (balances.get(payerId) || 0) + payer.amount_paid);
    });
    
    // Subtract what each person owes based on split details
    const splitDetails = expense.splitDetails;
    Object.entries(splitDetails.shares).forEach(([userId, share]) => {
      let amount = 0;
      
      switch (splitDetails.method) {
        case 'equal':
          amount = expense.amount / Object.keys(splitDetails.shares).length;
          break;
        case 'unequal':
          amount = share.amount || 0;
          break;
        case 'share':
          const totalShares = Object.values(splitDetails.shares)
            .reduce((sum, s) => sum + (s.share || 0), 0);
          amount = expense.amount * (share.share || 0) / totalShares;
          break;
        case 'percentage':
          amount = expense.amount * (share.percentage || 0) / 100;
          break;
      }
      
      balances.set(userId, (balances.get(userId) || 0) - amount);
    });
  });
  
  // Get user details for all users in the balances
  const userIds = Array.from(balances.keys());
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds);
  
  if (profilesError) return { error: profilesError };
  
  // Format the balances
  const formattedBalances = profiles.map(profile => ({
    userId: profile.id,
    name: profile.display_name,
    avatarUrl: profile.avatar_url,
    amount: balances.get(profile.id) || 0,
  }));
  
  return { data: formattedBalances };
}