import { supabase, checkNetworkConnection } from './supabase';
import { retryOperation } from '@/utils/retryOperation';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';


EXPO_PUBLIC_GOOGLE_CLIENT_ID=1080592315622-59udlvepkltt7h80b5vh38q2a9mdom9f.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=1080592315622-u01m7hbjspn1vhqqna35qrna8vo8q9qj.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=1080592315622-8dcon4ij4b8ioj5rmja8sgpd3qb9hh74.apps.googleusercontent.com

export async function signInWithGoogle() {
  try {
    const [request, response, promptAsync] = Google.useAuthRequest({
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      webClientId: GOOGLE_CLIENT_ID,
      scopes: ['profile', 'email'],
    });

    if (response?.type === 'success') {
      const { id_token } = response.authentication;
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: id_token,
      });

      if (error) throw error;
      return { data, error: null };
    }

    return { data: null, error: new Error('Google sign in was cancelled or failed') };
  } catch (error: any) {
    console.error('Google SignIn error:', error);
    return { 
      data: null, 
      error: error.message || 'Failed to sign in with Google' 
    };
  }
}

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
            default: 'your-app://auth/callback',
          }),
        },
      })
    );

    if (signUpError) throw signUpError;
    if (!user) throw new Error('No user data returned');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: profile, error: profileError } = await retryOperation(() =>
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    );

    if (profileError || !profile) {
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