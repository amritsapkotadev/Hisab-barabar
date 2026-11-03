import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, ActivityIndicator, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useTheme';
import type { ThemeColors } from '@/constants/theme';
import {
  getDataState, subscribeData, setDataOnline, replayQueuedExpenses,
  dismissQueuedExpense, resumeDataReads, retryQueuedExpense,
} from '@/services/dataClient';
import { useToast } from '@/components/Toast';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { apiService } from '@/services/api';
import { ArrowLeft, ChevronRight, CloudOff, Cloud, RefreshCw, AlertCircle, Clock, CheckCircle2 } from 'lucide-react-native';

export function useDataState() {
  return useSyncExternalStore(subscribeData, getDataState, getDataState);
}

export default function OfflineStatus() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { status } = useAuth();
  const { online, ready, queue, error, syncing, lastExpenseSyncAt } = useDataState();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    let previousAppState = AppState.currentState;
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
      if (next === 'active' && previousAppState !== 'active') {
        void check();
        if (status === 'authenticated') resumeDataReads();
      }
      previousAppState = next;
    });
    return () => {
      active = false;
      listener?.remove();
      appState.remove();
    };
  }, [status, toast]);

  useEffect(() => {
    if (status === 'authenticated' && ready && online) {
      void apiService.prepareOfflineSync().catch(error => {
        console.error('Unable to prepare offline expenses:', error);
        toast.error('Offline setup could not finish. Connect to the server and reopen the app before going offline.');
      });
      void replayQueuedExpenses().catch(error => {
        console.error('Unable to resume offline sync:', error);
        toast.error('Could not resume offline sync. Open Offline sync to review.');
      });
    }
  }, [status, ready, online, toast]);

  if (status !== 'authenticated') return null;
  const pending = queue.filter(item => item.status === 'pending').length;
  const failed = queue.filter(item => item.status === 'failed').length;
  const outstanding = pending + failed;
  if (online && !outstanding && !error && !syncing) return null;
  const needsAttention = failed > 0 || Boolean(error);
  const label = syncing ? 'Syncing' : needsAttention ? 'Sync needs review' : online ? 'Ready to sync' : 'Offline mode';
  const detail = syncing ? `${pending} pending` : needsAttention ? failed ? `${failed} to review` : 'View details' :
    pending ? `${pending} saved` : 'Saved data';
  return (
    <View style={[styles.banner, { paddingTop: insets.top + 4 }]}>
    <Pressable style={styles.statusChip} onPress={() => router.push('/profile/offline-sync')}
      accessibilityRole="button" accessibilityLabel="Review offline status and pending expenses">
      {syncing ? <ActivityIndicator size="small" color={COLORS.textSecondary} /> :
        needsAttention ? <AlertCircle size={16} color={COLORS.negative} /> :
          <CloudOff size={16} color={COLORS.textSecondary} />}
      <View style={styles.flex}>
        <Text style={styles.bannerTitle}>{label}</Text>
        {lastExpenseSyncAt !== null && <Text style={styles.lastSynced}>
          Last synced {new Date(lastExpenseSyncAt).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </Text>}
      </View>
      <Text style={styles.chipDetail}>{detail}</Text>
      <ChevronRight size={14} color={COLORS.textTertiary} />
    </Pressable>
    </View>
  );
}

