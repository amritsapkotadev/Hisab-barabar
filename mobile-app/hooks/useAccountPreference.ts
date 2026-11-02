import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { readPreference, writePreference } from '@/services/preferences';

export function useAccountPreference<T>(
  name: 'notifications' | 'paymentMethods',
  defaultValue: T,
  validate: (value: unknown) => value is T
) {
  const { user, status, refreshUser } = useAuth();
  const toast = useToast();
  const [value, setValue] = useState(defaultValue);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const writeInProgress = useRef(false);
  const accountRef = useRef(user?.id);
  accountRef.current = user?.id;

  const load = useCallback(async () => {
    setError(null);
    if (status !== 'authenticated') return;
    const profile = user ?? await refreshUser();
    const saved = await readPreference(profile.id, name, defaultValue, validate);
    return { saved, userId: profile.id };
  }, [status, user, refreshUser, name, defaultValue, validate]);

  const [reload, setReload] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoadedUserId(null);
    load().then(result => {
      if (!cancelled && result) {
        setValue(result.saved);
        setLoadedUserId(result.userId);
      }
    }).catch(error => {
      console.error(`Failed to restore ${name} preferences:`, error);
      if (!cancelled) setError('Could not load saved settings. Please try again.');
    });
    return () => { cancelled = true; };
  }, [load, name, reload]);

  const save = async (next: T): Promise<boolean> => {
    const userId = accountRef.current;
    if (!userId || loadedUserId !== userId || writeInProgress.current) {
      toast.error('Settings are not ready. Please wait and try again.');
      return false;
    }
    writeInProgress.current = true;
    setSaving(true);
    try {
      await writePreference(userId, name, next, validate);
      if (accountRef.current !== userId) return false;
      setValue(next);
      return true;
    } catch (error) {
      console.error(`Failed to save ${name} preferences:`, error);
      toast.error('Could not save settings. Your previous settings have been kept.');
      return false;
    } finally {
      writeInProgress.current = false;
      setSaving(false);
    }
  };

  return {
    value, save, saving, error,
    loading: !user?.id || loadedUserId !== user.id,
    retry: () => setReload(previous => previous + 1),
  };
}
