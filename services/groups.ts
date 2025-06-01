import { supabase } from './supabase';

export async function createGroup(name: string, description: string | null, userId: string) {
  // First create the group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert([
      { 
        name, 
        description, 
        created_by: userId 
      }
    ])
    .select()
    .single();

  if (groupError) {
    return { error: groupError };
  }

  // Then add the creator as a member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert([
      {
        group_id: group.id,
        user_id: userId,
        role: 'admin'
      }
    ]);

  if (memberError) {
    return { error: memberError };
  }

  return { data: group };
}

export async function getGroups(userId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner (
        user_id
      )
    `)
    .eq('group_members.user_id', userId);

  return { data, error };
}

export async function getGroupDetails(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        user_id,
        role,
        profiles (
          id,
          display_name,
          avatar_url
        )
      ),
      expenses (
        *,
        expense_splits (*)
      )
    `)
    .eq('id', groupId)
    .single();

  return { data, error };
}