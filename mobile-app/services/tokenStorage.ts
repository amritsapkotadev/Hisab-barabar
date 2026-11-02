import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'authToken';

type SecureStoreModule = typeof import('expo-secure-store');

let secureStore: SecureStoreModule | null | undefined;

const getSecureStore = (): SecureStoreModule | null => {
  if (secureStore !== undefined) {
    return secureStore;
  }

  try {
    secureStore = require('expo-secure-store') as SecureStoreModule;
  } catch {
    console.warn(
      'SecureStore unavailable; using AsyncStorage for the auth token. Rebuild the native app to enable secure storage.'
    );
    secureStore = null;
  }

  return secureStore;
};

export async function getStoredAuthToken(): Promise<string | null> {
  const store = getSecureStore();

  if (store) {
    try {
      const token = await store.getItemAsync(TOKEN_KEY);
      if (token) {
        return token;
      }
    } catch (error) {
      console.warn('Failed to read auth token from SecureStore', error);
    }
  }

  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function storeAuthToken(token: string): Promise<void> {
  const store = getSecureStore();

  if (store) {
    try {
      await store.setItemAsync(TOKEN_KEY, token);
      return;
    } catch (error) {
      console.warn('Failed to store auth token in SecureStore', error);
    }
  }

  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearStoredAuthToken(): Promise<void> {
  const store = getSecureStore();

  if (store) {
    try {
      await store.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to delete auth token from SecureStore', error);
    }
  }

  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function migrateLegacyAuthToken(): Promise<string | null> {
  const store = getSecureStore();

  if (!store) {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  try {
    const secureToken = await store.getItemAsync(TOKEN_KEY);
    if (secureToken) {
      return secureToken;
    }
  } catch (error) {
    console.warn('Failed to read auth token from SecureStore', error);
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
  if (!legacyToken) {
    return null;
  }

  try {
    await store.setItemAsync(TOKEN_KEY, legacyToken);
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to migrate auth token to SecureStore', error);
  }

  return legacyToken;
}
