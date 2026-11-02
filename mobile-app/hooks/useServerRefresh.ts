import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useSyncExternalStore } from 'react';
import { subscribeData, getDataState } from '@/services/dataClient';

export function useServerRefresh(refresh: () => Promise<unknown>, identity?: string) {
  const focused = useIsFocused();
  const { revision } = useSyncExternalStore(subscribeData, getDataState, getDataState);
  const callback = useRef(refresh);
  callback.current = refresh;
  useEffect(() => {
    if (focused) void callback.current();
  }, [focused, revision, identity]);
}
