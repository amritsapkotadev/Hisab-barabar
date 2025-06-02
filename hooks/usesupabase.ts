import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '@/services/supabase';

export function useSupabase() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSupabaseUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the JWT token from Clerk
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');

      // Set the auth token in Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If profile doesn't exist, create it
      if (!profile) {
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              display_name: user.user_metadata?.name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url,
            }
          ]);

        if (createError) throw createError;
      }

      return user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  return {
    createSupabaseUser,
    loading,
    error,
  };
}