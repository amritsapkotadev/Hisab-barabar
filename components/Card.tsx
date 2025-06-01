import React from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  TouchableOpacityProps, 
  View as DefaultView 
} from 'react-native';
import { View, ViewProps } from './View';
import { useThemeColor } from '@/hooks/useThemeColor';

type CardProps = ViewProps & {
  onPress?: TouchableOpacityProps['onPress'];
  elevated?: boolean;
};

export function Card({ children, style, onPress, elevated = false, ...otherProps }: CardProps) {
  const cardVariant = elevated ? 'cardElevated' : 'card';
  
  if (onPress) {
    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.container]}
      >
        <View variant={cardVariant} style={[style]} {...otherProps}>
          {children}
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <View variant={cardVariant} style={[style]} {...otherProps}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});