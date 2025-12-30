import {initializeApp} from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

// Initialize Firebase
const firebaseConfig = {
  // Firebase config will be loaded from google-services.json on Android
  // and GoogleService-Info.plist on iOS
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize messaging
const messagingInstance = messaging();

export { app, messagingInstance }; 