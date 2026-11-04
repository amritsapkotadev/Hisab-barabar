import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';

import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { initializeNotifications } from '@/services/notifications';
import { DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings, readPreference } from '@/services/preferences';

export default function IndexScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === 'loading') return;
    const initialize = async () => {
      const preferences = user
        ? await readPreference(user.id, 'notifications', DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings)
        : undefined;
      await initializeNotifications(preferences?.pushNotifications);
    };
    initialize().catch(error => {
      console.error('Notification initialization error:', error);
    });
  }, [status, user]);

  useEffect(() => {
    if (status === 'loading') return;
    if (__DEV__) {
      router.replace('/(tabs)/logo-preview');
    } else if (status === 'authenticated') {
      router.replace('/(tabs)');
    } else if (status === 'unauthenticated') {
      router.replace('/welcome');
    }
  }, [status]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/new_logo.png')} style={styles.logoImage} />
        <Text style={styles.logoText}>Hisab Barabar</Text>
      </View>

      <ActivityIndicator size="large" color={COLORS.action} />
      <Text style={styles.text}>Loading Hisab Barabar...</Text>
      <Text style={styles.subtext}>Made in Nepal</Text>
    </View>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textTertiary,
  },
});
