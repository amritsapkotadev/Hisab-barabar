import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import { COLORS, DARK_COLORS, resolveTheme, type ThemeColors, type ThemePreference } from '@/constants/theme';
import { AppAlertContext, type AppAlertButton, type AppAlertState } from '@/contexts/AppAlertContext';
import ThemedAlert from '@/components/ThemedAlert';

const STORAGE_KEY = 'appearance';
const ThemeContext = createContext({
  colors: COLORS as ThemeColors,
  preference: 'light' as ThemePreference,
  isDark: false,
  setPreference: async (_preference: ThemePreference): Promise<boolean> => {
    throw new Error('Appearance settings require ThemeProvider');
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setStoredPreference] = useState<ThemePreference>('light');
  const [ready, setReady] = useState(false);
  const [alertState, setAlertState] = useState<AppAlertState | null>(null);
  const isDark = resolveTheme(preference, system) === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const showAlert = useCallback((title: string, message?: string, buttons?: AppAlertButton[]) => {
    setAlertState({
      title,
      message,
      buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(value => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setStoredPreference(value);
      } else if (value !== null) {
        throw new Error('Invalid stored appearance preference');
      }
    }).catch(error => {
      console.error('Failed to restore appearance:', error);
      showAlert(i18n.t('settings.theme'), i18n.t('settings.restoreAppearanceFailed'));
    }).finally(() => setReady(true));
  }, [showAlert]);

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
      showAlert(i18n.t('settings.theme'), i18n.t('settings.saveAppearanceFailed'));
      return false;
    }
  };

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ colors, preference, isDark, setPreference }}>
      <AppAlertContext.Provider value={{ showAlert }}>
        {children}
        <ThemedAlert
          alert={alertState}
          colors={colors}
          onPressButton={(button) => {
            setAlertState(null);
            button.onPress?.();
          }}
          onRequestClose={() => setAlertState(null)}
        />
      </AppAlertContext.Provider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export function useThemedStyles<T>(createStyles: (colors: ThemeColors) => T) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors, createStyles]);
  return { colors, styles };
}
