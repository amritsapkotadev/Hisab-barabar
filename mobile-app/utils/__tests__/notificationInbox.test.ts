import {
  groupNotificationsByDate, notificationDestination, notificationTargetFromData,
} from '../notificationInbox';
import type { ReceivedNotification } from '@/services/notificationInbox';

const groupId = '1234567890abcdef12345678';
const expenseId = 'abcdef1234567890abcdef12';

it('builds only existing typed group and expense routes from server IDs', () => {
  const group = notificationTargetFromData({ groupId });
  const expense = notificationTargetFromData({ groupId, expenseId, url: 'https://untrusted.invalid' });
  expect(group).toEqual({ kind: 'group', groupId });
  expect(expense).toEqual({ kind: 'expense', groupId, expenseId });
  if (!group || !expense) throw new Error('Expected valid targets');
  expect(notificationDestination(group)).toEqual({ pathname: '/group/[id]', params: { id: groupId } });
  expect(notificationDestination(expense)).toEqual({
    pathname: '/group/[id]/expense/[expenseId]', params: { id: groupId, expenseId },
  });
});

it.each([
  undefined, {}, { url: 'https://untrusted.invalid' }, { groupId: '../../admin' },
  { groupId: `${groupId}/edit` }, { groupId: 123 }, { expenseId },
  { groupId, expenseId: [] }, { groupId, expenseId: '' },
])('does not turn unsupported payloads into links: %j', data => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(notificationTargetFromData(data)).toBeUndefined();
  warning.mockRestore();
});

const receipt = (id: string, date: Date): ReceivedNotification => ({
  id, title: id, body: '', receivedAt: date.getTime(), readAt: null,
});

it('groups and sorts by local calendar day without mutating incoming history', () => {
  const now = new Date(2026, 10, 2, 0, 5);
  const items = [
    receipt('earlier', new Date(2026, 9, 31, 23, 59)),
    receipt('today', new Date(2026, 10, 2, 0, 0)),
    receipt('yesterday-late', new Date(2026, 10, 1, 23, 59)),
    receipt('yesterday-early', new Date(2026, 10, 1, 0, 0)),
  ];
  expect(groupNotificationsByDate(items, now).map(section => ({
    title: section.title, ids: section.data.map(item => item.id),
  }))).toEqual([
    { title: 'Today', ids: ['today'] },
    { title: 'Yesterday', ids: ['yesterday-late', 'yesterday-early'] },
    { title: 'Earlier', ids: ['earlier'] },
  ]);
  expect(items[0].id).toBe('earlier');
  expect(groupNotificationsByDate([], now)).toEqual([]);
});

it.each([
  [new Date(2026, 0, 1, 0, 5), new Date(2025, 11, 31, 0, 0)],
  [new Date(2026, 2, 9, 0, 5), new Date(2026, 2, 8, 0, 0)],
  [new Date(2026, 10, 2, 0, 5), new Date(2026, 10, 1, 0, 0)],
])('handles year and daylight-saving boundaries: %s', (now, previousDay) => {
  expect(groupNotificationsByDate([receipt('previous', previousDay)], now)[0].title).toBe('Yesterday');
});
