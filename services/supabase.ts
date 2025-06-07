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

// Configure Supabase client with retries and better error handling
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
  db: {
    schema: 'public',
  },
  // Add retrying for failed requests
  realtime: {
    params: {
      eventsPerSecond: 1,
    },
  },
});

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
  return error?.message || 'An unexpected error occurred';
};

export default supabase;