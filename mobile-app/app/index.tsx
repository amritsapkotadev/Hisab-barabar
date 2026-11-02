import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import messaging from '@react-native-firebase/messaging';

import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { initializeNotifications } from '@/services/notifications';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage?.notification?.title);
  return Promise.resolve();
});

export default function IndexScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { status } = useAuth();

  useEffect(() => {
    initializeNotifications().catch(error => {
      console.error('Notification initialization error:', error);
    });
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/(tabs)');
    } else if (status === 'unauthenticated') {
      router.replace('/(auth)/login');
    }
  }, [status]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/icon.png')} style={styles.logoImage} />
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
