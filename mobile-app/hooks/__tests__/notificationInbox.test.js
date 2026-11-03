import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { AppState, SectionList, Text } from 'react-native';
import { router } from 'expo-router';
import NotificationsScreen from '../../app/notifications';
import ErrorMessage from '@/components/ErrorMessage';
import { clearReceivedNotifications, getReceivedNotifications, markNotificationsRead, subscribeToNotificationInbox } from '@/services/notificationInbox';

let mockUser = { id: 'user-1' };
let mockDark = false;
const mockToastError = jest.fn();
const mockShowAlert = jest.fn();
jest.mock('@/components/Toast', () => ({ useToast: () => ({ error: mockToastError }) }));
jest.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('@/contexts/AppAlertContext', () => ({ useAppAlert: () => mockShowAlert }));
jest.mock('@/hooks/useTheme', () => ({
  useThemedStyles: createStyles => {
    const { COLORS, DARK_COLORS } = require('@/constants/theme');
    const colors = mockDark ? DARK_COLORS : COLORS;
    return { colors, styles: createStyles(colors) };
  },
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useFocusEffect: callback => {
    const React = require('react');
    React.useEffect(callback, [callback]);
  },
}));
jest.mock('@/services/notificationInbox', () => ({
  getReceivedNotifications: jest.fn(),
  subscribeToNotificationInbox: jest.fn(),
  markNotificationsRead: jest.fn(),
  clearReceivedNotifications: jest.fn(),
}));

