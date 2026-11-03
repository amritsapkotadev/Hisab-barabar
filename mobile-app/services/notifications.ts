import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { apiService } from './api';
import { saveReceivedNotification } from './notificationInbox';

const NOTIFICATION_CHANNEL_ID = 'high_alerts';
const PUSH_NOTIFICATIONS_ENABLED_KEY = 'pushNotificationsEnabled';
let pushNotificationsEnabled = true;
let foregroundListenersInitialized = false;

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

  if (apiService.isAuthenticated()) {
    await apiService.updateFCMToken(token);
    console.log('FCM token updated on server');
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

export const registerNotificationHandlers = () => {
  if (foregroundListenersInitialized) return;
  foregroundListenersInitialized = true;
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    try {
      await saveReceivedNotification(remoteMessage);
    } catch (error) {
      console.error('Failed to save background notification:', error);
      throw error;
    }
  });
  messaging()
    .getInitialNotification()
    .then(remoteMessage => remoteMessage && saveReceivedNotification(remoteMessage))
    .catch(error => console.error('Failed to save launch notification:', error));

  messaging().onNotificationOpenedApp(remoteMessage => {
    void saveReceivedNotification(remoteMessage).catch(error =>
      console.error('Failed to save opened notification:', error));
  });

  messaging().onMessage(async remoteMessage => {
    try {
      await saveReceivedNotification(remoteMessage);
    } catch (error) {
      console.error('Failed to save received notification:', error);
    }
    if (!pushNotificationsEnabled ||
      await AsyncStorage.getItem(PUSH_NOTIFICATIONS_ENABLED_KEY) === 'false') return;

    const title = remoteMessage.notification?.title ?? remoteMessage.data?.title;
    const body = remoteMessage.notification?.body ?? remoteMessage.data?.body;

    if (typeof title === 'string' || typeof body === 'string') {
      await createNotificationChannel();
      await notifee.displayNotification({
        title: typeof title === 'string' ? title : 'Notification',
        body: typeof body === 'string' ? body : '',
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

export const initializeNotifications = async (enabled?: boolean) => {
  const isEnabled = enabled ?? (await AsyncStorage.getItem(PUSH_NOTIFICATIONS_ENABLED_KEY)) !== 'false';
  pushNotificationsEnabled = isEnabled;
  if (isEnabled) {
    await requestNotificationPermission();
    await AsyncStorage.setItem(PUSH_NOTIFICATIONS_ENABLED_KEY, 'true');
  } else if (await AsyncStorage.getItem(PUSH_NOTIFICATIONS_ENABLED_KEY) !== 'false') {
    await setPushNotificationsEnabled(false);
  }
  await createNotificationChannel();
  registerNotificationHandlers();
};

export const setPushNotificationsEnabled = async (enabled: boolean) => {
  if (enabled) {
    await requestNotificationPermission();
    await AsyncStorage.setItem(PUSH_NOTIFICATIONS_ENABLED_KEY, 'true');
    pushNotificationsEnabled = true;
    return;
  }

  await apiService.clearFCMToken();
  pushNotificationsEnabled = false;
  await AsyncStorage.multiRemove(['fcmToken']);
  await AsyncStorage.setItem(PUSH_NOTIFICATIONS_ENABLED_KEY, 'false');
};

export const subscribeToGroupTopic = async (groupId: string) => {
  try {
    await messaging().subscribeToTopic(`group_${groupId}`);
    console.log(`Subscribed to topic: group_${groupId}`);
  } catch (error) {
    console.error('Failed to subscribe to group topic:', error);
  }
};