export function OfflineSyncScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { queue, online, error, syncing, lastExpenseSyncAt } = useDataState();
  const toast = useToast();
  const showAlert = useAppAlert();
  const [preparing, setPreparing] = useState(false);
  const pending = queue.filter(item => item.status === 'pending').length;
  const failed = queue.filter(item => item.status === 'failed').length;
  const synced = queue.filter(item => item.status === 'synced').length;
  const busy = syncing || preparing;
  const sync = async () => {
    setPreparing(true);
    try {
      await apiService.prepareOfflineSync();
      await replayQueuedExpenses();
    } catch (failure) {
      console.error('Offline sync failed:', failure);
      toast.error(failure instanceof Error ? failure.message : 'Sync failed. Please try again.');
    } finally {
      setPreparing(false);
    }
  };
  const retry = async (id: string) => {
    setPreparing(true);
    try {
      await retryQueuedExpense(id);
    } catch (failure) {
      console.error('Unable to retry saved expense:', failure);
      toast.error(failure instanceof Error ? failure.message : 'Could not retry this expense.');
    } finally {
      setPreparing(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}>
        <ArrowLeft size={22} color={COLORS.text} /><Text style={styles.text}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Offline sync</Text>
      <Text style={styles.subtitle}>Your changes, safely saved on this device.</Text>
      <View style={styles.item}>
        <View style={styles.bannerRow}>
          {online ? <Cloud size={26} color={COLORS.positive} /> : <CloudOff size={26} color={COLORS.textSecondary} />}
          <View style={styles.flex}>
            <Text style={styles.heading}>{online ? 'Connected' : 'Offline mode'}</Text>
            <Text style={styles.caption}>{online ? 'Pending changes sync automatically.' : 'Keep adding expenses. Prepared changes sync when you reconnect.'}</Text>
          </View>
        </View>
        {lastExpenseSyncAt && <Text style={styles.caption}>Expense data saved {new Date(lastExpenseSyncAt).toLocaleString()}</Text>}
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statValue}>{pending}</Text><Text style={styles.caption}>Pending</Text></View>
          <View style={styles.stat}><Text style={[styles.statValue, { color: failed ? COLORS.negative : COLORS.text }]}>{failed}</Text><Text style={styles.caption}>Needs review</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{synced}</Text><Text style={styles.caption}>Synced</Text></View>
        </View>
        <Pressable onPress={() => { void sync(); }} disabled={!online || busy}
          accessibilityRole="button" accessibilityLabel="Sync pending expenses"
          accessibilityState={{ disabled: !online || busy, busy }}
          style={[styles.syncButton, (!online || busy) && styles.disabled]}>
          {busy ? <ActivityIndicator color={COLORS.actionText} /> : <RefreshCw size={18} color={COLORS.actionText} />}
          <Text style={styles.syncButtonText}>{busy ? 'Syncing...' : online ? 'Sync now' : 'Connect to sync'}</Text>
        </Pressable>
      </View>
      {error && <View style={styles.errorCard} accessibilityRole="alert">
        <AlertCircle size={20} color={COLORS.negative} /><Text style={[styles.caption, styles.flex]}>{error}</Text>
      </View>}
      <View style={styles.note}>
        <Text style={styles.heading}>How offline mode works</Text>
        <Text style={styles.caption}>Open the app online once before going offline to prepare safe expense sync. Saved pages remain available; pages you have not loaded need internet.</Text>
        <Text style={styles.caption}>Pending changes do not affect confirmed totals or group balances. Groups, budgets and settlements require internet.</Text>
      </View>
      <Text style={styles.heading}>Saved activity</Text>
      {queue.length === 0 && <View style={styles.empty}>
        <CheckCircle2 size={36} color={COLORS.positive} />
        <Text style={styles.heading}>Nothing waiting to sync</Text>
        <Text style={styles.caption}>Expenses saved offline will appear here. Do not clear app storage while changes are pending.</Text>
      </View>}
      {[...queue].reverse().map(item => {
        const expense: { description?: unknown; amount?: unknown } = item.body ? JSON.parse(item.body) : {};
        const canRemove = item.attemptedAt === null || item.status === 'synced';
        return (
        <View key={item.id} style={styles.item}>
          <View style={styles.bannerRow}>
            {item.status === 'synced' ? <CheckCircle2 size={18} color={COLORS.positive} /> :
              item.status === 'failed' ? <AlertCircle size={18} color={COLORS.negative} /> :
                <Clock size={18} color={COLORS.textSecondary} />}
            <Text style={[styles.badge, { color: item.status === 'failed' ? COLORS.negative :
              item.status === 'synced' ? COLORS.positive : COLORS.textSecondary }]}>
              {item.status === 'synced' ? 'Synced' : item.status === 'failed' ? 'Needs review' : 'Pending'}
            </Text>
            <Text style={styles.caption}>{item.method === 'post' ? 'New expense' : item.method === 'put' ? 'Edit expense' : 'Delete expense'}</Text>
          </View>
          <Text style={styles.heading}>{typeof expense.description === 'string'
            ? expense.description
            : item.method === 'delete' ? 'Delete expense' : 'Saved expense change'}</Text>
          {typeof expense.amount === 'number' && <Text style={styles.text}>NPR {expense.amount.toLocaleString('en-IN')}</Text>}
          <Text style={styles.caption}>{new Date(item.createdAt).toLocaleString()}</Text>
          <Text selectable style={styles.reference}>Reference: {item.id}</Text>
          {item.message && <Text style={styles.text}>{item.message}</Text>}
          {item.status === 'failed' && <Pressable style={styles.retry}
            accessibilityRole="button" accessibilityLabel="Retry saved expense"
            disabled={!online || busy} accessibilityState={{ disabled: !online || busy }}
            onPress={() => showAlert(
              'Retry with the same reference?',
              'The original expense data and reference will be reused. A confirmed result is returned without creating another expense. Uncertain requests may still need server review.',
              [{ text: 'Cancel', style: 'cancel' }, { text: 'Retry safely', onPress: () => { void retry(item.id); } }],
            )}>
            <RefreshCw size={16} color={online && !busy ? COLORS.text : COLORS.textTertiary} />
            <Text style={styles.text}>{online ? 'Retry with same reference' : 'Connect to retry'}</Text>
          </Pressable>}
          <Pressable style={styles.remove} accessibilityRole="button" disabled={!canRemove || busy} accessibilityState={{ disabled: !canRemove || busy }} onPress={() => showAlert(
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
            {canRemove ? item.status === 'synced' ? 'Remove receipt' : 'Discard unsent change' :
              item.status === 'failed' ? 'Check the server expense before resolving this entry.' : 'Waiting for server confirmation. Reconnect to sync safely.'}
          </Text></Pressable>
        </View>
        );
      })}
    </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  banner: { backgroundColor: COLORS.background, paddingHorizontal: 16, paddingBottom: 0 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.surfaceSecondary, borderWidth: 1, borderColor: COLORS.borderLight },
  lastSynced: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter-Regular', color: COLORS.textTertiary },
  chipDetail: { fontSize: 12, fontFamily: 'Inter-Medium', color: COLORS.textSecondary, flexShrink: 1 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: COLORS.text },
  flex: { flex: 1 },
  screen: { backgroundColor: COLORS.background, padding: 24, paddingBottom: 40, gap: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, alignSelf: 'flex-start' },
  title: { fontSize: 30, fontFamily: 'Inter-Bold', color: COLORS.text },
  subtitle: { fontSize: 15, fontFamily: 'Inter-Regular', color: COLORS.textSecondary, marginTop: -8 },
  heading: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: COLORS.text },
  caption: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter-Regular', color: COLORS.textSecondary },
  text: { color: COLORS.text, fontFamily: 'Inter-Regular' },
  item: { padding: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, gap: 12 },
  stats: { flexDirection: 'row', paddingVertical: 16, borderTopWidth: 1, borderColor: COLORS.borderLight, marginTop: 8 },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 26, fontFamily: 'Inter-Bold', color: COLORS.text },
  syncButton: { minHeight: 48, borderRadius: 14, backgroundColor: COLORS.action, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  syncButtonText: { fontFamily: 'Inter-SemiBold', color: COLORS.actionText, fontSize: 15 },
  disabled: { opacity: 0.5 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderWidth: 1, borderColor: COLORS.negative, borderRadius: 16 },
  note: { padding: 16, gap: 8, borderRadius: 16, backgroundColor: COLORS.surfaceSecondary },
  empty: { alignItems: 'center', padding: 24, gap: 12 },
  badge: { fontSize: 13, fontFamily: 'Inter-SemiBold' },
  reference: { color: COLORS.textTertiary, fontSize: 11, fontFamily: 'Inter-Regular' },
  remove: { minHeight: 44, justifyContent: 'center', borderTopWidth: 1, borderColor: COLORS.borderLight, paddingTop: 8 },
  retry: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
