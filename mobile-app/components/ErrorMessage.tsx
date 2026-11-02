import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CircleAlert as AlertCircle } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export default function ErrorMessage({ 
  message, 
  onRetry, 
  retryText = 'Retry' 
}: ErrorMessageProps) {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <AlertCircle size={48} color={COLORS.negative} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: COLORS.negative,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 24,
    fontFamily: 'Inter-Medium',
  },
  retryButton: {
    backgroundColor: COLORS.action,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryButtonText: {
    color: COLORS.actionText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});