describe('received notification screen', () => {
  let renderer;
  const unsubscribe = jest.fn();
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    mockDark = false;
    mockUser = { id: 'user-1' };
    markNotificationsRead.mockResolvedValue(undefined);
    clearReceivedNotifications.mockResolvedValue(undefined);
    getReceivedNotifications.mockResolvedValue([]);
    subscribeToNotificationInbox.mockReturnValue(unsubscribe);
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    renderer = null;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('starts with seven and loads five more while bulk read includes hidden notifications', async () => {
    const items = Array.from({ length: 13 }, (_, index) => ({
      id: `item-${index}`, title: `Title ${index}`, body: '', readAt: null, receivedAt: Date.now() - index,
    }));
    getReceivedNotifications.mockResolvedValue(items);
    await act(async () => { renderer = create(<NotificationsScreen />); });
    const count = () => renderer.root.findByType(SectionList).props.sections
      .reduce((total, section) => total + section.data.length, 0);
    expect(count()).toBe(7);
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Load more notifications' }).props.onPress());
    expect(count()).toBe(12);
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Mark all notifications as read' }).props.onPress());
    expect(markNotificationsRead).toHaveBeenCalledWith('user-1', items.map(item => item.id));
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Load more notifications' }).props.onPress());
    expect(count()).toBe(13);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Load more notifications' })).toHaveLength(0);
  });

  it('confirms clearing the entire history, not only the visible page', async () => {
    const items = Array.from({ length: 21 }, (_, index) => ({
      id: `item-${index}`, title: `Title ${index}`, body: '', readAt: null, receivedAt: Date.now() - index,
    }));
    getReceivedNotifications.mockResolvedValue(items);
    await act(async () => { renderer = create(<NotificationsScreen />); });
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Clear all notifications' }).props.onPress());
    expect(clearReceivedNotifications).not.toHaveBeenCalled();
    expect(mockShowAlert.mock.calls[0][2][0].style).toBe('cancel');
    getReceivedNotifications.mockResolvedValue([]);
    await act(async () => mockShowAlert.mock.calls[0][2][1].onPress());
    expect(clearReceivedNotifications).toHaveBeenCalledWith('user-1', items.map(item => item.id));
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Clear all notifications' })).toHaveLength(0);
  });

  it('reports clear failures and keeps the action retryable', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getReceivedNotifications.mockResolvedValue([{ id: 'one', title: 'One', body: '', receivedAt: Date.now() }]);
    clearReceivedNotifications.mockRejectedValueOnce(new Error('Clear failed'));
    await act(async () => { renderer = create(<NotificationsScreen />); });
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Clear all notifications' }).props.onPress());
    await act(async () => mockShowAlert.mock.calls[0][2][1].onPress());
    expect(mockToastError).toHaveBeenCalledWith('Clear failed');
    expect(renderer.root.findByProps({ accessibilityLabel: 'Clear all notifications' }).props.disabled).toBe(false);
  });

  it('shows an empty state and keeps settings accessible', async () => {
    await act(async () => { renderer = create(<NotificationsScreen />); });
    expect(getReceivedNotifications).toHaveBeenCalledWith('user-1');
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === 'No notifications yet')).toBe(true);
    renderer.root.findByProps({ accessibilityLabel: 'Notification settings' }).props.onPress();
    expect(router.push).toHaveBeenCalledWith('/profile/notifications');
  });

  it('shows full received content and updates while the inbox is open', async () => {
    await act(async () => { renderer = create(<NotificationsScreen />); });
    getReceivedNotifications.mockResolvedValue([{
      id: 'new', title: 'New notification', body: 'The full notification body', receivedAt: 1700000000000,
    }]);
    await act(async () => subscribeToNotificationInbox.mock.calls[0][0]());
    const text = renderer.root.findAllByType(Text).map(node => node.props.children);
    expect(text).toContain('New notification');
    expect(text).toContain('The full notification body');
    await act(async () => renderer.unmount());
    renderer = null;
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('shows storage errors with a working retry rather than an empty success state', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    getReceivedNotifications.mockRejectedValueOnce(new Error('Cannot read history'));
    await act(async () => { renderer = create(<NotificationsScreen />); });
    expect(renderer.root.findByType(ErrorMessage).props.message).toBe('Cannot read history');
    await act(async () => renderer.root.findByType(ErrorMessage).props.onRetry());
    expect(renderer.root.findAllByType(ErrorMessage)).toHaveLength(0);
    expect(getReceivedNotifications).toHaveBeenCalledTimes(2);
    log.mockRestore();
  });

  it.each([false, true])('uses theme colors and keeps long notification content readable (dark: %s)', async dark => {
    mockDark = dark;
    const { COLORS, DARK_COLORS } = require('@/constants/theme');
    const colors = dark ? DARK_COLORS : COLORS;
    const title = 'A longer notification title that should wrap instead of being truncated';
    const body = 'Full notification details. '.repeat(30);
    getReceivedNotifications.mockResolvedValue([{ id: 'long', title, body, receivedAt: 1700000000000 }]);
    await act(async () => { renderer = create(<NotificationsScreen />); });
    const text = renderer.root.findAllByType(Text);
    const titleNode = text.find(node => node.props.children === title);
    const bodyNode = text.find(node => node.props.children === body);
    expect(titleNode.props.style.color).toBe(colors.text);
    expect(bodyNode.props.style.color).toBe(colors.textSecondary);
    expect(titleNode.props.numberOfLines).toBeUndefined();
    expect(bodyNode.props.numberOfLines).toBeUndefined();
    expect(text.some(node => node.props.children === 'Recent activity')).toBe(true);
  });

  it('does not auto-read on entry, marks an informational item on tap, and preserves full text', async () => {
    const item = { id: 'info', title: 'Information', body: 'Full content', receivedAt: Date.now(), readAt: null };
    getReceivedNotifications.mockResolvedValue([item]);
    await act(async () => { renderer = create(<NotificationsScreen />); });
    expect(markNotificationsRead).not.toHaveBeenCalled();
    const row = renderer.root.findByProps({ accessibilityLabel: 'Unread. Information. Full content' });
    expect(row.props.accessibilityHint).toBe('Mark as read');
    getReceivedNotifications.mockResolvedValue([{ ...item, readAt: Date.now() }]);
    await act(async () => row.props.onPress());
    expect(markNotificationsRead).toHaveBeenCalledWith('user-1', ['info']);
    expect(router.push).not.toHaveBeenCalled();
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === 'Unread')).toBe(false);
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === 'Full content')).toBe(true);
  });

  it('bulk marks only currently unread IDs, leaving already-read and legacy items untouched', async () => {
    getReceivedNotifications.mockResolvedValue([
      { id: 'new', title: 'New', body: '', readAt: null, receivedAt: Date.now() },
      { id: 'read', title: 'Read', body: '', readAt: 123, receivedAt: Date.now() },
      { id: 'legacy', title: 'Legacy', body: '', receivedAt: Date.now() },
    ]);
    await act(async () => { renderer = create(<NotificationsScreen />); });
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Mark all notifications as read' }).props.onPress());
    expect(markNotificationsRead).toHaveBeenCalledWith('user-1', ['new']);
  });

  it('keeps bulk marking retryable after a failed save', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const item = { id: 'bulk', title: 'Unread item', body: '', readAt: null, receivedAt: Date.now() };
    getReceivedNotifications.mockResolvedValue([item]);
    markNotificationsRead.mockRejectedValueOnce(new Error('Bulk write failed'));
    await act(async () => { renderer = create(<NotificationsScreen />); });
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Mark all notifications as read' }).props.onPress());
    expect(mockToastError).toHaveBeenCalledWith('Bulk write failed');
    expect(renderer.root.findByProps({ accessibilityLabel: 'Mark all notifications as read' }).props.disabled).toBe(false);
    getReceivedNotifications.mockResolvedValue([{ ...item, readAt: Date.now() }]);
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Mark all notifications as read' }).props.onPress());
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Mark all notifications as read' })).toHaveLength(0);
    expect(markNotificationsRead).toHaveBeenCalledTimes(2);
  });

  it.each([
    [{ kind: 'group', groupId: '1234567890abcdef12345678' },
      { pathname: '/group/[id]', params: { id: '1234567890abcdef12345678' } }],
    [{ kind: 'expense', groupId: '1234567890abcdef12345678', expenseId: 'abcdef1234567890abcdef12' },
      { pathname: '/group/[id]/expense/[expenseId]', params: { id: '1234567890abcdef12345678', expenseId: 'abcdef1234567890abcdef12' } }],
  ])('opens the related %j using its existing detail route', async (target, route) => {
    getReceivedNotifications.mockResolvedValue([{ id: 'link', title: 'Linked', body: 'Details', receivedAt: Date.now(), readAt: null, target }]);
    await act(async () => { renderer = create(<NotificationsScreen />); });
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Unread. Linked. Details' }).props.onPress());
    expect(markNotificationsRead).toHaveBeenCalledWith('user-1', ['link']);
    expect(router.push).toHaveBeenCalledWith(route);
  });

  it('reports read failures without pretending success or navigating', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    getReceivedNotifications.mockResolvedValue([{
      id: 'failed', title: 'Failed write', body: '', receivedAt: Date.now(), readAt: null,
      target: { kind: 'group', groupId: '1234567890abcdef12345678' },
    }]);
    markNotificationsRead.mockRejectedValue(new Error('Cannot save read state'));
    await act(async () => { renderer = create(<NotificationsScreen />); });
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Unread. Failed write. ' }).props.onPress());
    expect(mockToastError).toHaveBeenCalledWith('Cannot save read state');
    expect(renderer.root.findByProps({ accessibilityLabel: 'Unread. Failed write. ' })).toBeDefined();
    expect(router.push).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
  });

  it('prevents duplicate writes and navigation from rapid double taps', async () => {
    let finish;
    markNotificationsRead.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    getReceivedNotifications.mockResolvedValue([{
      id: 'link', title: 'Linked', body: '', receivedAt: Date.now(), readAt: null,
      target: { kind: 'group', groupId: '1234567890abcdef12345678' },
    }]);
    await act(async () => { renderer = create(<NotificationsScreen />); });
    const row = renderer.root.findByProps({ accessibilityLabel: 'Unread. Linked. ' });
    await act(async () => { row.props.onPress(); row.props.onPress(); });
    expect(markNotificationsRead).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it('hides the previous account history immediately and ignores its late read results', async () => {
    let finish;
    getReceivedNotifications.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    await act(async () => { renderer = create(<NotificationsScreen />); });
    mockUser = { id: 'user-2' };
    getReceivedNotifications.mockResolvedValue([]);
    await act(async () => renderer.update(<NotificationsScreen />));
    await act(async () => finish([{ id: 'private', title: 'Private account A', body: '', receivedAt: Date.now() }]));
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === 'Private account A')).toBe(false);
    expect(getReceivedNotifications).toHaveBeenLastCalledWith('user-2');
  });

  it('does not navigate if the account changes during a read write', async () => {
    let finish;
    markNotificationsRead.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    getReceivedNotifications.mockResolvedValue([{
      id: 'link', title: 'Linked', body: '', receivedAt: Date.now(), readAt: null,
      target: { kind: 'group', groupId: '1234567890abcdef12345678' },
    }]);
    await act(async () => { renderer = create(<NotificationsScreen />); });
    let pending;
    await act(async () => { pending = renderer.root.findByProps({ accessibilityLabel: 'Unread. Linked. ' }).props.onPress(); });
    mockUser = { id: 'user-2' };
    getReceivedNotifications.mockResolvedValue([]);
    await act(async () => renderer.update(<NotificationsScreen />));
    await act(async () => { finish(); await pending; });
    expect(router.push).not.toHaveBeenCalled();
  });

  it('groups local dates and moves groups at midnight while open', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 2, 23, 59, 59));
    getReceivedNotifications.mockResolvedValue([{
      id: 'today', title: 'Day boundary', body: '', receivedAt: new Date(2026, 10, 2, 12).getTime(),
    }]);
    await act(async () => { renderer = create(<NotificationsScreen />); });
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === 'Today')).toBe(true);
    await act(async () => jest.advanceTimersByTime(1000));
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === 'Today')).toBe(false);
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === 'Yesterday')).toBe(true);
  });

  it('reloads receipts on app resume without retaining stale request results', async () => {
    const callbacks = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
      callbacks.push(callback);
      return { remove: jest.fn() };
    });
    await act(async () => { renderer = create(<NotificationsScreen />); });
    let finishOlder;
    getReceivedNotifications.mockImplementationOnce(() => new Promise(resolve => { finishOlder = resolve; }));
    await act(async () => subscribeToNotificationInbox.mock.calls[0][0]());
    getReceivedNotifications.mockResolvedValue([{ id: 'latest', title: 'Latest', body: '', receivedAt: Date.now() }]);
    await act(async () => callbacks.forEach(callback => callback('active')));
    await act(async () => finishOlder([]));
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === 'Latest')).toBe(true);
  });
});
