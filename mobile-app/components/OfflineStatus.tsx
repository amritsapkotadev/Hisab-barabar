import React, { useEffect, useSyncExternalStore } from 'react';
import { AppState, Alert, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useTheme';
import type { ThemeColors } from '@/constants/theme';
import {
  getDataState, subscribeData, setDataOnline, replayQueuedExpenses,
  dismissQueuedExpense, refreshServerData,
} from '@/services/dataClient';
import { useToast } from '@/components/Toast';

export function useDataState() {
  return useSyncExternalStore(subscribeData, getDataState, getDataState);
}

export default function OfflineStatus() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { status } = useAuth();
  const { online, ready, queue, error, lastExpenseSyncAt } = useDataState();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const network = await Network.getNetworkStateAsync();
        if (active) setDataOnline(network.isConnected === true && network.isInternetReachable !== false);
      } catch (error) {
        if (!active) return;
        setDataOnline(false);
        console.error('Unable to determine network availability:', error);
        toast.error('Network detection is unavailable. Rebuild the app with expo-network.');
      }
    };
    void check();
    let listener: ReturnType<typeof Network.addNetworkStateListener> | undefined;
    try {
      listener = Network.addNetworkStateListener(network =>
        setDataOnline(network.isConnected === true && network.isInternetReachable !== false)
      );
    } catch (error) {
      setDataOnline(false);
      console.error('Unable to listen for network changes:', error);
      toast.error('Network detection is unavailable. Rebuild the app with expo-network.');
    }
    const appState = AppState.addEventListener('change', next => {
      if (next === 'active') {
        void check();
        if (status === 'authenticated') refreshServerData();
      }
    });
    return () => {
      active = false;
      listener?.remove();
      appState.remove();
    };
  }, [status, toast]);

  useEffect(() => {
    if (status === 'authenticated' && ready && online) {
      void replayQueuedExpenses().catch(error => {
        console.error('Unable to resume offline sync:', error);
        toast.error('Could not resume offline sync. Open Offline sync to review.');
      });
    }
  }, [status, ready, online, toast]);

  if (status !== 'authenticated') return null;
  const outstanding = queue.filter(item => item.status !== 'synced').length;
  if (online && !outstanding && !error) return null;
  return (
    <Pressable style={[styles.banner, { paddingTop: insets.top + 12 }]} onPress={() => router.push('/profile/offline-sync')}
      accessibilityRole="button" accessibilityLabel="Review offline status and pending expenses">
      <Text style={{ color: COLORS.text }}>
        {!online ? 'Offline · showing saved data' : 'Offline sync'}
        {!online && lastExpenseSyncAt
          ? ` · expense data saved ${new Date(lastExpenseSyncAt).toLocaleString()}`
          : ''}
        {outstanding ? ` · ${outstanding} expense(s) need sync or review` : ''}
        {error ? ' · sync/storage error' : ''}
      </Text>
    </Pressable>
  );
}

export function OfflineSyncScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { queue, online, error } = useDataState();
  const toast = useToast();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={{ color: COLORS.primary }}>Back</Text></Pressable>
      <Text style={styles.title}>Offline sync</Text>
      <Text style={styles.text}>Pending expense changes are not reflected in confirmed data or group balances until the server confirms them. Failed or interrupted requests require review before retrying.</Text>
      {error && <Text style={styles.text}>{error}</Text>}
      <Pressable onPress={() => {
        if (!online) { toast.info('Connect to sync saved expenses.'); return; }
        void replayQueuedExpenses().catch(error => {
          console.error('Offline sync failed:', error);
          toast.error('Sync failed. Please try again.');
        });
      }} accessibilityRole="button"><Text style={{ color: COLORS.primary }}>Sync pending expenses</Text></Pressable>
      {queue.length === 0 && <Text style={styles.text}>No saved offline expenses.</Text>}
      {queue.map(item => {
        const expense: { description?: unknown; amount?: unknown } = item.body ? JSON.parse(item.body) : {};
        const canRemove = item.attemptedAt === null || item.status === 'synced';
        return (
        <View key={item.id} style={styles.item}>
          <Text style={styles.text}>{item.method.toUpperCase()} {item.path} · {item.status}</Text>
          <Text style={styles.text}>{typeof expense.description === 'string'
            ? expense.description
            : item.method === 'delete' ? 'Delete expense' : 'Saved expense change'}</Text>
          {typeof expense.amount === 'number' && <Text style={styles.text}>NPR {expense.amount.toLocaleString('en-IN')}</Text>}
          <Text style={styles.text}>{new Date(item.createdAt).toLocaleString()} · {item.id}</Text>
          {item.message && <Text style={styles.text}>{item.message}</Text>}
          <Pressable accessibilityRole="button" disabled={!canRemove} accessibilityState={{ disabled: !canRemove }} onPress={() => Alert.alert(
            'Remove local sync entry?',
            item.status === 'synced' ? 'This only removes the local receipt, not the server expense.' :
              'This operation has not been sent to the server. Removing it will discard the local change.',
            [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => {
              void dismissQueuedExpense(item.id).catch(error => {
                console.error('Unable to remove offline entry:', error);
                toast.error(error instanceof Error ? error.message : 'Could not remove sync entry.');
              });
            } }]
          )}><Text style={{ color: canRemove ? COLORS.negative : COLORS.textTertiary }}>
            {canRemove ? 'Remove local entry' : 'Cannot remove until outcome is resolved'}
          </Text></Pressable>
        </View>
        );
      })}
    </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  banner: { padding: 12, backgroundColor: COLORS.surfaceSecondary, borderBottomWidth: 1, borderColor: COLORS.border },
  screen: { backgroundColor: COLORS.background, padding: 24, gap: 16 },
  title: { fontSize: 22, fontFamily: 'Inter-Bold', color: COLORS.text },
  text: { color: COLORS.text, fontFamily: 'Inter-Regular' },
  item: { padding: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, gap: 8 },
});
