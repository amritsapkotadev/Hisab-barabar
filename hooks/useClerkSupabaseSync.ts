import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { syncClerkUserToSupabase } from '@/services/clerk-supabase';
import { Profile } from '@/types';

export function useClerkSupabaseSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const [supabaseProfile, setSupabaseProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !clerkUser) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: syncError } = await syncClerkUserToSupabase(clerkUser);
        
        if (syncError) {
          setError(syncError.message);
          console.error('Sync error:', syncError);
        } else {
          setSupabaseProfile(data);
          console.log('User successfully synced to Supabase');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to sync user');
        console.error('Sync error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    syncUser();
  }, [clerkUser, isLoaded]);

  return {
    supabaseProfile,
    isLoading,
    error,
    clerkUser,
  };
}