import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/Toast';
import OfflineStatus from '@/components/OfflineStatus';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/dataClient';
import { loadStoredLanguage } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import { ThemeProvider, useTheme, useThemedStyles } from '@/hooks/useTheme';
import { ThemeProvider as NavigationThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import AnimatedSplashLoader from '@/components/AnimatedSplashLoader';

SplashScreen.preventAutoHideAsync().catch(error => {
  console.error('Failed to keep native splash screen visible:', error);
});

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>
        {error.message || 'An unexpected error occurred.'}
      </Text>
      <Pressable
        onPress={retry}
        style={styles.errorButton}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={styles.errorButtonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
    'NotoSansDevanagari-SemiBold': NotoSansDevanagari_600SemiBold,
    'NotoSansDevanagari-Bold': NotoSansDevanagari_700Bold,
  });

  useEffect(() => {
    loadStoredLanguage();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedRoot />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedRoot() {
  const { colors: COLORS, isDark } = useTheme();
  const [splashVisible, setSplashVisible] = useState(true);
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;
  const finishSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(error => {
      console.error('Failed to hide native splash screen:', error);
    });
    setSplashVisible(false);
  }, []);
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(COLORS.background).catch(error => {
      console.error('Failed to set app background:', error);
    });
  }, [COLORS.background]);
  return (
    <NavigationThemeProvider value={{
      ...navigationTheme,
      colors: {
        ...navigationTheme.colors,
        primary: COLORS.primary,
        background: COLORS.background,
        card: COLORS.card,
        text: COLORS.text,
        border: COLORS.border,
      },
    }}>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OfflineStatus />
            {/* Measure screen insets below the banner, which already covers the status bar. */}
            <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="join/[groupId]" />
              <Stack.Screen name="joingroupbycode" />
              <Stack.Screen name="group/[id]" />
              <Stack.Screen name="settle-up/[groupId]" />
              <Stack.Screen name="add-group" />
              <Stack.Screen name="add-expense-advanced" />
              <Stack.Screen name="add-expense/[groupId]" />
              <Stack.Screen name="add-personal-expense" />
              <Stack.Screen name="profile/offline-sync" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="+not-found" />
            </Stack>
            </SafeAreaProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={COLORS.background} />
          </AuthProvider>
          </QueryClientProvider>
        </ToastProvider>
        {splashVisible && <AnimatedSplashLoader onFinish={finishSplash} manageNativeSplash />}
    </NavigationThemeProvider>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: COLORS.actionText,
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
});