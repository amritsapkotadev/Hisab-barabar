import React from 'react';
import { act, create } from 'react-test-renderer';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAccountPreference } from '../useAccountPreference';
import { DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings } from '../../services/preferences';

let mockUser = { id: 'user-1' };
const mockError = jest.fn();
const mockRefreshUser = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, status: 'authenticated', refreshUser: mockRefreshUser }),
}));
jest.mock('@/components/Toast', () => ({ useToast: () => ({ error: mockError }) }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

let preference;
function Probe() {
  preference = useAccountPreference('notifications', DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings);
  return null;
}

describe('saved preference UI', () => {
  let renderer;
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    mockUser = { id: 'user-1' };
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    renderer = null;
    jest.restoreAllMocks();
  });

  it('keeps the old value until persistence succeeds and blocks overlapping writes', async () => {
    await act(async () => { renderer = create(<Probe />); });
    let finish;
    AsyncStorage.setItem.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    let saving;
    await act(async () => {
      saving = preference.save({ ...DEFAULT_NOTIFICATION_SETTINGS, pushNotifications: false });
    });
    expect(preference.saving).toBe(true);
    expect(preference.value.pushNotifications).toBe(true);
    await act(async () => {
      expect(await preference.save({ ...DEFAULT_NOTIFICATION_SETTINGS, soundEnabled: false })).toBe(false);
      finish();
      expect(await saving).toBe(true);
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(preference.value.pushNotifications).toBe(false);
  });

  it('isolates restored preferences when the account changes', async () => {
    AsyncStorage.getItem.mockImplementation(async key => JSON.stringify({
      ...DEFAULT_NOTIFICATION_SETTINGS,
      soundEnabled: !key.includes('user-1'),
    }));
    await act(async () => { renderer = create(<Probe />); });
    expect(preference.value.soundEnabled).toBe(false);
    mockUser = { id: 'user-2' };
    await act(async () => renderer.update(<Probe />));
    expect(preference.loading).toBe(false);
    expect(preference.value.soundEnabled).toBe(true);
  });

  it('shows restore errors and preserves values when a save fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    AsyncStorage.getItem.mockRejectedValue(new Error('Storage unavailable'));
    await act(async () => { renderer = create(<Probe />); });
    expect(preference.error).toContain('Could not load');
    AsyncStorage.getItem.mockResolvedValue(null);
    await act(async () => preference.retry());
    expect(preference.error).toBeNull();
    AsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));
    await act(async () => {
      expect(await preference.save({ ...DEFAULT_NOTIFICATION_SETTINGS, soundEnabled: false })).toBe(false);
    });
    expect(preference.value.soundEnabled).toBe(true);
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('previous settings'));
  });
});
