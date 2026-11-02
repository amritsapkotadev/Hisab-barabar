import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PAYMENT_METHODS,
  isNotificationSettings,
  isPaymentMethods,
  readPreference,
  writePreference,
} from '../preferences';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const storage = jest.mocked(AsyncStorage);

describe('account preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockResolvedValue();
  });

  it('restores defaults only when no saved preference exists', async () => {
    expect(await readPreference('user-1', 'notifications', DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings))
      .toEqual(DEFAULT_NOTIFICATION_SETTINGS);
    storage.getItem.mockResolvedValue('{"pushNotifications": false}');
    await expect(readPreference('user-1', 'notifications', DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings))
      .rejects.toThrow('Invalid saved');
  });

  it('round-trips preferences without crossing account keys', async () => {
    const saved = { ...DEFAULT_NOTIFICATION_SETTINGS, soundEnabled: false };
    await writePreference('user-1', 'notifications', saved, isNotificationSettings);
    expect(storage.setItem).toHaveBeenCalledWith('preferences:v1:user-1:notifications', JSON.stringify(saved));
    storage.getItem.mockImplementation(async key =>
      key === 'preferences:v1:user-1:notifications' ? JSON.stringify(saved) : null
    );
    expect(await readPreference('user-1', 'notifications', DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings)).toEqual(saved);
    expect(await readPreference('user-2', 'notifications', DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings)).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
  });

  it('rejects malformed, duplicate or inactive default payment methods', () => {
    expect(isPaymentMethods(DEFAULT_PAYMENT_METHODS)).toBe(true);
    expect(isPaymentMethods([])).toBe(false);
    expect(isPaymentMethods([null])).toBe(false);
    expect(isPaymentMethods([...DEFAULT_PAYMENT_METHODS, ...DEFAULT_PAYMENT_METHODS])).toBe(false);
    expect(isPaymentMethods([{ ...DEFAULT_PAYMENT_METHODS[0], isActive: false }])).toBe(false);
    expect(isPaymentMethods([{ ...DEFAULT_PAYMENT_METHODS[0], isDefault: false }])).toBe(false);
    expect(isPaymentMethods([{ ...DEFAULT_PAYMENT_METHODS[0], type: 'invalid' }])).toBe(false);
  });

  it('does not acknowledge failed saves or accept missing account identity', async () => {
    storage.setItem.mockRejectedValue(new Error('Storage full'));
    await expect(writePreference('user-1', 'paymentMethods', DEFAULT_PAYMENT_METHODS, isPaymentMethods))
      .rejects.toThrow('Storage full');
    await expect(writePreference('', 'paymentMethods', DEFAULT_PAYMENT_METHODS, isPaymentMethods))
      .rejects.toThrow('signed-in account');
  });
});
