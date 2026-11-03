import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type ThemeColors } from '@/constants/theme';

export function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const { styles } = useThemedStyles(createStyles);
  return <View style={[styles.block, style]} />;
}

export function BudgetGaugeLoadingSkeleton({ size = 112 }: { size?: number }) {
  const { colors: COLORS } = useTheme();
  const arc = 'M 20 96 A 90 90 0 0 1 200 96';

  return (
    <View accessible accessibilityLabel="Loading budget progress" style={{ alignItems: 'center' }}>
      <Svg width={size} height={(104 * size) / 220} viewBox="0 0 220 104">
        <Path d={arc} stroke={COLORS.surfaceMuted} strokeWidth={12} strokeLinecap="round" fill="none" />
      </Svg>
      <SkeletonBlock style={{ width: 48, height: 30, marginTop: 6 }} />
      <SkeletonBlock style={{ width: 78, height: 14, marginTop: 2 }} />
    </View>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  block: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 8,
  },
});
