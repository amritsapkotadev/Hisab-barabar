import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import HomeScreen from '../../app/(tabs)/index';
import { apiService } from '@/services/api';
import BudgetGauge from '@/components/BudgetGauge';
import TransactionsScreen from '../../app/(tabs)/transactions';
import GroupExpensesScreen from '../../app/group/[id]/expenses';
import { router } from 'expo-router';
import { getReceivedNotifications, subscribeToNotificationInbox } from '@/services/notificationInbox';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'group-1' }),
  useFocusEffect: callback => {
    const React = require('react');
    React.useEffect(callback, [callback]);
  },
}));
jest.mock('@/services/notificationInbox', () => ({
  getReceivedNotifications: jest.fn(), subscribeToNotificationInbox: jest.fn(),
}));
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'Test', budget: 50 } }),
}));
jest.mock('@/services/api', () => ({
  apiService: {
    getUserProfile: jest.fn(),
    getPersonalExpensePage: jest.fn(),
    getGroups: jest.fn(),
    getExpensePage: jest.fn(),
    getGroup: jest.fn(),
  },
}));
jest.mock('@/services/dataClient', () => ({
  refreshServerData: jest.fn(),
  subscribeData: () => () => {},
  getDataState: () => mockDataState,
}));
const mockDataState = { online: true };
jest.mock('@/hooks/useServerRefresh', () => ({
  useServerRefresh: (refresh, identity) => {
    const React = require('react');
    React.useEffect(() => { void refresh(); }, [identity]);
  },
}));
jest.mock('@/hooks/useTheme', () => ({
  useThemedStyles: () => ({ colors: {}, styles: {} }),
  useTheme: () => ({ isDark: false }),
}));
jest.mock('@/components/Toast', () => ({ useToast: () => ({ error: jest.fn() }) }));
jest.mock('@/components/BudgetGauge', () => jest.fn(() => null));
jest.mock('@/components/AnimatedAmount', () => () => null);
jest.mock('@/components/DeleteConfirmationModal', () => () => null);
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => () => null);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('Home request scope', () => {
  let renderer;
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    getReceivedNotifications.mockResolvedValue([]);
    subscribeToNotificationInbox.mockReturnValue(jest.fn());
    apiService.getPersonalExpensePage.mockResolvedValue({
      data: [], budget: 100, summary: { count: 1, monthlySpent: 25 },
      pageInfo: { page: 1, limit: 7, hasMore: false, nextPage: null },
    });
    apiService.getGroups.mockResolvedValue([]);
    apiService.getExpensePage.mockResolvedValue({
      data: [], summary: { count: 0, totalAmount: 0 }, pageInfo: { page: 1, limit: 20, hasMore: false, nextPage: null },
    });
    apiService.getGroup.mockResolvedValue({ members: [] });
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    renderer = null;
  });

  it('loads personal data first and defers group reads until Shared is selected', async () => {
    await act(async () => { renderer = create(<HomeScreen />); });
    expect(apiService.getPersonalExpensePage).toHaveBeenCalledWith({ limit: 7, page: 1 });
    expect(apiService.getUserProfile).not.toHaveBeenCalled();
    expect(BudgetGauge.mock.calls.at(-1)[0].used).toBe(0.25);
    expect(apiService.getGroups).not.toHaveBeenCalled();
    expect(apiService.getExpensePage).not.toHaveBeenCalled();
    const shared = renderer.root.findAllByType(TouchableOpacity).find(button =>
      button.findAllByType(Text).some(text => text.props.children === 'Shared'));
    expect(shared).toBeDefined();
    await act(async () => shared.props.onPress());
    expect(apiService.getGroups).toHaveBeenCalledTimes(1);
    expect(apiService.getExpensePage).toHaveBeenCalledWith({ limit: 5, page: 1, type: 'group' });
    expect(apiService.getPersonalExpensePage).toHaveBeenCalledTimes(1);
    expect(apiService.getUserProfile).not.toHaveBeenCalled();
  });

  it('uses a zero budget from personal expenses instead of the login budget', async () => {
    apiService.getPersonalExpensePage.mockResolvedValue({
      data: [], budget: 0, summary: { count: 1, monthlySpent: 25 },
      pageInfo: { page: 1, limit: 7, hasMore: false, nextPage: null },
    });

    await act(async () => { renderer = create(<HomeScreen />); });
    expect(BudgetGauge.mock.calls.at(-1)[0].used).toBe(0);
    expect(apiService.getUserProfile).not.toHaveBeenCalled();
  });

  it('opens received notifications from the Home bell', async () => {
    await act(async () => { renderer = create(<HomeScreen />); });
    renderer.root.findByProps({ accessibilityLabel: 'Notifications' }).props.onPress();
    expect(router.push).toHaveBeenCalledWith('/notifications');
  });

  it('updates the unread badge from local receipts without requesting a profile', async () => {
    getReceivedNotifications.mockResolvedValue([
      { id: 'unread', readAt: null }, { id: 'read', readAt: 123 }, { id: 'legacy' },
    ]);
    await act(async () => { renderer = create(<HomeScreen />); });
    expect(renderer.root.findByProps({ accessibilityLabel: 'Notifications, 1 unread' })).toBeDefined();
    getReceivedNotifications.mockResolvedValue([]);
    await act(async () => subscribeToNotificationInbox.mock.calls[0][0]());
    expect(renderer.root.findByProps({ accessibilityLabel: 'Notifications' })).toBeDefined();
    expect(apiService.getUserProfile).not.toHaveBeenCalled();
  });

  it('caps the visible badge but announces the full unread count', async () => {
    getReceivedNotifications.mockResolvedValue(Array.from({ length: 100 }, (_, id) => ({ id: `${id}`, readAt: null })));
    await act(async () => { renderer = create(<HomeScreen />); });
    expect(renderer.root.findByProps({ accessibilityLabel: 'Notifications, 100 unread' })).toBeDefined();
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === '99+')).toBe(true);
  });

  it('shows an unavailable count instead of zero when history cannot be read', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    getReceivedNotifications.mockRejectedValueOnce(new Error('History unavailable'));
    await act(async () => { renderer = create(<HomeScreen />); });
    expect(renderer.root.findByProps({ accessibilityLabel: 'Notifications, unread count unavailable' })).toBeDefined();
    expect(renderer.root.findAllByType(Text).some(text => text.props.children === '?')).toBe(true);
    getReceivedNotifications.mockResolvedValue([]);
    await act(async () => subscribeToNotificationInbox.mock.calls[0][0]());
    expect(renderer.root.findByProps({ accessibilityLabel: 'Notifications' })).toBeDefined();
    log.mockRestore();
  });

  it('requests bounded transactions and applies time filters on the server', async () => {
    await act(async () => { renderer = create(<TransactionsScreen />); });
    expect(apiService.getExpensePage).toHaveBeenLastCalledWith({ limit: 20, page: 1, type: 'group' });
    const week = renderer.root.findAllByType(TouchableOpacity).find(button =>
      button.findAllByType(Text).some(text => text.props.children === 'This Week'));
    await act(async () => week.props.onPress());
    expect(apiService.getExpensePage).toHaveBeenLastCalledWith({
      limit: 20, page: 1, type: 'group', createdAfter: expect.any(String),
    });
    expect(apiService.getUserProfile).not.toHaveBeenCalled();
  });

  it('loads the next group page only when Load more is pressed', async () => {
    apiService.getExpensePage.mockResolvedValueOnce({
      data: [], summary: { count: 25, totalAmount: 1000 },
      pageInfo: { page: 1, limit: 20, hasMore: true, nextPage: 2 },
    });
    await act(async () => { renderer = create(<GroupExpensesScreen />); });
    expect(apiService.getExpensePage).toHaveBeenCalledTimes(1);
    expect(apiService.getExpensePage).toHaveBeenLastCalledWith({ limit: 20, page: 1 }, 'group-1');
    const more = renderer.root.findByProps({ accessibilityLabel: 'Load more group expenses' });
    await act(async () => more.props.onPress());
    expect(apiService.getExpensePage).toHaveBeenLastCalledWith({ limit: 20, page: 2 }, 'group-1');
  });
});
