import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  getReceivedNotifications, subscribeToNotificationInbox, type ReceivedNotification,
} from '@/services/notificationInbox';
import { isNotificationUnread } from '@/utils/notificationInbox';

interface InboxState {
  userId: string;
  items: ReceivedNotification[];
  error: string | null;
}

export function useNotificationInbox(userId: string | undefined) {
  const [state, setState] = useState<InboxState | null>(null);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++request.current;
    if (!userId) return;
    try {
      const items = await getReceivedNotifications(userId);
      if (current === request.current) setState({ userId, items, error: null });
    } catch (failure) {
      console.error('Failed to load received notifications:', failure);
      if (current === request.current) setState({
        userId, items: [],
        error: failure instanceof Error ? failure.message : 'Could not load notifications.',
      });
    }
  }, [userId]);

  useFocusEffect(useCallback(() => {
    void refresh();
    const unsubscribe = subscribeToNotificationInbox(() => { void refresh(); });
    const appState = AppState.addEventListener('change', status => {
      if (status === 'active') void refresh();
    });
    return () => {
      request.current++;
      unsubscribe();
      appState.remove();
    };
  }, [refresh]));

  const current = state?.userId === userId ? state : null;
  const items = current?.items ?? [];
  return {
    items, loading: !!userId && !current, error: current?.error ?? null,
    unreadCount: current?.error ? null : items.filter(isNotificationUnread).length,
    refresh,
  };
}
