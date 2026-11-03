import type { Href } from 'expo-router';
import type { ReceivedNotification } from '@/services/notificationInbox';

export type NotificationTarget =
  | { kind: 'group'; groupId: string }
  | { kind: 'expense'; groupId: string; expenseId: string };

const isServerId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

export function isNotificationTarget(value: unknown): value is NotificationTarget {
  if (typeof value !== 'object' || value === null) return false;
  const kind: unknown = Reflect.get(value, 'kind');
  return isServerId(Reflect.get(value, 'groupId')) &&
    (kind === 'group' || (kind === 'expense' && isServerId(Reflect.get(value, 'expenseId'))));
}

export function notificationTargetFromData(data: Record<string, unknown> | undefined): NotificationTarget | undefined {
  if (!data || (data.groupId === undefined && data.expenseId === undefined)) return;
  if (!isServerId(data.groupId) || (data.expenseId !== undefined && !isServerId(data.expenseId))) {
    console.warn('Notification destination IDs are invalid; keeping notification informational.');
    return;
  }
  return data.expenseId === undefined
    ? { kind: 'group', groupId: data.groupId }
    : { kind: 'expense', groupId: data.groupId, expenseId: data.expenseId };
}

export function notificationDestination(target: NotificationTarget): Href {
  return target.kind === 'expense'
    ? { pathname: '/group/[id]/expense/[expenseId]', params: { id: target.groupId, expenseId: target.expenseId } }
    : { pathname: '/group/[id]', params: { id: target.groupId } };
}

export function isNotificationUnread(item: ReceivedNotification) {
  return item.readAt === null;
}

export function groupNotificationsByDate(items: ReceivedNotification[], now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const sections: { title: string; data: ReceivedNotification[] }[] = [
    { title: 'Today', data: [] }, { title: 'Yesterday', data: [] }, { title: 'Earlier', data: [] },
  ];
  for (const item of [...items].sort((a, b) => b.receivedAt - a.receivedAt)) {
    const section = item.receivedAt >= today.getTime() ? sections[0]
      : item.receivedAt >= yesterday.getTime() ? sections[1] : sections[2];
    section.data.push(item);
  }
  return sections.filter(section => section.data.length > 0);
}
