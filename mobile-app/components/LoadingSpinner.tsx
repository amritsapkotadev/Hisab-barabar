import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'large', 
  color
}: LoadingSpinnerProps) {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color ?? COLORS.action} />
      {message && <Text style={styles.message}>{message}</Text>}
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
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
});