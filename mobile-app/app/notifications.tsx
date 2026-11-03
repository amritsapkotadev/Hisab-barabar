import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell, ChevronRight, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useTheme';
import type { ThemeColors } from '@/constants/theme';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useToast } from '@/components/Toast';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useNotificationInbox } from '@/hooks/useNotificationInbox';
import { groupNotificationsByDate, isNotificationUnread, notificationDestination } from '@/utils/notificationInbox';
import {
  markNotificationsRead,
  clearReceivedNotifications,
  type ReceivedNotification,
} from '@/services/notificationInbox';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { colors, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const showAlert = useAppAlert();
  const { items, loading, error, unreadCount, refresh } = useNotificationInbox(user?.id);
  const [saving, setSaving] = useState(false);
  const [visibleCount, setVisibleCount] = useState(7);
  const savingRef = useRef(false);
  const [now, setNow] = useState(() => new Date());
  const currentUserId = useRef(user?.id);
  currentUserId.current = user?.id;
  const active = useRef(false);
  const sections = groupNotificationsByDate(items, now);
  let remaining = visibleCount;
  const visibleSections = sections.map(section => {
    const data = section.data.slice(0, remaining);
    remaining = Math.max(0, remaining - data.length);
    return { ...section, data };
  }).filter(section => section.data.length > 0);

  useEffect(() => {
    setVisibleCount(7);
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    active.current = true;
    let timer: ReturnType<typeof setTimeout>;
    const updateDay = () => {
      clearTimeout(timer);
      const date = new Date();
      setNow(date);
      const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      timer = setTimeout(updateDay, midnight.getTime() - date.getTime());
    };
    updateDay();
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') updateDay();
    });
    return () => {
      active.current = false;
      clearTimeout(timer);
      appState.remove();
    };
  }, []));

  const markRead = async (selected: ReceivedNotification[], destination?: ReceivedNotification['target']) => {
    if (!user || savingRef.current) return;
    const userId = user.id;
    savingRef.current = true;
    setSaving(true);
    try {
      await markNotificationsRead(userId, selected.map(item => item.id));
      if (!active.current || currentUserId.current !== userId) return;
      await refresh();
      if (destination && active.current && currentUserId.current === userId) {
        router.push(notificationDestination(destination));
      }
    } catch (failure) {
      console.error('Failed to mark notifications as read:', failure);
      if (active.current && currentUserId.current === userId) {
        toast.error(failure instanceof Error ? failure.message : 'Could not update notifications.');
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const confirmClear = () => {
    if (!user || savingRef.current) return;
    const userId = user.id;
    const ids = items.map(item => item.id);
    showAlert('Clear all notifications?', 'This removes your current notification history on this device. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: () => {
        if (!active.current || currentUserId.current !== userId || savingRef.current) return;
        savingRef.current = true;
        setSaving(true);
        void (async () => {
          try {
            await clearReceivedNotifications(userId, ids);
            if (active.current && currentUserId.current === userId) {
              setVisibleCount(7);
              await refresh();
            }
          } catch (failure) {
            console.error('Failed to clear notifications:', failure);
            if (active.current && currentUserId.current === userId) {
              toast.error(failure instanceof Error ? failure.message : 'Could not clear notifications.');
            }
          } finally {
            savingRef.current = false;
            setSaving(false);
          }
        })();
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.button} activeOpacity={0.65}
          accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.heading} accessibilityRole="header">Notifications</Text>
        <TouchableOpacity onPress={() => router.push('/profile/notifications')} style={styles.button} activeOpacity={0.65}
          accessibilityRole="button" accessibilityLabel="Notification settings">
          <Settings size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      {loading ? <LoadingSpinner message="Loading notifications..." /> : error || !user ? (
        <ErrorMessage message={error ?? 'Sign in to view received notifications.'} onRetry={() => { void refresh(); }} />
      ) : (
        <SectionList
          sections={visibleSections}
          extraData={saving}
          stickySectionHeadersEnabled={false}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={items.length ? (
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Recent activity</Text>
              <TouchableOpacity onPress={confirmClear} disabled={saving} style={styles.markAll}
                accessibilityRole="button" accessibilityLabel="Clear all notifications"
                accessibilityState={{ disabled: saving }}>
                <Text style={styles.actionText}>Clear all</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          ListFooterComponent={items.length > visibleCount ? (
            <TouchableOpacity onPress={() => setVisibleCount(count => count + 5)}
              style={styles.loadMore} disabled={saving} accessibilityRole="button"
              accessibilityLabel="Load more notifications" accessibilityState={{ disabled: saving }}>
              <Text style={styles.actionText}>Load more</Text>
            </TouchableOpacity>
          ) : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Bell size={28} strokeWidth={1.5} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyBody}>You&apos;re all caught up. New updates will appear here when they arrive.</Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.dateHeading} accessibilityRole="header">{section.title}</Text>
              {section.title === sections[0]?.title && !!unreadCount && (
                <TouchableOpacity onPress={() => { void markRead(items.filter(isNotificationUnread)); }}
                  style={styles.markAll} disabled={saving} accessibilityRole="button"
                  accessibilityLabel="Mark all notifications as read" accessibilityState={{ disabled: saving }}>
                  <Text style={styles.actionText}>{saving ? 'Updating...' : 'Mark all as read'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, isNotificationUnread(item) && styles.unreadCard]}
              activeOpacity={0.7} disabled={saving || (!isNotificationUnread(item) && !item.target)}
              onPress={() => { void markRead([item], item.target); }}
              accessibilityRole={item.target || isNotificationUnread(item) ? 'button' : 'text'}
              accessibilityLabel={`${isNotificationUnread(item) ? 'Unread. ' : ''}${item.title}. ${item.body}`}
              accessibilityHint={item.target ? `Open related ${item.target.kind}` : isNotificationUnread(item) ? 'Mark as read' : undefined}
              accessibilityState={{ disabled: saving || (!isNotificationUnread(item) && !item.target) }}>
              <View style={[styles.notificationIcon, isNotificationUnread(item) && styles.unreadIcon]}>
                <Bell size={18} strokeWidth={1.75} color={isNotificationUnread(item) ? colors.primary : colors.textSecondary} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.metaRow}>
                  <Text style={styles.date}>{new Date(item.receivedAt).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}</Text>
                  {isNotificationUnread(item) && (
                    <View style={styles.unreadBadge}>
                      <View style={styles.unreadDot} />
                      <Text style={styles.unreadLabel}>Unread</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.title}>{item.title}</Text>
                {!!item.body && <Text style={styles.body}>{item.body}</Text>}
                {item.target ? (
                  <View style={styles.destination}>
                    <Text style={styles.actionText}>View {item.target.kind}</Text>
                    <ChevronRight size={14} color={colors.textSecondary} />
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  button: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  heading: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text },
  list: { padding: 20, paddingBottom: 32, gap: 12, flexGrow: 1 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 },
  loadMore: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.surfaceSecondary },
  sectionTitle: { fontSize: 22, fontFamily: 'Inter-SemiBold', color: colors.text, letterSpacing: -0.5 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  dateHeading: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: colors.textSecondary },
  markAll: {
    minHeight: 36, alignSelf: 'flex-start', justifyContent: 'center',
    paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.surfaceSecondary,
  },
  actionText: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter-SemiBold', color: colors.text },
  destination: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unreadCard: {
    backgroundColor: colors.surfaceSecondary, borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  unreadBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12, backgroundColor: colors.chip,
  },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  unreadLabel: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter-SemiBold', color: colors.primary },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 1,
  },
  notificationIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  unreadIcon: { backgroundColor: colors.chip },
  cardContent: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter-SemiBold', color: colors.text },
  body: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter-Regular', color: colors.textSecondary },
  date: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter-Medium', color: colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: colors.surfaceSecondary,
    borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, lineHeight: 28, textAlign: 'center', fontFamily: 'Inter-SemiBold', color: colors.text },
  emptyBody: {
    maxWidth: 280, marginTop: 8, fontSize: 14, lineHeight: 22, textAlign: 'center',
    fontFamily: 'Inter-Regular', color: colors.textSecondary,
  },
});
