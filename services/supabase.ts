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

// ✅ Supabase client for Clerk-authenticated users
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: false, // Clerk handles auth
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'expo-router-clerk',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 1,
    },
  },
});

// ✅ Admin-level client — switch to service key in backend-only environments
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'expo-router-admin',
    },
  },
});

// ✅ Network status check
NetInfo.addEventListener(state => {
  if (!state.isConnected) {
    console.warn('No internet connection');
  }
});

export const checkNetworkConnection = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};

// ✅ Error handler — includes schema error and other edge cases
export const handleSupabaseError = (error: any) => {
  if (error?.code === 'PGRST116') {
    return 'Record not found';
  }
  if (error?.code === '23505') {
    return 'This record already exists';
  }
  if (error?.code === '22P02') {
    return 'Invalid user ID format. Please try signing in again.';
  }
  if (error?.message?.includes('JWT')) {
    return 'Authentication expired. Please sign in again.';
  }
  if (error?.message?.includes('network')) {
    return 'Network error. Please check your connection.';
  }
  if (error?.message?.includes('schema')) {
    return 'Database schema error (must be in `public` or `graphql_public`). Please contact support.';
  }
  return error?.message || 'An unexpected error occurred';
};

// ✅ Clerk User Context Header Setup for RLS
export const setClerkUserContext = async (clerkUserId: string) => {
  try {
    supabase.rest.headers['x-user-id'] = clerkUserId;
    supabase.rest.headers['x-auth-provider'] = 'clerk';

    console.log('Set Clerk user context for RLS:', clerkUserId);
    return true;
  } catch (error) {
    console.warn('Error setting user context:', error);
    return false;
  }
};

// ✅ Wrapper for safe queries with Clerk user context
export const executeWithClerkContext = async <T>(
  clerkUserId: string,
  operation: () => Promise<T>
): Promise<T> => {
  await setClerkUserContext(clerkUserId);
  return await operation();
};

export default supabase;
