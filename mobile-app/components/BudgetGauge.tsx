import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

const WIDTH = 220;
const STROKE = 12;
const R = 90;
const CX = WIDTH / 2;
const CY = R + STROKE / 2;
const HEIGHT = CY + 8;
const ARC_LENGTH = Math.PI * R;
const TICKS = [0, 0.25, 0.5, 0.75, 1];

// Point on the half circle for a 0..1 position (0 = far left, 1 = far right).
const polar = (t: number, radius: number) => {
  const angle = Math.PI * (1 - t);
  return { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) };
};

type Props = {
  /** Spent / budget. Values above 1 pin the needle to the end; the label shows the real figure. */
  used: number;
  hasBudget: boolean;
  /** Rendered width in px; the drawing scales proportionally. */
  size?: number;
};

export default function BudgetGauge({ used, hasBudget, size = WIDTH }: Props) {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const clamped = hasBudget ? Math.min(Math.max(used, 0), 1) : 0;
  const color = used > 0.8 ? COLORS.negative : used > 0.6 ? COLORS.warning : COLORS.action;
  const needleTip = polar(clamped, R - 22);
  const arc = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  return (
    <View style={styles.container}>
      <Svg width={size} height={(HEIGHT * size) / WIDTH} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Path d={arc} stroke={COLORS.surfaceMuted} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
        {clamped > 0 && (
          <Path
            d={arc}
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${ARC_LENGTH * clamped} ${ARC_LENGTH}`}
          />
        )}
        {TICKS.map((t) => {
          const a = polar(t, R - STROKE - 4);
          const b = polar(t, R - STROKE - 9);
          return <Line key={t} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLORS.borderStrong} strokeWidth={2} strokeLinecap="round" />;
        })}
        <Line x1={CX} y1={CY} x2={needleTip.x} y2={needleTip.y} stroke={COLORS.text} strokeWidth={3} strokeLinecap="round" />
        <Circle cx={CX} cy={CY} r={6} fill={COLORS.text} />
        <Circle cx={CX} cy={CY} r={2.5} fill={COLORS.card} />
      </Svg>
      <Text style={styles.percent}>{hasBudget ? `${Math.round(used * 100)}%` : '–'}</Text>
      <Text style={styles.caption}>
        {!hasBudget ? 'No budget set' : used > 1 ? 'over budget' : 'of budget used'}
      </Text>
    </View>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  percent: {
    fontSize: 24,
    lineHeight: 30,
    marginTop: 6,
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  caption: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Inter-Medium',
  },
});
