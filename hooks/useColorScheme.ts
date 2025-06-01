import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ThemeType } from '@/types';

export function useColorScheme(): {
  colorScheme: ColorSchemeName;
  themePreference: ThemeType;
  setThemePreference: (theme: ThemeType) => Promise<void>;
} {
  const [themePreference, setThemePreferenceState] = useState<ThemeType>('system');
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Load stored theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await SecureStore.getItemAsync('themePreference');
        if (storedTheme) {
          setThemePreferenceState(storedTheme as ThemeType);
        }
      } catch (error) {
        console.log('Error loading theme preference', error);
      }
    };

    loadThemePreference();
  }, []);

  // Update color scheme based on system or preference
  useEffect(() => {
    if (themePreference === 'system') {
      setColorScheme(Appearance.getColorScheme());
      
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setColorScheme(colorScheme);
      });
      
      return () => {
        subscription.remove();
      };
    } else {
      setColorScheme(themePreference);
    }
  }, [themePreference]);

  // Function to update theme preference
  const setThemePreference = async (theme: ThemeType) => {
    try {
      await SecureStore.setItemAsync('themePreference', theme);
      setThemePreferenceState(theme);
    } catch (error) {
      console.log('Error saving theme preference', error);
    }
  };

  return {
    colorScheme,
    themePreference,
    setThemePreference,
  };
}

export default useColorScheme;