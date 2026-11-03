import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getReceivedNotifications,
  saveReceivedNotification,
  setNotificationAccount,
  subscribeToNotificationInbox,
  markNotificationsRead,
  clearReceivedNotifications,
} from '../notificationInbox';
import { isNotificationUnread } from '@/utils/notificationInbox';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(),
}));
jest.mock('@/config/api.config', () => ({ API_URL: 'https://example.invalid/api' }));

const storage = jest.mocked(AsyncStorage);
const disk = new Map<string, string>();
const message = { fcmOptions: {}, messageId: 'message-1', notification: { title: 'Hello', body: 'Received on this device' } };

beforeEach(async () => {
  jest.clearAllMocks();
  disk.clear();
  storage.getItem.mockImplementation(async key => disk.get(key) ?? null);
  storage.setItem.mockImplementation(async (key, value) => { disk.set(key, value); });
  storage.removeItem.mockImplementation(async key => { disk.delete(key); });
  await setNotificationAccount('user-1');
});

it('clears selected history durably, strips content and suppresses duplicate delivery after account switches', async () => {
  await saveReceivedNotification(message);
  const listener = jest.fn();
  const unsubscribe = subscribeToNotificationInbox(listener);
  await clearReceivedNotifications('user-1', ['message-1']);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(await getReceivedNotifications('user-1')).toEqual([]);
  expect(JSON.parse(disk.get('notification-inbox:v1:https://example.invalid/api:user-1')!))
    .toEqual([{ id: 'message-1', dismissed: true }]);
  await setNotificationAccount('user-2');
  await saveReceivedNotification(message);
  expect(await getReceivedNotifications('user-2')).toEqual([]);
  await setNotificationAccount('user-1');
  await saveReceivedNotification(message);
  await markNotificationsRead('user-1', ['message-1']);
  expect(await getReceivedNotifications('user-1')).toEqual([]);
  unsubscribe();
});

it('preserves arrivals not included in the clear confirmation', async () => {
  await saveReceivedNotification(message);
  await Promise.all([
    saveReceivedNotification({ ...message, messageId: 'new-arrival' }),
    clearReceivedNotifications('user-1', ['message-1']),
  ]);
  expect((await getReceivedNotifications('user-1')).map(item => item.id)).toEqual(['new-arrival']);
});

it('keeps history on failed clear writes and allows retry', async () => {
  await saveReceivedNotification(message);
  const listener = jest.fn();
  const unsubscribe = subscribeToNotificationInbox(listener);
  storage.setItem.mockRejectedValueOnce(new Error('Cannot clear history'));
  await expect(clearReceivedNotifications('user-1', ['message-1'])).rejects.toThrow('Cannot clear history');
  expect(listener).not.toHaveBeenCalled();
  expect(await getReceivedNotifications('user-1')).toHaveLength(1);
  await clearReceivedNotifications('user-1', ['message-1']);
  expect(await getReceivedNotifications('user-1')).toEqual([]);
  unsubscribe();
});

it('rejects clearing another account and preserves its history', async () => {
  await saveReceivedNotification(message);
  await setNotificationAccount('user-2');
  await expect(clearReceivedNotifications('user-1', ['message-1'])).rejects.toThrow('Sign in');
  expect(await getReceivedNotifications('user-1')).toHaveLength(1);
});

it('persists title, body and receipt time; duplicate receipt/open events do not duplicate history', async () => {
  await saveReceivedNotification(message);
  await saveReceivedNotification(message);
  expect(await getReceivedNotifications('user-1')).toEqual([{
    id: 'message-1', title: 'Hello', body: 'Received on this device', receivedAt: expect.any(Number), readAt: null,
  }]);
  expect([...disk.keys()]).toContain('notification-inbox:v1:https://example.invalid/api:user-1');
});

it('preserves simultaneous receipts in newest-first order', async () => {
  await Promise.all(Array.from({ length: 10 }, (_, index) =>
    saveReceivedNotification({ ...message, messageId: `message-${index}` })));
  expect((await getReceivedNotifications('user-1')).map(item => item.id))
    .toEqual(Array.from({ length: 10 }, (_, index) => `message-${9 - index}`));
});

