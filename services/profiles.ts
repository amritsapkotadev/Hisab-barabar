import { supabase } from './supabase';
import { Profile } from '@/types';

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
}

export async function createProfile(userId: string, displayName: string, avatarUrl: string | null = null) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      { id: userId, display_name: displayName, avatar_url: avatarUrl },
    ])
    .select('*')
    .single();
  
  return { data, error };
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single();
  
  return { data, error };
}

export async function uploadAvatar(userId: string, uri: string) {
  // Convert URI to Blob
  const response = await fetch(uri);
  const blob = await response.blob();
  
  // Generate a unique file name
  const fileName = `avatar-${userId}-${Date.now()}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase
    .storage
    .from('avatars')
    .upload(fileName, blob);
  
  if (error) return { error };
  
  // Get the public URL
  const { data: publicUrlData } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(fileName);
  
  // Update the user's profile with the new avatar URL
  const { data: profileData, error: profileError } = await updateProfile(userId, {
    avatar_url: publicUrlData.publicUrl,
  });
  
  return { data: profileData, error: profileError };
}