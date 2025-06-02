import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { User } from '@/types';
import { signOut as authSignOut } from '@/services/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    loadSession();
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await authSignOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, []);

  return {
    user,
    session,
    loading,
    signOut,
  };
}