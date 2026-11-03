import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { API_URL } from '@/config/api.config';
import { isNotificationTarget, notificationTargetFromData, type NotificationTarget } from '@/utils/notificationInbox';

export interface ReceivedNotification {
  id: string;
  title: string;
  body: string;
  receivedAt: number;
  readAt?: number | null;
  target?: NotificationTarget;
}

type StoredNotification = ReceivedNotification | { id: string; dismissed: true };

function isVisible(item: StoredNotification): item is ReceivedNotification {
  return !('dismissed' in item);
}

const OWNER_KEY = `notification-owner:v1:${API_URL}`;
const listeners = new Set<() => void>();
let pending: Promise<unknown> = Promise.resolve();
let accountBindingFailed = false;

function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation);
  pending = result.catch(() => undefined);
  return result;
}

function inboxKey(userId: string) {
  if (!userId) throw new Error('Sign in to view received notifications.');
  return `notification-inbox:v1:${API_URL}:${userId}`;
}

export function setNotificationAccount(userId: string | null) {
  return serialized(async () => {
    accountBindingFailed = true;
    if (userId) await AsyncStorage.setItem(OWNER_KEY, userId);
    else await AsyncStorage.removeItem(OWNER_KEY);
    accountBindingFailed = false;
  });
}

async function readInbox(userId: string): Promise<StoredNotification[]> {
  const stored = await AsyncStorage.getItem(inboxKey(userId));
  if (stored === null) return [];
  const items: unknown = JSON.parse(stored);
  if (!Array.isArray(items) || !items.every(item =>
    item !== null && typeof item === 'object' &&
    typeof item.id === 'string' &&
    (('dismissed' in item && item.dismissed === true) || (
      !('dismissed' in item) && typeof item.title === 'string' &&
      typeof item.body === 'string' && typeof item.receivedAt === 'number' &&
      Number.isFinite(item.receivedAt) &&
      (item.readAt === undefined || item.readAt === null ||
        (typeof item.readAt === 'number' && Number.isFinite(item.readAt) && item.readAt >= 0)) &&
      (item.target === undefined || isNotificationTarget(item.target))
    ))
  )) throw new Error('Saved notification history is invalid.');
  return items;
}

export function getReceivedNotifications(userId: string) {
  return serialized(async () => (await readInbox(userId)).filter(isVisible));
}

export function clearReceivedNotifications(userId: string, ids: string[]) {
  return serialized(async () => {
    if (accountBindingFailed || await AsyncStorage.getItem(OWNER_KEY) !== userId) {
      throw new Error('Sign in to this account to clear its notifications.');
    }
    const items = await readInbox(userId);
    const selected = new Set(ids);
    const next = items.map(item =>
      isVisible(item) && selected.has(item.id) ? { id: item.id, dismissed: true as const } : item);
    await AsyncStorage.setItem(inboxKey(userId), JSON.stringify(next));
    listeners.forEach(listener => listener());
  });
}

export function markNotificationsRead(userId: string, ids: string[]) {
  return serialized(async () => {
    if (accountBindingFailed || await AsyncStorage.getItem(OWNER_KEY) !== userId) {
      throw new Error('Sign in to this account to update its notifications.');
    }
    const items = await readInbox(userId);
    const selected = new Set(ids);
    const readAt = Date.now();
    let changed = false;
    const next = items.map(item => {
      if (!isVisible(item) || item.readAt !== null || !selected.has(item.id)) return item;
      changed = true;
      return { ...item, readAt };
    });
    if (!changed) return;
    await AsyncStorage.setItem(inboxKey(userId), JSON.stringify(next));
    listeners.forEach(listener => listener());
  });
}

export function subscribeToNotificationInbox(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function saveReceivedNotification(message: FirebaseMessagingTypes.RemoteMessage) {
  return serialized(async () => {
    if (accountBindingFailed) throw new Error('Notification account storage is unavailable.');
    const title = message.notification?.title ?? message.data?.title;
    const body = message.notification?.body ?? message.data?.body;
    if (typeof title !== 'string' && typeof body !== 'string') {
      console.info('Data-only message has no notification content to save.');
      return;
    }
    const item: ReceivedNotification = {
      id: message.messageId ?? `${message.sentTime ?? Date.now()}:${JSON.stringify([title, body])}`,
      title: typeof title === 'string' ? title : 'Notification',
      body: typeof body === 'string' ? body : '',
      receivedAt: Date.now(),
      readAt: null,
      target: notificationTargetFromData(message.data),
    };
    const recipientKey = `notification-recipient:v1:${API_URL}:${item.id}`;
    const originalRecipient = await AsyncStorage.getItem(recipientKey);
    const userId = originalRecipient ?? await AsyncStorage.getItem(OWNER_KEY);
    if (!userId) {
      console.warn('Received notification has no signed-in account; history was not saved.');
      return;
    }
    const items = await readInbox(userId);
    if (items.some(existing => existing.id === item.id)) return;
    if (!originalRecipient) await AsyncStorage.setItem(recipientKey, userId);
    items.unshift(item);
    await AsyncStorage.setItem(inboxKey(userId), JSON.stringify(items));
    listeners.forEach(listener => listener());
  });
}
