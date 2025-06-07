import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { syncClerkUserToSupabase } from '@/services/clerk-supabase';
import { Profile } from '@/types';

export function useClerkSupabaseSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const [supabaseProfile, setSupabaseProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const syncUser = useCallback(async () => {
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
        
        // Auto-retry on network errors (up to 3 times)
        if (retryCount < 3 && (syncError.message.includes('network') || syncError.message.includes('timeout'))) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000 * (retryCount + 1)); // Exponential backoff
        }
      } else {
        setSupabaseProfile(data);
        setRetryCount(0); // Reset retry count on success
        console.log('User successfully synced to Supabase');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync user');
      console.error('Sync error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser, isLoaded, retryCount]);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  const retrySync = useCallback(() => {
    setRetryCount(0);
    syncUser();
  }, [syncUser]);

  return {
    supabaseProfile,
    isLoading,
    error,
    clerkUser,
    retrySync,
  };
}