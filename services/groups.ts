import { supabase } from './supabase';

export async function createGroup(groupName: string, description: string | null, userId: string) {
  const { data, error } = await supabase
    .from('groups')
    .insert([
      { 
        group_name: groupName, 
        description, 
        created_by: userId 
      }
    ])
    .select()
    .single();

  return { data, error };
}

export async function getGroups(userId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('created_by', userId);

  return { data, error };
}

export async function getGroupDetails(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      expenses (
        *,
        expense_splits (*)
      )
    `)
    .eq('id', groupId)
    .single();

  return { data, error };
}