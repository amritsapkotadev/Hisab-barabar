import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { User } from '@/types';

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

  // Phone OTP send
  const sendOTP = useCallback(async (phone: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,  // phone must be in E.164 format like '+1234567890'
    });
    setLoading(false);
    return { data, error };
  }, []);

  // Phone OTP verify
  const verifyOTP = useCallback(async (phone: string, token: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',  // Important: use 'sms' for phone OTP verification
    });
    setLoading(false);
    return { data, error };
  }, []);

  // Optional: keep your email signIn and signUp if needed

  return {
    user,
    session,
    loading,
    sendOTP,
    verifyOTP,
  };
}
