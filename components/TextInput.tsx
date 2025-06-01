import React, { useState } from 'react';
import { 
  TextInput as DefaultTextInput, 
  View, 
  StyleSheet, 
  TextInputProps as DefaultTextInputProps,
  Pressable,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Text } from './Text';
import { Eye, EyeOff } from 'lucide-react-native';

type TextInputProps = DefaultTextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
};

export function TextInput({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  secureTextEntry,
  style, 
  ...otherProps 
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const textColor = useThemeColor('text');
  const placeholderColor = useThemeColor('textTertiary');
  const backgroundColor = useThemeColor('backgroundSecondary');
  const borderColor = useThemeColor('border');
  const errorColor = useThemeColor('error');
  const primaryColor = useThemeColor('primary');

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getBorderColor = () => {
    if (error) return errorColor;
    if (isFocused) return primaryColor;
    return borderColor;
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    otherProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    otherProps.onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View 
        style={[
          styles.inputContainer, 
          { 
            backgroundColor, 
            borderColor: getBorderColor(),
            borderWidth: 1,
          },
          style
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <DefaultTextInput
          style={[
            styles.input, 
            { 
              color: textColor,
              paddingLeft: leftIcon ? 0 : 12,
              paddingRight: (rightIcon || secureTextEntry) ? 0 : 12,
            }
          ]}
          placeholderTextColor={placeholderColor}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...otherProps}
        />

        {secureTextEntry && (
          <Pressable 
            onPress={togglePasswordVisibility} 
            style={styles.rightIcon}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={placeholderColor} />
            ) : (
              <Eye size={20} color={placeholderColor} />
            )}
          </Pressable>
        )}

        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {error && (
        <Text style={[styles.error, { color: errorColor }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    height: 48,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  leftIcon: {
    paddingLeft: 12,
    paddingRight: 8,
    height: '100%',
    justifyContent: 'center',
  },
  rightIcon: {
    paddingRight: 12,
    paddingLeft: 8,
    height: '100%',
    justifyContent: 'center',
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});