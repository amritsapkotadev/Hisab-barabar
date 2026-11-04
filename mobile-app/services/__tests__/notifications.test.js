import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { apiService } from '../api';
import { registerNotificationHandlers, setPushNotificationsEnabled } from '../notifications';
import { saveReceivedNotification } from '../notificationInbox';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));
jest.mock('@react-native-firebase/messaging', () => {
  const instance = {
    requestPermission: jest.fn(),
    registerDeviceForRemoteMessages: jest.fn(),
    getToken: jest.fn(),
    setBackgroundMessageHandler: jest.fn(),
    getInitialNotification: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    onMessage: jest.fn(),
  };
  const factory = jest.fn(() => instance);
  factory.AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2 };
  return { __esModule: true, default: factory };
});
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: { createChannel: jest.fn(), displayNotification: jest.fn() },
  AndroidImportance: { HIGH: 4 },
}));
jest.mock('../notificationInbox', () => ({ saveReceivedNotification: jest.fn() }));
jest.mock('../api', () => ({
  apiService: {
    clearFCMToken: jest.fn(),
    isAuthenticated: jest.fn(),
    updateFCMToken: jest.fn(),
  },
}));

const storage = jest.mocked(AsyncStorage);
const mockMessaging = jest.mocked(messaging());

describe('push notification preference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.setItem.mockResolvedValue(undefined);
    storage.getItem.mockResolvedValue(null);
    storage.multiRemove.mockResolvedValue(undefined);
    mockMessaging.requestPermission.mockResolvedValue(1);
    mockMessaging.registerDeviceForRemoteMessages.mockResolvedValue(undefined);
    mockMessaging.getToken.mockResolvedValue('device-token');
    apiService.clearFCMToken.mockResolvedValue({ success: true });
    apiService.isAuthenticated.mockReturnValue(true);
    apiService.updateFCMToken.mockResolvedValue({ success: true });
  });

  it('captures foreground, background, cold-start and opened messages without registering twice', async () => {
    jest.clearAllMocks();
    const message = { messageId: 'received', notification: { title: 'Hello' } };
    mockMessaging.getInitialNotification.mockResolvedValue(message);
    storage.getItem.mockResolvedValue(null);
    saveReceivedNotification.mockResolvedValue(undefined);
    registerNotificationHandlers();
    registerNotificationHandlers();
    await Promise.resolve();
    expect(mockMessaging.setBackgroundMessageHandler).toHaveBeenCalledWith(expect.any(Function));
    await mockMessaging.setBackgroundMessageHandler.mock.calls[0][0](message);
    expect(mockMessaging.onMessage).toHaveBeenCalledTimes(1);
    expect(saveReceivedNotification).toHaveBeenCalledWith(message);
    await mockMessaging.onMessage.mock.calls[0][0](message);
    expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hello', body: '' }));
    mockMessaging.onNotificationOpenedApp.mock.calls[0][0](message);
    await Promise.resolve();
    expect(saveReceivedNotification).toHaveBeenCalledTimes(4);

    storage.getItem.mockResolvedValue('false');
    notifee.displayNotification.mockClear();
    await mockMessaging.onMessage.mock.calls[0][0](message);
    expect(saveReceivedNotification).toHaveBeenCalledTimes(5);
    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });

  it('unregisters and removes the device token when disabled', async () => {
    await setPushNotificationsEnabled(false);

    expect(apiService.clearFCMToken).toHaveBeenCalledTimes(1);
    expect(storage.multiRemove).toHaveBeenCalledWith(['fcmToken', 'fcmTokenLastUploaded']);
    expect(storage.setItem).toHaveBeenCalledWith('pushNotificationsEnabled', 'false');
  });

  it('requests permission and registers a token when enabled', async () => {
    await setPushNotificationsEnabled(true);

    expect(mockMessaging.registerDeviceForRemoteMessages).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith('fcmToken', 'device-token');
    expect(apiService.updateFCMToken).toHaveBeenCalledWith('device-token');
    expect(storage.setItem).toHaveBeenCalledWith('pushNotificationsEnabled', 'true');
  });

  it('skips the server request when the current token was already uploaded', async () => {
    storage.getItem.mockImplementation(async key =>
      key === 'fcmToken' || key === 'fcmTokenLastUploaded' ? 'device-token' : null
    );

    await setPushNotificationsEnabled(true);

    expect(apiService.updateFCMToken).not.toHaveBeenCalled();
  });

  it('retries an upload when the saved token has not been confirmed on the server', async () => {
    storage.getItem.mockImplementation(async key =>
      key === 'fcmToken' ? 'device-token' : null
    );
    apiService.updateFCMToken.mockRejectedValue(new Error('Network unavailable'));

    await expect(setPushNotificationsEnabled(true)).rejects.toThrow('Network unavailable');

    expect(storage.setItem).not.toHaveBeenCalledWith('fcmTokenLastUploaded', 'device-token');
  });

  it('shares an in-flight token registration request', async () => {
    let resolveToken;
    mockMessaging.getToken.mockReturnValueOnce(new Promise(resolve => {
      resolveToken = resolve;
    }));

    const first = setPushNotificationsEnabled(true);
    const second = setPushNotificationsEnabled(true);
    await Promise.resolve();
    resolveToken('device-token');
    await Promise.all([first, second]);

    expect(mockMessaging.getToken).toHaveBeenCalledTimes(1);
    expect(apiService.updateFCMToken).toHaveBeenCalledTimes(1);
  });

  it('does not save the disabled state if server unregistration fails', async () => {
    apiService.clearFCMToken.mockRejectedValue(new Error('Network unavailable'));

    await expect(setPushNotificationsEnabled(false)).rejects.toThrow('Network unavailable');
    expect(storage.setItem).not.toHaveBeenCalledWith('pushNotificationsEnabled', 'false');
  });
});