it('captures data payloads, body-only and title-only notifications', async () => {
  await saveReceivedNotification({ fcmOptions: {}, messageId: 'data', data: { title: 'Data title', body: 'Data body' } });
  await saveReceivedNotification({ fcmOptions: {}, messageId: 'body', notification: { body: 'Body only' } });
  await saveReceivedNotification({ fcmOptions: {}, messageId: 'title', notification: { title: 'Title only' } });
  expect(await getReceivedNotifications('user-1')).toMatchObject([
    { id: 'title', title: 'Title only', body: '' },
    { id: 'body', title: 'Notification', body: 'Body only' },
    { id: 'data', title: 'Data title', body: 'Data body' },
  ]);
});

it('keeps history isolated across account switches and sign-out', async () => {
  await saveReceivedNotification(message);
  await setNotificationAccount('user-2');
  expect(await getReceivedNotifications('user-2')).toEqual([]);
  await saveReceivedNotification(message);
  expect(await getReceivedNotifications('user-2')).toEqual([]);
  await saveReceivedNotification({ ...message, messageId: 'user-2-message' });
  await setNotificationAccount(null);
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await saveReceivedNotification({ ...message, messageId: 'signed-out' });
  expect(warning).toHaveBeenCalled();
  warning.mockRestore();
  expect((await getReceivedNotifications('user-1')).map(item => item.id)).toEqual(['message-1']);
  expect((await getReceivedNotifications('user-2')).map(item => item.id)).toEqual(['user-2-message']);
});

it('fails closed after a binding error without attributing new receipts to the previous account', async () => {
  storage.setItem.mockRejectedValueOnce(new Error('Storage unavailable'));
  await expect(setNotificationAccount('user-2')).rejects.toThrow('Storage unavailable');
  await expect(saveReceivedNotification(message)).rejects.toThrow('account storage is unavailable');
  expect(await getReceivedNotifications('user-1')).toEqual([]);
  await setNotificationAccount('user-2');
  await saveReceivedNotification(message);
  expect(await getReceivedNotifications('user-2')).toHaveLength(1);
});

it('notifies subscribers only after durable writes and supports unsubscribe', async () => {
  const listener = jest.fn();
  const unsubscribe = subscribeToNotificationInbox(listener);
  await saveReceivedNotification(message);
  expect(listener).toHaveBeenCalledTimes(1);
  await saveReceivedNotification(message);
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
  await saveReceivedNotification({ ...message, messageId: 'another' });
  expect(listener).toHaveBeenCalledTimes(1);
});

it('reports storage failure without poisoning later receipts or acknowledging a save', async () => {
  const listener = jest.fn();
  const unsubscribe = subscribeToNotificationInbox(listener);
  storage.setItem.mockRejectedValueOnce(new Error('Storage full'));
  await expect(saveReceivedNotification(message)).rejects.toThrow('Storage full');
  expect(listener).not.toHaveBeenCalled();
  await saveReceivedNotification(message);
  expect(await getReceivedNotifications('user-1')).toHaveLength(1);
  unsubscribe();
});

it('retains the original recipient when receipt storage fails before an account switch', async () => {
  storage.setItem.mockImplementation(async (key, value) => {
    if (key.startsWith('notification-inbox:')) throw new Error('Inbox write failed');
    disk.set(key, value);
  });
  await expect(saveReceivedNotification(message)).rejects.toThrow('Inbox write failed');
  storage.setItem.mockImplementation(async (key, value) => { disk.set(key, value); });
  await setNotificationAccount('user-2');
  await saveReceivedNotification(message);
  expect(await getReceivedNotifications('user-1')).toHaveLength(1);
  expect(await getReceivedNotifications('user-2')).toEqual([]);
});

it('reports corrupt history without overwriting it and requires an account for reads', async () => {
  const key = 'notification-inbox:v1:https://example.invalid/api:user-1';
  disk.set(key, '[{"id":42}]');
  await expect(getReceivedNotifications('user-1')).rejects.toThrow('history is invalid');
  await expect(saveReceivedNotification(message)).rejects.toThrow('history is invalid');
  expect(disk.get(key)).toBe('[{"id":42}]');
  await expect(getReceivedNotifications('')).rejects.toThrow('Sign in');
});

