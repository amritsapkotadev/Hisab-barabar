import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

const supabaseUrl = 'https://fhrkdeejcqqfofgsiluf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmtkZWVqY3FxZm9mZ3NpbHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDA1NTEsImV4cCI6MjA2NDExNjU1MX0.5_z4ilJ4z-KwvZm21bMOdZW2XWxDHgK0jKzmCWO-ORU';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Configure Supabase client with proper auth settings for Clerk integration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'expo-router',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 1,
    },
  },
});

// Create a service role client for admin operations (like user sync)
export const supabaseAdmin = createClient(
  supabaseUrl,
  // You'll need to add your service role key to environment variables
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'expo-router-admin',
      },
    },
  }
);

// Network state monitoring
NetInfo.addEventListener(state => {
  if (!state.isConnected) {
    console.warn('No internet connection');
  }
});

// Helper function to check network connection
export const checkNetworkConnection = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  if (error?.code === 'PGRST116') {
    return 'Record not found';
  }
  if (error?.code === '23505') {
    return 'This record already exists';
  }
  if (error?.message?.includes('JWT')) {
    return 'Authentication expired. Please sign in again.';
  }
  if (error?.message?.includes('network')) {
    return 'Network error. Please check your connection.';
  }
  if (error?.message?.includes('schema')) {
    return 'Database schema error. Please contact support.';
  }
  if (error?.message?.includes('uuid')) {
    return 'Invalid user ID format. Please try signing in again.';
  }
  return error?.message || 'An unexpected error occurred';
};

// Helper function to create a custom JWT for Clerk users
export const createClerkSupabaseJWT = async (clerkUserId: string) => {
  try {
    // Create a simple JWT-like token for RLS context
    // This is a basic implementation - in production you might want to use a proper JWT library
    const payload = {
      sub: clerkUserId,
      aud: 'authenticated',
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    };

    // For now, we'll use the user ID directly in RLS policies
    // In a production app, you'd want to implement proper JWT signing
    return clerkUserId;
  } catch (error) {
    console.warn('Error creating Clerk Supabase JWT:', error);
    return clerkUserId;
  }
};

// Helper function to set up RLS context for Clerk users
export const setClerkUserContext = async (clerkUserId: string) => {
  try {
    // Set a custom header that can be used in RLS policies
    supabase.rest.headers['x-user-id'] = clerkUserId;
    
    // Also try to set the auth context if possible
    const customToken = await createClerkSupabaseJWT(clerkUserId);
    
    // Note: This is a simplified approach. In production, you'd want to:
    // 1. Create proper JWTs signed with your Supabase JWT secret
    // 2. Use Supabase's auth.setSession() with a valid JWT
    // 3. Implement proper token refresh logic
    
    console.log('Set Clerk user context for RLS:', clerkUserId);
  } catch (error) {
    console.warn('Error setting user context:', error);
  }
};

export default supabase;