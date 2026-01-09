import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

export default function IndexScreen() {
  const [isLoading, setIsLoading] = useState(true);

  const requestUserPermission = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const permissionStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        console.log('Notification permission status:', permissionStatus);
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission granted.');
          await getDeviceToken();
        } else {
          console.log('Notification permission denied.');
        }
      } else {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          console.log('Notification permission granted.');
          await getDeviceToken();
        } else {
          console.log('Notification permission denied.');
        }
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  const getDeviceToken = async () => {
    try {
      await messaging().registerDeviceForRemoteMessages();
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('Device Token:', fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
        return fcmToken;
      } else {
        console.log('No device token found.');
        return null;
      }
    } catch (error) {
      console.error('Error getting device token:', error);
      return null;
    }
  };

  const setupNotificationHandlers = () => {
    // Setup notification channel
    notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    }).catch(error => {
      console.error('Error creating notification channel:', error);
    });

    // Handle notification that opened app from quit state
    messaging().getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage.notification);
          displayNotification(remoteMessage.notification);
        }
      })
      .catch(error => {
        console.error('Error getting initial notification:', error);
      });

    // Handle notification that opened app from background state
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage.notification);
      displayNotification(remoteMessage.notification);
    });

    // Handle foreground notifications
    messaging().onMessage(async remoteMessage => {
      console.log('A new message arrived!', remoteMessage);
      displayNotification(remoteMessage.notification);
    });

    // Handle background notifications
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });
  };

  const initializeApp = async () => {
    try {
      // Step 1: Request notification permissions and get FCM token FIRST
      await requestUserPermission();
      
      // Step 2: Setup notification handlers
      setupNotificationHandlers();
      
      // Step 3: Check auth status (FCM token is now available in AsyncStorage)
      await checkAuthStatus();
    } catch (error) {
      console.error('Error initializing app:', error);
      // Fallback to login on error
      router.replace('/(auth)/login');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const displayNotification = async (notification: any) => {
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      android: {
        channelId: 'default',
        importance: AndroidImportance.HIGH,
      },
    });
  };

  const checkAuthStatus = async () => {
    try {
      // const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      // if (!hasSeenWelcome) {
      //   router.replace('/welcome');
      //   return;
      // 
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        apiService.setAuthToken(token);
        try {
          await apiService.getUserProfile();
          router.replace('/(tabs)');
          return;
        } catch (error) {
          await AsyncStorage.removeItem('authToken');
          apiService.clearAuthToken();
        }
      }
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error checking auth status:', error);
      router.replace('/welcome');
    } finally {
      setIsLoading(false);
    }
  };

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
