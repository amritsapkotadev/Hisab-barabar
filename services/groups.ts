import { supabase } from './supabase';

export async function createGroup(name: string, description: string | null, userId: string) {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert([
      { 
        group_name: name, 
        description, 
        created_by: userId 
      }
    ])
    .select()
    .single();

  if (groupError) {
    return { error: groupError };
  }

  return { data: group };
}

export async function getGroups(userId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      expenses (
        id,
        title,
        amount,
        created_by,
        date
      )
    `)
    .eq('created_by', userId);

  return { data, error };
}

export async function getGroupDetails(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      expenses (
        id,
        title,
        amount,
        created_by,
        date,
        expense_splits (
          user_id,
          paid_amount,
          owed_amount
        )
      )
    `)
    .eq('id', groupId)
    .single();

  return { data, error };
}