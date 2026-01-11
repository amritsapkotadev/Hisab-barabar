import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

import { apiService } from '@/services/api';

/* -------------------------------------------------------------------------- */
/*                          BACKGROUND MESSAGE HANDLER                         */
/* -------------------------------------------------------------------------- */
/* MUST be outside component */
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage?.notification?.title);
  
  // Since backend now sends notification payload, it will auto-display
  // No need to manually display here - Firebase handles it automatically
  // This handler is just for custom data processing if needed
  
  return Promise.resolve();
});

/* -------------------------------------------------------------------------- */
/*                                   SCREEN                                   */
/* -------------------------------------------------------------------------- */

export default function IndexScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                               INITIAL SETUP                              */
  /* ------------------------------------------------------------------------ */

  const initializeApp = async () => {
    try {
      await requestNotificationPermission();
      await createNotificationChannel();
      await setupForegroundListeners();
      await checkAuthStatus();
    } catch (error) {
      console.error('Initialization error:', error);
      router.replace('/(auth)/login');
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                          NOTIFICATION PERMISSION                          */
  /* ------------------------------------------------------------------------ */

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied');
        return;
      }
    } else {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Notification permission denied');
        return;
      }
    }

    await registerFCMToken();
  };

  /* ------------------------------------------------------------------------ */
  /*                               FCM TOKEN                                  */
  /* ------------------------------------------------------------------------ */

  const registerFCMToken = async () => {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();

    if (token) {
      console.log('FCM Token:', token);
      await AsyncStorage.setItem('fcmToken', token);
      
      // Update token on server if user is authenticated
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) {
        try {
          await apiService.updateFCMToken(token);
          console.log('FCM token updated on server');
        } catch (error) {
          console.error('Failed to update FCM token on server:', error);
        }
      }
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                         NOTIFICATION CHANNEL (ANDROID)                    */
  /* ------------------------------------------------------------------------ */

  const createNotificationChannel = async () => {
    await notifee.createChannel({
      id: 'high_alerts',
      name: 'High Priority Alerts',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });
  };

  /* ------------------------------------------------------------------------ */
  /*                        FOREGROUND MESSAGE HANDLING                        */
  /* ------------------------------------------------------------------------ */

  const setupForegroundListeners = async () => {
    // App opened from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        // Don't display notification here, it's already shown by system
        console.log('App opened from quit state:', remoteMessage?.notification?.title);
      });

    // App opened from background
    messaging().onNotificationOpenedApp(remoteMessage => {
      // Don't display notification here, it's already shown by system
      console.log('App opened from background:', remoteMessage?.notification?.title);
    });

    // Foreground notifications - Display when app is open
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);
      
      // When app is in foreground, Firebase doesn't auto-display notifications
      // We need to manually display them using Notifee
      const title = remoteMessage?.notification?.title || remoteMessage?.data?.title || 'Notification';
      const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || '';
      
      if (title && body) {
        await notifee.displayNotification({
          title: String(title),
          body: String(body),
          android: {
            channelId: 'high_alerts',
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
            sound: 'default',
          },
        });
      }
    });
  };


  /* ------------------------------------------------------------------------ */
  /*                             AUTH CHECK                                   */
  /* ------------------------------------------------------------------------ */

  const checkAuthStatus = async () => {
    const token = await AsyncStorage.getItem('authToken');

    if (token) {
      apiService.setAuthToken(token);
      try {
        await apiService.getUserProfile();
        router.replace('/(tabs)');
        return;
      } catch {
        await AsyncStorage.removeItem('authToken');
        apiService.clearAuthToken();
      }
    }

    router.replace('/(auth)/login');
  };

  /* ------------------------------------------------------------------------ */
  /*                                   UI                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>💰</Text>
        <Text style={styles.logoText}>Hisab Barabar</Text>
      </View>

      <ActivityIndicator size="large" color="#4f46e5" />
      <Text style={styles.text}>Loading Hisab Barabar...</Text>
      <Text style={styles.subtext}>Made with ❤️ in Nepal 🇳🇵</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 48,
    marginRight: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
});
