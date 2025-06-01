import { View as DefaultView, StyleSheet, ViewProps as DefaultViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type ViewProps = ThemeProps & DefaultViewProps & {
  variant?: 'screen' | 'card' | 'cardElevated';
};

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, variant, ...otherProps } = props;
  
  const backgroundColor = useThemeColor(variant === 'screen' 
    ? 'background' 
    : variant === 'cardElevated' 
      ? 'cardElevated' 
      : 'card');
  
  const variantStyle = variant ? styles[variant] : null;

  return (
    <DefaultView
      style={[variantStyle, { backgroundColor }, style]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardElevated: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});