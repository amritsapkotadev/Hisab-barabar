import React from 'react';
import { act, create } from 'react-test-renderer';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { StyleSheet, Text } from 'react-native';
import OfflineStatus, { OfflineSyncScreen } from '@/components/OfflineStatus';
import { apiService } from '@/services/api';
import { replayQueuedExpenses, dismissQueuedExpense, retryQueuedExpense } from '@/services/dataClient';

let mockStatus = 'authenticated';
let mockState;
const mockToast = { error: jest.fn(), info: jest.fn() };
const mockShowAlert = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ status: mockStatus }) }));
jest.mock('@/contexts/AppAlertContext', () => ({ useAppAlert: () => mockShowAlert }));
jest.mock('@/hooks/useTheme', () => ({
  useThemedStyles: createStyles => ({ colors: {}, styles: createStyles({}) }),
}));
jest.mock('@/components/Toast', () => ({ useToast: () => mockToast }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/services/api', () => ({ apiService: { prepareOfflineSync: jest.fn(async () => {}) } }));
jest.mock('@/services/dataClient', () => ({
  getDataState: () => mockState,
  subscribeData: () => () => {},
  setDataOnline: jest.fn(),
  resumeDataReads: jest.fn(),
  replayQueuedExpenses: jest.fn(async () => {}),
  dismissQueuedExpense: jest.fn(async () => {}),
  retryQueuedExpense: jest.fn(async () => {}),
}));

describe('offline setup and sync UI', () => {
  let renderer;
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    mockStatus = 'authenticated';
    mockState = { online: true, ready: true, syncing: false, queue: [], error: null, lastExpenseSyncAt: null };
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    renderer = null;
    jest.restoreAllMocks();
  });

  it('prepares offline support online even when there is nothing to replay', async () => {
    await act(async () => { renderer = create(<OfflineStatus />); });
    expect(apiService.prepareOfflineSync).toHaveBeenCalledTimes(1);
    expect(replayQueuedExpenses).toHaveBeenCalledTimes(1);
  });

  it.each(['loading', 'unauthenticated'])('does not prepare before authentication (%s)', async status => {
    mockStatus = status;
    await act(async () => { renderer = create(<OfflineStatus />); });
    expect(apiService.prepareOfflineSync).not.toHaveBeenCalled();
  });

  it('does not prepare offline and disables manual sync', async () => {
    mockState = { ...mockState, online: false };
    await act(async () => { renderer = create(<><OfflineStatus /><OfflineSyncScreen /></>); });
    expect(apiService.prepareOfflineSync).not.toHaveBeenCalled();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Sync pending expenses' }).props.disabled).toBe(true);
  });

  it('shows syncing and prevents another manual sync while replay is active', async () => {
    mockState = { ...mockState, syncing: true };
    await act(async () => { renderer = create(<OfflineSyncScreen />); });
    const button = renderer.root.findByProps({ accessibilityLabel: 'Sync pending expenses' });
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  it('prepares support before manual replay', async () => {
    await act(async () => { renderer = create(<OfflineSyncScreen />); });
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Sync pending expenses' }).props.onPress());
    expect(apiService.prepareOfflineSync).toHaveBeenCalledTimes(1);
    expect(replayQueuedExpenses).toHaveBeenCalledTimes(1);
    expect(apiService.prepareOfflineSync.mock.invocationCallOrder[0])
      .toBeLessThan(replayQueuedExpenses.mock.invocationCallOrder[0]);
  });

  it('protects unresolved attempted changes and confirms discarding unsent changes', async () => {
    mockState = { ...mockState, queue: [
      { id: 'unsent', method: 'post', status: 'pending', body: '{"description":"Test","amount":10}', createdAt: 1, attemptedAt: null },
      { id: 'attempted', method: 'delete', status: 'failed', body: null, createdAt: 2, attemptedAt: 2 },
    ] };
    await act(async () => { renderer = create(<OfflineSyncScreen />); });
    const buttons = renderer.root.findAllByProps({ accessibilityRole: 'button' });
    const protectedButton = buttons.find(button => button.props.disabled && button.props.onPress);
    expect(protectedButton).toBeDefined();
    const discard = buttons.find(button => button.props.children?.props?.children === 'Discard unsent change');
    await act(async () => discard.props.onPress());
    expect(dismissQueuedExpense).not.toHaveBeenCalled();
    await act(async () => mockShowAlert.mock.calls[0][2][1].onPress());
    expect(dismissQueuedExpense).toHaveBeenCalledWith('unsent');
  });

  it('retries a failed entry only after confirmation', async () => {
    mockState = { ...mockState, queue: [
      { id: 'original-key', method: 'post', status: 'failed', body: '{"description":"Saved"}',
        createdAt: 1, attemptedAt: 2, message: 'Sync rejected (409). Outcome uncertain.' },
    ] };
    await act(async () => { renderer = create(<OfflineSyncScreen />); });
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Retry saved expense' }).props.onPress());
    expect(retryQueuedExpense).not.toHaveBeenCalled();
    await act(async () => mockShowAlert.mock.calls[0][2][1].onPress());
    expect(retryQueuedExpense).toHaveBeenCalledWith('original-key');
    expect(dismissQueuedExpense).not.toHaveBeenCalled();
  });

  it.each([
    [false, false, [], null, 'Offline mode', 'Saved data'],
    [true, true, [], null, 'Syncing', '0 pending'],
    [true, false, [{ status: 'failed' }], 'Conflict', 'Sync needs review', '1 to review'],
  ])('renders a compact status for online=%s syncing=%s', async (online, syncing, queue, error, label, detail) => {
    mockState = { ...mockState, online, syncing, queue, error };
    await act(async () => { renderer = create(<OfflineStatus />); });
    const chip = renderer.root.findByProps({ accessibilityLabel: 'Review offline status and pending expenses' });
    const texts = chip.findAllByType(Text).map(text => text.props.children);
    expect(texts).toEqual([label, detail]);
    const style = StyleSheet.flatten(chip.props.style);
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
    expect(style.paddingVertical).toBeLessThanOrEqual(8);
  });

  it('shows the last sync date and time without adding a bottom gap', async () => {
    const timestamp = new Date('2026-11-02T09:00:00Z').getTime();
    mockState = { ...mockState, online: false, lastExpenseSyncAt: timestamp };
    await act(async () => { renderer = create(<OfflineStatus />); });
    const chip = renderer.root.findByProps({ accessibilityLabel: 'Review offline status and pending expenses' });
    const text = chip.findAllByType(Text).find(node => Array.isArray(node.props.children));
    expect(text.props.children.join('')).toBe(`Last synced ${new Date(timestamp).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })}`);
    expect(StyleSheet.flatten(chip.parent.props.style).paddingBottom).toBe(0);
    expect(StyleSheet.flatten(chip.props.style).paddingVertical).toBe(6);
  });
});
