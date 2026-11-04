import React from 'react';
import { act, create } from 'react-test-renderer';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import IndexScreen from '../../app/index';
import { router } from 'expo-router';
import { initializeNotifications } from '@/services/notifications';
import { readPreference } from '@/services/preferences';

let mockStatus = 'loading';
let mockUser = null;
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ status: mockStatus, user: mockUser }),
}));
jest.mock('@/services/notifications', () => ({ initializeNotifications: jest.fn() }));
jest.mock('@/services/preferences', () => ({
  DEFAULT_NOTIFICATION_SETTINGS: { pushNotifications: true },
  isNotificationSettings: jest.fn(),
  readPreference: jest.fn().mockResolvedValue({ pushNotifications: true }),
}));
jest.mock('@/hooks/useTheme', () => ({
  useThemedStyles: () => ({ colors: {}, styles: {} }),
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@react-native-firebase/messaging', () => () => ({
  setBackgroundMessageHandler: jest.fn(),
}));

describe('startup notification ordering', () => {
  let renderer;
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    mockStatus = 'loading';
    mockUser = null;
    jest.clearAllMocks();
    initializeNotifications.mockResolvedValue(undefined);
    readPreference.mockResolvedValue({ pushNotifications: true });
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    renderer = null;
  });

  it.each(['authenticated', 'unauthenticated'])('waits for auth restoration before initializing when %s', async status => {
    await act(async () => { renderer = create(<IndexScreen />); });
    expect(initializeNotifications).not.toHaveBeenCalled();
    mockStatus = status;
    await act(async () => renderer.update(<IndexScreen />));
    expect(initializeNotifications).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith(
      __DEV__ ? '/(tabs)/logo-preview' : status === 'authenticated' ? '/(tabs)' : '/welcome'
    );
  });

  it('initializes push notifications from the signed-in account preference', async () => {
    mockStatus = 'authenticated';
    mockUser = { id: 'user-1' };
    readPreference.mockResolvedValue({ pushNotifications: false });

    await act(async () => { renderer = create(<IndexScreen />); });

    expect(readPreference).toHaveBeenCalledWith(
      'user-1',
      'notifications',
      expect.any(Object),
      expect.any(Function)
    );
    expect(initializeNotifications).toHaveBeenCalledWith(false);
  });
});
