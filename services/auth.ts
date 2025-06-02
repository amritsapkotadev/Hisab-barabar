import { supabase, checkNetworkConnection } from './supabase';
import { retryOperation } from '@/utils/retryOperation';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export async function signUp(email: string, password: string, name: string) {
  try {
    // Check network connection first
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      throw new Error('No internet connection available');
    }

    // Use retry operation for signup
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
            default: 'your-app://auth/callback',
          }),
        },
      })
    );

    if (signUpError) throw signUpError;
    if (!user) throw new Error('No user data returned');

    // Wait for the database trigger to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify the profile was created
    const { data: profile, error: profileError } = await retryOperation(() =>
      supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
    );

    if (profileError || !profile) {
      // If profile creation failed, clean up
      await supabase.auth.signOut();
      throw new Error('Failed to create user profile');
    }

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

export async function getCurrentUser() {
  try {
    const { data, error } = await retryOperation(() => supabase.auth.getUser());
    return { user: data?.user, error };
  } catch (error: any) {
    console.error('GetCurrentUser error:', error);
    return { user: null, error: error.message };
  }
}

export async function getSession() {
  try {
    const { data, error } = await retryOperation(() => supabase.auth.getSession());
    return { session: data.session, error };
  } catch (error: any) {
    console.error('GetSession error:', error);
    return { session: null, error: error.message };
  }
}

export async function resetPassword(email: string) {
  try {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      throw new Error('No internet connection available');
    }

    const { data, error } = await retryOperation(() =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password',
      })
    );
    
    return { data, error };
  } catch (error: any) {
    console.error('ResetPassword error:', error);
    return { data: null, error: error.message };
  }
}

export async function sendOTP(email: string) {
  try {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      throw new Error('No internet connection available');
    }

    const { data, error } = await retryOperation(() =>
      supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'your-app://auth/callback',
        },
      })
    );
    
    return { data, error };
  } catch (error: any) {
    console.error('SendOTP error:', error);
    return { data: null, error: error.message };
  }
}

export async function verifyOTP(email: string, otp: string) {
  try {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      throw new Error('No internet connection available');
    }

    const { data, error } = await retryOperation(() =>
      supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })
    );
    
    return { data, error };
  } catch (error: any) {
    console.error('VerifyOTP error:', error);
    return { data: null, error: error.message };
  }
}