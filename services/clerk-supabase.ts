import { supabase, supabaseAdmin, setClerkUserContext } from './supabase';
import { User } from '@/types';

export async function syncClerkUserToSupabase(
  clerkUser: any
): Promise<{ data: User | null; error: any }> {
  try {
    if (!clerkUser) {
      return { data: null, error: new Error('No Clerk user provided') };
    }

    console.log('Syncing Clerk user to Supabase:', {
      id: clerkUser.id,
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
      name: clerkUser.fullName || clerkUser.firstName
    });

    // Set up RLS context for this user
    await setClerkUserContext(clerkUser.id);

    // Use regular client for user operations (RLS will handle permissions)
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', clerkUser.id)
      .single();

    // If user doesn't exist, create them
    if (fetchError && fetchError.code === 'PGRST116') {
      const newUser = {
        id: clerkUser.id, // This is now a TEXT field that accepts Clerk's user ID format
        email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        name: clerkUser.fullName || 
              clerkUser.firstName || 
              clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 
              'User',
        phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || null,
        created_at: new Date().toISOString(),
      };

      console.log('Creating new user in Supabase:', newUser);

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user in Supabase:', createError);
        return { data: null, error: createError };
      }

      console.log('Successfully created user in Supabase:', createdUser);
      return { data: createdUser, error: null };
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user from Supabase:', fetchError);
      return { data: null, error: fetchError };
    }

    // If user exists, check if we need to update their information
    if (existingUser) {
      const currentEmail = clerkUser.emailAddresses?.[0]?.emailAddress || existingUser.email;
      const currentName = clerkUser.fullName || clerkUser.firstName || existingUser.name;
      const currentPhone = clerkUser.phoneNumbers?.[0]?.phoneNumber || existingUser.phone;

      const needsUpdate = 
        existingUser.email !== currentEmail ||
        existingUser.name !== currentName ||
        existingUser.phone !== currentPhone;

      if (needsUpdate) {
        console.log('Updating existing user in Supabase');

        const updatedUser = {
          email: currentEmail,
          name: currentName,
          phone: currentPhone,
        };

        const { data: updatedData, error: updateError } = await supabase
          .from('users')
          .update(updatedUser)
          .eq('id', clerkUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user in Supabase:', updateError);
          return { data: existingUser, error: updateError };
        }

        console.log('Successfully updated user in Supabase');
        return { data: updatedData, error: null };
      }

      // No update needed, return existing user
      console.log('User already exists and is up to date');
      return { data: existingUser, error: null };
    }

    return { data: null, error: new Error('Unexpected state in user sync') };
  } catch (error: any) {
    console.error('Error syncing Clerk user to Supabase:', error);
    return { data: null, error };
  }
}

export async function ensureUserInSupabase(clerkUser: any): Promise<User | null> {
  const { data, error } = await syncClerkUserToSupabase(clerkUser);

  if (error) {
    console.error('Failed to sync user to Supabase:', error);
    return null;
  }

  return data;
}

// Helper function to validate user data
export function validateUserData(user: Partial<User>): boolean {
  return !!(user.id && user.email && user.name);
}

// Function to create a Supabase auth session for Clerk users
export async function createSupabaseSession(clerkUser: any, clerkToken?: string) {
  try {
    // First ensure the user exists in our users table
    const syncResult = await syncClerkUserToSupabase(clerkUser);
    
    if (syncResult.error) {
      throw syncResult.error;
    }

    // Set up the user context for RLS policies
    await setClerkUserContext(clerkUser.id);

    console.log('Supabase session context set for Clerk user:', clerkUser.id);

    return { data: syncResult.data, error: null };
  } catch (error: any) {
    console.error('Error creating Supabase session:', error);
    return { data: null, error };
  }
}