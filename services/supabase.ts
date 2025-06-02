// supabase.ts
import 'react-native-url-polyfill/auto'; // Necessary polyfill for URL in React Native environment
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

/**
 * Custom SecureStore adapter for Supabase session storage.
 * Uses Expo SecureStore to securely persist the auth session on the device.
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

// Supabase project URL and anon public API key
const SUPABASE_URL = 'https://fhrkdeejcqqfofgsiluf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmtkZWVqY3FxZm9mZ3NpbHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDA1NTEsImV4cCI6MjA2NDExNjU1MX0.5_z4ilJ4z-KwvZm21bMOdZW2XWxDHgK0jKzmCWO-ORU'; 

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,      // Automatically refresh access tokens before expiration
    persistSession: true,        // Persist session across app restarts
    detectSessionInUrl: false,   // Disable session detection via URL (not needed in React Native)
  },
});
 
import { makeRedirectUri } from 'expo-auth-session';

export const getRedirectUri = (): string => {
  return makeRedirectUri();
};

export default supabase;
