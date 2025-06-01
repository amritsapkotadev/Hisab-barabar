import { Text as DefaultText, StyleSheet, TextProps as DefaultTextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultTextProps & {
  variant?: 'heading1' | 'heading2' | 'heading3' | 'body' | 'bodySmall' | 'caption';
  bold?: boolean;
};

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, variant = 'body', bold = false, ...otherProps } = props;
  const color = useThemeColor('text');

  const variantStyle = styles[variant];
  const fontWeight = bold ? styles.bold : null;

  return (
    <DefaultText
      style={[variantStyle, fontWeight, { color }, style]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  heading1: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 34,
  },
  heading2: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 29,
  },
  heading3: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  bold: {
    fontFamily: 'Poppins-Bold',
  },
});