it('treats legacy receipts as already read without rewriting or deleting history', async () => {
  const key = 'notification-inbox:v1:https://example.invalid/api:user-1';
  const legacy = [{ id: 'legacy', title: 'Saved earlier', body: 'Original body', receivedAt: 123 }];
  disk.set(key, JSON.stringify(legacy));
  const restored = await getReceivedNotifications('user-1');
  expect(restored).toEqual(legacy);
  expect(restored.filter(isNotificationUnread)).toEqual([]);
  await saveReceivedNotification(message);
  expect((await getReceivedNotifications('user-1')).filter(isNotificationUnread)).toHaveLength(1);
});

it('persists read timestamps and does not reset them on duplicate receipts', async () => {
  await saveReceivedNotification(message);
  await markNotificationsRead('user-1', ['message-1']);
  const read = await getReceivedNotifications('user-1');
  expect(read[0].readAt).toEqual(expect.any(Number));
  await saveReceivedNotification(message);
  expect(await getReceivedNotifications('user-1')).toEqual(read);
});

it('marks only selected receipts and never clears new arrivals during bulk marking', async () => {
  await saveReceivedNotification(message);
  await Promise.all([
    saveReceivedNotification({ ...message, messageId: 'new-arrival' }),
    markNotificationsRead('user-1', ['message-1']),
  ]);
  expect((await getReceivedNotifications('user-1')).filter(isNotificationUnread).map(item => item.id))
    .toEqual(['new-arrival']);
});

it('does not acknowledge failed read writes; later reads and retries recover', async () => {
  await saveReceivedNotification(message);
  const listener = jest.fn();
  const unsubscribe = subscribeToNotificationInbox(listener);
  storage.setItem.mockRejectedValueOnce(new Error('Cannot save read state'));
  await expect(markNotificationsRead('user-1', ['message-1'])).rejects.toThrow('Cannot save read state');
  expect(listener).not.toHaveBeenCalled();
  expect((await getReceivedNotifications('user-1'))[0].readAt).toBe(null);
  await markNotificationsRead('user-1', ['message-1']);
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
});

it('rejects cross-account read writes and keeps original read state after account switches', async () => {
  await saveReceivedNotification(message);
  await setNotificationAccount('user-2');
  await expect(markNotificationsRead('user-1', ['message-1'])).rejects.toThrow('Sign in');
  await saveReceivedNotification(message);
  expect(await getReceivedNotifications('user-2')).toEqual([]);
  await setNotificationAccount('user-1');
  expect((await getReceivedNotifications('user-1'))[0].readAt).toBe(null);
  await markNotificationsRead('user-1', ['message-1']);
  await setNotificationAccount('user-2');
  await setNotificationAccount('user-1');
  expect(isNotificationUnread((await getReceivedNotifications('user-1'))[0])).toBe(false);
});

it('saves only allowlisted destination IDs and preserves targets through read updates', async () => {
  const target = { kind: 'expense', groupId: '1234567890abcdef12345678', expenseId: 'abcdef1234567890abcdef12' };
  await saveReceivedNotification({
    ...message, data: { groupId: target.groupId, expenseId: target.expenseId, url: 'https://example.invalid' },
  });
  await markNotificationsRead('user-1', ['message-1']);
  expect((await getReceivedNotifications('user-1'))[0].target).toEqual(target);
});

it.each([
  { readAt: 'bad' }, { readAt: -1 }, { target: { kind: 'url', url: '/admin' } },
])('rejects malformed optional receipt metadata: %j', async metadata => {
  disk.set('notification-inbox:v1:https://example.invalid/api:user-1', JSON.stringify([{
    id: 'broken', title: 'Bad', body: '', receivedAt: 123, ...metadata,
  }]));
  await expect(getReceivedNotifications('user-1')).rejects.toThrow('history is invalid');
});
