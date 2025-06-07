import { useEffect, useState, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { syncClerkUserToSupabase } from '@/services/clerk-supabase';
import { Profile } from '@/types';

export function useClerkSupabaseSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useAuth();
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
      console.log('Starting Clerk-Supabase sync for user:', clerkUser.id);

      const { data, error: syncError } = await syncClerkUserToSupabase(clerkUser);
      
      if (syncError) {
        // Handle specific error types
        if (syncError.code === '22P02') {
          setError('Authentication system error. Please try signing out and back in.');
        } else if (syncError.message?.includes('network')) {
          setError('Network connection error. Please check your internet connection.');
        } else {
          setError(syncError.message || 'Failed to sync user data');
        }
        
        console.error('Sync error:', syncError);
        
        // Auto-retry on network errors (up to 3 times)
        if (retryCount < 3 && (
          syncError.message?.includes('network') || 
          syncError.message?.includes('timeout') ||
          syncError.message?.includes('fetch')
        )) {
          console.log(`Retrying sync (attempt ${retryCount + 1}/3)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000 * (retryCount + 1)); // Exponential backoff
        }
      } else {
        setSupabaseProfile(data);
        setRetryCount(0); // Reset retry count on success
        console.log('User successfully synced to Supabase:', data?.id);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sync user';
      setError(errorMessage);
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
    setError(null);
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