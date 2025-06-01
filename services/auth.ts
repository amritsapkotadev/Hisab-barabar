import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export async function signUp(email: string, password: string, name: string) {
  // Start a Supabase transaction
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name, // Store name in user metadata
      },
    },
  });

  if (signUpError) throw signUpError;
  if (!user) throw new Error('No user data returned');

  try {
    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: name,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) throw profileError;

    return { user, error: null };
  } catch (error) {
    // If profile creation fails, clean up by deleting the auth user
    await supabase.auth.signOut();
    throw error;
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

// Google OAuth sign in
export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    return { data, error };
  } else {
    // For mobile, we need to use the browser to complete the OAuth flow
    const redirectUrl = 'your-app://auth/callback';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    
    if (error) return { error };
    
    // Open browser for OAuth flow
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      if (result.type === 'success') {
        const { url } = result;
        // Extract the access token from URL
        if (url) {
          const params = new URLSearchParams(url.split('#')[1]);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            return { data, error };
          }
        }
      }
    }
    
    return { error: new Error('OAuth sign in failed') };
  }
}

// OTP / Magic Link authentication
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