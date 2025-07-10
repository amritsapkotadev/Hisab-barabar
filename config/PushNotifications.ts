// PushNotifications.js
import messaging from '@react-native-firebase/messaging';

// Function to request user permission for notifications
export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Notification permission granted.');
    const token = await messaging().getToken();
    console.log('FCM Device Token:', token);
    return token; // Return the token if needed
  } else {
    console.log('Notification permission denied.');
  }
}

// Function to handle foreground messages
export function handleForegroundMessages() {
  messaging().onMessage(async remoteMessage => {
    console.log('A new message arrived!', remoteMessage);
    // You can show an alert or handle the message as needed
  });
}

// Function to handle background messages
export function handleBackgroundMessages() {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  });
}

// Function to initialize push notifications
export async function initPushNotifications() {
  await requestUserPermission();
  handleForegroundMessages();
  handleBackgroundMessages();
}
