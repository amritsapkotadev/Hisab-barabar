import { supabase, checkNetworkConnection } from './supabase';
import { retryOperation } from '@/utils/retryOperation';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function signUp(email: string, password: string, name: string) {
  try {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      throw new Error('No internet connection available');
    }

    const { data: { user }, error: signUpError } = await retryOperation(() => 
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name,
          },
          emailRedirectTo: Platform.select({
            web: window.location.origin,
            default: 'expense-tracker://auth/callback',
          }),
        },
      })
    );

    if (signUpError) throw signUpError;
    if (!user) throw new Error('No user data returned');

    return { user, error: null };
  } catch (error: any) {
    console.error('SignUp error:', error);
    return { 
      user: null, 
      error: error.message || 'An unexpected error occurred during signup' 
    };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      throw new Error('No internet connection available');
    }

    const { data, error } = await retryOperation(() =>
      supabase.auth.signInWithPassword({
        email,
        password,
      })
    );
    
    return { data, error };
  } catch (error: any) {
    console.error('SignIn error:', error);
    return { 
      data: null, 
      error: error.message || 'An unexpected error occurred during sign in' 
    };
  }
}

export async function signOut() {
  try {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      throw new Error('No internet connection available');
    }

    return await retryOperation(() => supabase.auth.signOut());
  } catch (error: any) {
    console.error('SignOut error:', error);
    return { error: error.message || 'Failed to sign out' };
  }
}

export async function resetPassword(email: string) {
  try {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      throw new Error('No internet connection available');
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Platform.select({
        web: `${window.location.origin}/reset-password`,
        default: 'expense-tracker://reset-password',
      }),
    });
    
    return { data, error };
  } catch (error: any) {
    console.error('ResetPassword error:', error);
    return { data: null, error: error.message };
  }
}