import { supabase } from './supabase';
import { Group, GroupWithMembers, Profile } from '@/types';

export async function createGroup(name: string, description: string | null, userId: string) {
  const { data, error } = await supabase
    .from('groups')
    .insert([
      { name, description, created_by: userId },
    ])
    .select('*')
    .single();
  
  if (error || !data) return { error };
  
  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert([
      { group_id: data.id, user_id: userId, role: 'admin' },
    ]);
  
  return { data, error: memberError };
}

export async function getGroups(userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups (
        id,
        name,
        description,
        created_at,
        created_by,
        profiles (
          display_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId);
  
  if (error) return { error };
  
  // Transform the data to a more convenient format
  const groups = data.map(item => ({
    id: item.groups.id,
    name: item.groups.name,
    description: item.groups.description,
    createdAt: item.groups.created_at,
    createdBy: {
      id: item.groups.created_by,
      displayName: item.groups.profiles.display_name,
      avatarUrl: item.groups.profiles.avatar_url,
    },
  }));
  
  return { data: groups };
}

export async function getGroupDetails(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      profiles!groups_created_by_fkey (
        id,
        display_name,
        avatar_url
      ),
      group_members (
        id,
        role,
        user_id,
        profiles (
          id,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('id', groupId)
    .single();
  
  if (error) return { error };
  
  // Transform the data to a more convenient format
  const groupWithMembers: GroupWithMembers = {
    ...data,
    members: data.group_members.map(member => ({
      id: member.id,
      role: member.role,
      user_id: member.user_id,
      group_id: groupId,
      created_at: '',
      profile: member.profiles,
    })),
  };
  
  return { data: groupWithMembers };
}

export async function addMemberToGroup(groupId: string, email: string, role: string = 'member') {
  // First find the user by email
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  
  if (userError || !userData) {
    return { error: new Error('User not found') };
  }
  
  // Then add the user to the group
  const { data, error } = await supabase
    .from('group_members')
    .insert([
      { group_id: groupId, user_id: userData.id, role },
    ])
    .select('*')
    .single();
  
  return { data, error };
}

export async function updateGroupMemberRole(memberId: string, role: string) {
  const { data, error } = await supabase
    .from('group_members')
    .update({ role })
    .eq('id', memberId)
    .select('*')
    .single();
  
  return { data, error };
}

export async function removeMemberFromGroup(memberId: string) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('id', memberId);
  
  return { error };
}

export async function updateGroup(groupId: string, updates: Partial<Group>) {
  const { data, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', groupId)
    .select('*')
    .single();
  
  return { data, error };
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);
  
  return { error };
}