import { supabase } from './supabase';
import { User } from '@/types'; // assuming you renamed Profile to User

export async function syncClerkUserToSupabase(
  clerkUser: any
): Promise<{ data: User | null; error: any }> {
  try {
    if (!clerkUser) {
      return { data: null, error: new Error('No Clerk user provided') };
    }

    // Check if user already exists in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('users') // corrected table name here
      .select('*')
      .eq('id', clerkUser.id)
      .single();

    // If user doesn't exist, create them
    if (fetchError && fetchError.code === 'PGRST116') {
      const newUser = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        name: clerkUser.fullName || 
              clerkUser.firstName || 
              clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 
              'User', // changed display_name to name to match DB
        phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || null,
        created_at: new Date().toISOString(),
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users') // corrected table name here
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
      const needsUpdate = 
        existingUser.email !== (clerkUser.emailAddresses?.[0]?.emailAddress || existingUser.email) ||
        existingUser.name !== (clerkUser.fullName || clerkUser.firstName || existingUser.name) ||
        existingUser.phone !== (clerkUser.phoneNumbers?.[0]?.phoneNumber || existingUser.phone);

      if (needsUpdate) {
        const updatedUser = {
          email: clerkUser.emailAddresses?.[0]?.emailAddress || existingUser.email,
          name: clerkUser.fullName || clerkUser.firstName || existingUser.name,
          phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || existingUser.phone,
        };

        const { data: updatedData, error: updateError } = await supabase
          .from('users') // corrected table name here
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
export function validateProfileData(user: Partial<User>): boolean {
  return !!(user.id && user.email && user.name);
}
