import { useUser } from '@clerk/clerk-expo';
import { supabase } from './supabase';
import { Profile } from '@/types';

export async function syncClerkUserToSupabase(clerkUser: any): Promise<{ data: Profile | null; error: any }> {
  try {
    if (!clerkUser) {
      return { data: null, error: new Error('No Clerk user provided') };
    }

    // Check if user already exists in Supabase
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clerkUser.id)
      .single();

    // If user doesn't exist, create them
    if (fetchError && fetchError.code === 'PGRST116') {
      const newProfile = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        display_name: clerkUser.fullName || clerkUser.firstName || clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User',
        avatar_url: clerkUser.imageUrl || null,
        phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile in Supabase:', createError);
        return { data: null, error: createError };
      }

      console.log('Successfully created user profile in Supabase:', createdProfile);
      return { data: createdProfile, error: null };
    }

    // If user exists, update their information
    if (existingProfile) {
      const updatedProfile = {
        email: clerkUser.emailAddresses?.[0]?.emailAddress || existingProfile.email,
        display_name: clerkUser.fullName || clerkUser.firstName || existingProfile.display_name,
        avatar_url: clerkUser.imageUrl || existingProfile.avatar_url,
        phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || existingProfile.phone,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedData, error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', clerkUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile in Supabase:', updateError);
        return { data: existingProfile, error: updateError };
      }

      return { data: updatedData, error: null };
    }

    return { data: existingProfile, error: null };
  } catch (error) {
    console.error('Error syncing Clerk user to Supabase:', error);
    return { data: null, error };
  }
}

export async function ensureUserInSupabase(clerkUser: any): Promise<Profile | null> {
  const { data, error } = await syncClerkUserToSupabase(clerkUser);
  
  if (error) {
    console.error('Failed to sync user to Supabase:', error);
    return null;
  }
  
  return data;
}