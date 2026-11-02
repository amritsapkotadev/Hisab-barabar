import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en';
import ne from './locales/ne';

export type AppLanguage = 'en' | 'ne';

const LANGUAGE_STORAGE_KEY = 'appLanguage';

type LocalizationModule = typeof import('expo-localization');

let localization: LocalizationModule | null | undefined;

const getDeviceLanguage = (): string | undefined => {
  if (localization === undefined) {
    try {
      localization = require('expo-localization') as LocalizationModule;
    } catch {
      console.warn(
        'expo-localization unavailable; defaulting to English. Rebuild the native app to enable device language detection.'
      );
      localization = null;
    }
  }

  try {
    return localization?.getLocales()[0]?.languageCode ?? undefined;
  } catch {
    return undefined;
  }
};

const initialLanguage: AppLanguage = getDeviceLanguage() === 'ne' ? 'ne' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ne: { translation: ne },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export async function loadStoredLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if ((stored === 'en' || stored === 'ne') && stored !== i18n.language) {
      await i18n.changeLanguage(stored);
    }
  } catch (error) {
    console.error('Failed to load stored language:', error);
  }
}

export async function setLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Failed to store language:', error);
  }
}

export default i18n;
