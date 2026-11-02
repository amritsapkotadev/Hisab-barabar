import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_NOTIFICATION_SETTINGS = {
  pushNotifications: true,
  emailNotifications: true,
  expenseAdded: true,
  expenseUpdated: true,
  groupInvites: true,
  balanceReminders: true,
  weeklyDigest: false,
  monthlyReport: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

export type NotificationSettings = typeof DEFAULT_NOTIFICATION_SETTINGS;

export interface PaymentMethod {
  id: string;
  type: 'esewa' | 'bank' | 'cash';
  name: string;
  details: string;
  isDefault: boolean;
  isActive: boolean;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [{
  id: 'cash',
  type: 'cash',
  name: 'Cash Settlement',
  details: 'In-person payment',
  isDefault: true,
  isActive: true,
}];

export function isNotificationSettings(value: unknown): value is NotificationSettings {
  return typeof value === 'object' && value !== null &&
    Object.keys(DEFAULT_NOTIFICATION_SETTINGS).every(key =>
      typeof Reflect.get(value, key) === 'boolean'
    );
}

export function isPaymentMethods(value: unknown): value is PaymentMethod[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const ids = new Set<string>();
  let defaults = 0;
  for (const method of value) {
    if (typeof method !== 'object' || method === null ||
      typeof method.id !== 'string' || !method.id || ids.has(method.id) ||
      !['esewa', 'bank', 'cash'].includes(method.type) ||
      typeof method.name !== 'string' || !method.name.trim() ||
      typeof method.details !== 'string' ||
      typeof method.isDefault !== 'boolean' || typeof method.isActive !== 'boolean' ||
      (method.isDefault && !method.isActive)) return false;
    ids.add(method.id);
    if (method.isDefault) defaults++;
  }
  return defaults === 1;
}

type PreferenceName = 'notifications' | 'paymentMethods';

function preferenceKey(userId: string, name: PreferenceName) {
  if (!userId) throw new Error('A signed-in account is required to access preferences');
  return `preferences:v1:${userId}:${name}`;
}

export async function readPreference<T>(
  userId: string,
  name: PreferenceName,
  defaultValue: T,
  validate: (value: unknown) => value is T
): Promise<T> {
  const stored = await AsyncStorage.getItem(preferenceKey(userId, name));
  if (stored === null) return defaultValue;
  const parsed: unknown = JSON.parse(stored);
  if (!validate(parsed)) throw new Error(`Invalid saved ${name} preferences`);
  return parsed;
}

export async function writePreference<T>(
  userId: string,
  name: PreferenceName,
  value: T,
  validate: (value: unknown) => value is T
) {
  if (!validate(value)) throw new Error(`Invalid ${name} preferences`);
  await AsyncStorage.setItem(preferenceKey(userId, name), JSON.stringify(value));
}
