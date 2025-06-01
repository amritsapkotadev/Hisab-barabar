import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session on load
    const loadSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Listen for auth changes
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
  
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return { data, error };
  }, []);
  
  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    return { data, error };
  }, []);
  
  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    return { error };
  }, []);
  
  const sendOTP = useCallback(async (email: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'your-app://auth/callback',
      },
    });
    setLoading(false);
    return { data, error };
  }, []);
  
  const verifyOTP = useCallback(async (email: string, otp: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    setLoading(false);
    return { data, error };
  }, []);
  
  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    sendOTP,
    verifyOTP,
  };
}