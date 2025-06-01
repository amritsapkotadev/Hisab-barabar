import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Text } from './Text';
import { useThemeColor } from '@/hooks/useThemeColor';

type AvatarProps = {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

export function Avatar({ uri, name, size = 40, style, imageStyle }: AvatarProps) {
  const backgroundColor = useThemeColor('primary');
  const initials = getInitials(name || '');

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: uri ? 'transparent' : backgroundColor,
        },
        style
      ]}
    >
      {uri ? (
        <Image 
          source={{ uri }} 
          style={[
            styles.image, 
            { width: size, height: size, borderRadius: size / 2 },
            imageStyle
          ]} 
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
});