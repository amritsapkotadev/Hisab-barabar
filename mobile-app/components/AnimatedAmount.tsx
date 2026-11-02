import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface AnimatedAmountProps {
  value: string;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  /** Rendered as a separately-styled nested Text (e.g. a currency glyph that needs its own font). */
  prefixNode?: React.ReactNode;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
}

/**
 * Fades + slides a new value in whenever `value` changes, giving amounts a
 * smooth "ticking" transition instead of an abrupt text swap.
 */
export default function AnimatedAmount({
  value,
  style,
  prefix,
  prefixNode,
  numberOfLines,
  adjustsFontSizeToFit,
}: AnimatedAmountProps) {
  return (
    <Animated.Text
      key={value}
      entering={FadeIn.duration(220)}
      style={style}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
    >
      {prefixNode}
      {prefix}
      {value}
    </Animated.Text>
  );
}
