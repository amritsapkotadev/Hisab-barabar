import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import { COLORS, DARK_COLORS, resolveTheme, type ThemeColors, type ThemePreference } from '@/constants/theme';

const STORAGE_KEY = 'appearance';
const ThemeContext = createContext({
  colors: COLORS as ThemeColors,
  preference: 'system' as ThemePreference,
  isDark: false,
  setPreference: async (_preference: ThemePreference): Promise<boolean> => {
    throw new Error('Appearance settings require ThemeProvider');
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setStoredPreference] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  const isDark = resolveTheme(preference, system) === 'dark';

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(value => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setStoredPreference(value);
      } else if (value !== null) {
        throw new Error('Invalid stored appearance preference');
      }
    }).catch(error => {
      console.error('Failed to restore appearance:', error);
      Alert.alert(i18n.t('settings.theme'), i18n.t('settings.restoreAppearanceFailed'));
    }).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) Appearance.setColorScheme(preference === 'system' ? null : preference);
  }, [preference, ready]);

  const setPreference = async (next: ThemePreference) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
      setStoredPreference(next);
      return true;
    } catch (error) {
      console.error('Failed to save appearance:', error);
      Alert.alert(i18n.t('settings.theme'), i18n.t('settings.saveAppearanceFailed'));
      return false;
    }
  };

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ colors: isDark ? DARK_COLORS : COLORS, preference, isDark, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export function useThemedStyles<T>(createStyles: (colors: ThemeColors) => T) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors, createStyles]);
  return { colors, styles };
}
