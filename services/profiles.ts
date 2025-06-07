import { supabase } from './supabase';
import { User } from '@/types';

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
}

export async function createProfile(userId: string, name: string, email: string, phone: string | null = null) {
  const { data, error } = await supabase
    .from('users')
    .insert([
      { id: userId, name, email, phone },
    ])
    .select('*')
    .single();
  
  return { data, error };
}

export async function updateProfile(userId: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
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
  
  // Note: Since we don't have avatar_url in users table, we'll need to add it
  // or handle avatars differently. For now, we'll just return the URL
  return { data: publicUrlData.publicUrl, error: null };
}