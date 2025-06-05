// lib/clerk.ts

import * as SecureStore from 'expo-secure-store';
import { ClerkProvider, TokenCache } from '@clerk/clerk-expo';

// 🔑 Your Clerk publishable key from Clerk Dashboard
export const CLERK_PUBLISHABLE_KEY = 'pk_test_1234567890abcdefg'; // Replace with your actual key

// 🔒 Caching the auth token securely on the device
export const tokenCache: TokenCache = {
  async getToken(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.error('Error getting token from SecureStore', err);
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('Error saving token to SecureStore', err);
    }
  },
};
