import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacityProps 
} from 'react-native';
import { Text } from './Text';
import { useThemeColor } from '@/hooks/useThemeColor';

type ButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export function Button({ 
  title, 
  variant = 'primary', 
  size = 'medium', 
  isLoading = false, 
  leftIcon, 
  rightIcon, 
  disabled, 
  style, 
  ...otherProps 
}: ButtonProps) {
  const primaryColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const backgroundColor = useThemeColor('background');
  
  const getBackgroundColor = () => {
    if (disabled) return '#D1D5DB';
    
    switch (variant) {
      case 'primary': return primaryColor;
      case 'secondary': return useThemeColor('secondary');
      case 'outline':
      case 'ghost': return 'transparent';
      default: return primaryColor;
    }
  };
  
  const getTextColor = () => {
    if (disabled) return '#6B7280';
    
    switch (variant) {
      case 'primary':
      case 'secondary': return '#FFFFFF';
      case 'outline': return primaryColor;
      case 'ghost': return textColor;
      default: return '#FFFFFF';
    }
  };
  
  const getBorderColor = () => {
    if (disabled) return '#D1D5DB';
    
    return variant === 'outline' ? primaryColor : 'transparent';
  };
  
  const sizeStyle = styles[size];
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyle,
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: disabled ? 0.7 : 1,
        },
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...otherProps}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? primaryColor : '#FFFFFF'} 
          size="small" 
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text 
            style={[
              styles.text, 
              sizeStyle && { fontSize: sizeStyle.height * 0.33 },
              { color: getTextColor(), marginLeft: leftIcon ? 8 : 0, marginRight: rightIcon ? 8 : 0 }
            ]}
            bold={variant !== 'ghost'}
          >
            {title}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    textAlign: 'center',
  },
  small: {
    height: 32,
    paddingHorizontal: 12,
  },
  medium: {
    height: 40,
    paddingHorizontal: 16,
  },
  large: {
    height: 48,
    paddingHorizontal: 24,
  },
});