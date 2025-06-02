import { supabase } from './supabase';

export async function createGroup(name: string, description: string | null, userId: string) {
  // First create the group
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

  // Then add the creator as a member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert([
      {
        group_id: group.id,
        user_id: userId
      }
    ]);

  if (memberError) {
    // If adding member fails, clean up the group
    await supabase.from('groups').delete().eq('id', group.id);
    return { error: memberError };
  }

  return { data: group };
}

export async function getGroups(userId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        user_id,
        users (
          id,
          name,
          email
        )
      ),
      expenses (
        id,
        title,
        amount,
        created_by,
        date
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
        users (
          id,
          name,
          email
        )
      ),
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

export async function addGroupMember(groupId: string, userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .insert([
      {
        group_id: groupId,
        user_id: userId
      }
    ])
    .select();

  return { data, error };
}

export async function removeGroupMember(groupId: string, userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  return { data, error };
}