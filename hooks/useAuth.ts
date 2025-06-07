import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { useClerkSupabaseSync } from './useClerkSupabaseSync';
import { Profile } from '@/types';

export function useAuth() {
  const { signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser, isLoaded } = useUser();
  const { supabaseProfile, isLoading: isSyncing, error: syncError } = useClerkSupabaseSync();

  const signOut = useCallback(async () => {
    try {
      await clerkSignOut();
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Failed to sign out' };
    }
  }, [clerkSignOut]);

  // Convert Clerk user to our User type
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
  } : null;

  return {
    user,
    profile: supabaseProfile,
    loading: !isLoaded || isSyncing,
    signOut,
    syncError,
  };
}