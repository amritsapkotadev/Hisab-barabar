import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export async function signUp(email: string, password: string, name: string) {
  try {
    // First, create the auth user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;
    if (!user) throw new Error('No user data returned');

    // Then create the user profile in our users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        name: name,
        email: email,
      });

    if (profileError) throw profileError;

    return { user, error: null };
  } catch (error: any) {
    // If anything fails, clean up by signing out
    await supabase.auth.signOut();
    return { user: null, error };
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user, error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'your-app://reset-password',
  });
  
  return { data, error };
}

export async function sendOTP(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'your-app://auth/callback',
    },
  });
  
  return { data, error };
}

export async function verifyOTP(email: string, otp: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'email',
  });
  
  return { data, error };
}