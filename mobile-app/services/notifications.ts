import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { apiService } from './api';
import { getStoredAuthToken } from './tokenStorage';

const NOTIFICATION_CHANNEL_ID = 'high_alerts';

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

const registerFCMToken = async () => {
  await messaging().registerDeviceForRemoteMessages();
  const token = await messaging().getToken();

  if (!token) {
    return;
  }

  await AsyncStorage.setItem('fcmToken', token);
  console.log('FCM Token:', token);

  const authToken = await getStoredAuthToken();
  if (authToken) {
    try {
      await apiService.updateFCMToken(token);
      console.log('FCM token updated on server');
    } catch (error) {
      console.error('Failed to update FCM token on server:', error);
    }
  }
};

const createNotificationChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: 'High Priority Alerts',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });
};

const setupForegroundListeners = () => {
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      console.log('App opened from quit state:', remoteMessage?.notification?.title);
    });

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('App opened from background:', remoteMessage?.notification?.title);
  });

  messaging().onMessage(async remoteMessage => {
    console.log('Foreground notification received:', remoteMessage);

    const title =
      remoteMessage?.notification?.title || remoteMessage?.data?.title || 'Notification';
    const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || '';

    if (title && body) {
      await notifee.displayNotification({
        title: String(title),
        body: String(body),
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          sound: 'default',
        },
      });
    }
  });
};

export const initializeNotifications = async () => {
  await requestNotificationPermission();
  await createNotificationChannel();
  setupForegroundListeners();
};

export const subscribeToGroupTopic = async (groupId: string) => {
  try {
    await messaging().subscribeToTopic(`group_${groupId}`);
    console.log(`Subscribed to topic: group_${groupId}`);
  } catch (error) {
    console.error('Failed to subscribe to group topic:', error);
  }
};
