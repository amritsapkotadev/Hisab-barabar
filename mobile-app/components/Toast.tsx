import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleAlert, CircleCheck, Info } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const BACKGROUNDS: Record<ToastType, string> = {
    success: COLORS.positive,
    error: COLORS.negative,
    info: COLORS.action,
  };
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -120, duration: 180, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [clearTimer, opacity, translateY]);

  const show = useCallback(
    ({ message, type = 'info', duration }: ToastOptions) => {
      clearTimer();
      setToast({ message, type });
      translateY.setValue(-120);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 180,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
      timeoutRef.current = setTimeout(hide, duration ?? (type === 'error' ? 4000 : 3000));
    },
    [clearTimer, hide, opacity, translateY]
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message) => show({ message, type: 'success' }),
      error: (message) => show({ message, type: 'error' }),
      info: (message) => show({ message, type: 'info' }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.container, { top: insets.top + 12, opacity, transform: [{ translateY }] }]}
        >
          <View style={[styles.toast, { backgroundColor: BACKGROUNDS[toast.type] }]}>
            {toast.type === 'success' ? (
              <CircleCheck size={20} color={COLORS.actionText} />
            ) : toast.type === 'error' ? (
              <CircleAlert size={20} color={COLORS.actionText} />
            ) : (
              <Info size={20} color={COLORS.actionText} />
            )}
            <Text style={styles.message}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 12,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    flex: 1,
    color: COLORS.actionText,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
});
