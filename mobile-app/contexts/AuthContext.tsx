import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiService, setUnauthorizedHandler } from '@/services/api';
import { migrateLegacyAuthToken } from '@/services/tokenStorage';
import { setNotificationAccount } from '@/services/notificationInbox';
import type { User } from '@/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn: (token: string, user?: User) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function updateNotificationAccount(userId: string | null) {
  try {
    await setNotificationAccount(userId);
  } catch (error) {
    console.error('Notification history account could not be updated:', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void updateNotificationAccount(null);
      setUser(null);
      setStatus('unauthenticated');
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = await migrateLegacyAuthToken();

      if (!token) {
        await updateNotificationAccount(null);
        if (!cancelled) {
          setStatus('unauthenticated');
        }
        return;
      }

      try {
        await apiService.setAuthToken(token);
        const profile = await apiService.getUserProfile();
        if (!cancelled) {
          await updateNotificationAccount(profile.id);
          setUser(profile);
          setStatus('authenticated');
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
        try {
          await updateNotificationAccount(null);
          await apiService.clearAuthToken();
        } finally {
          if (!cancelled) {
            setUser(null);
            setStatus('unauthenticated');
          }
        }
      }
    };

    void restoreSession().catch(error => {
      console.error('Unable to restore stored credentials:', error);
      if (!cancelled) {
        setUser(null);
        setStatus('unauthenticated');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (token: string, nextUser?: User) => {
    await apiService.setAuthToken(token);
    const profile = nextUser ?? await apiService.getUserProfile();
    await updateNotificationAccount(profile.id);
    setUser(profile);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await updateNotificationAccount(null);
    try {
      await apiService.clearAuthToken();
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await apiService.getUserProfile();
    await updateNotificationAccount(profile.id);
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signOut, refreshUser }),
    [status, user, signIn, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
