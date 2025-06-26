import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';

export default function IndexScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        router.replace('/welcome');
        return;
      }

      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        apiService.setAuthToken(token);
        try {
          await apiService.getUserProfile();
          router.replace('/(tabs)');
          return;
        } catch (error) {
          await AsyncStorage.removeItem('authToken');
          apiService.clearAuthToken();
        }
      }

      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error checking auth status:', error);
      router.replace('/welcome');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>💰</Text>
        <Text style={styles.logoText}>SplitSaathi</Text>
      </View>
      <ActivityIndicator size="large" color="#4f46e5" />
      <Text style={styles.text}>Loading SplitSaathi...</Text>
      <Text style={styles.subtext}>Made with ❤️ in Nepal 🇳🇵</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 48,
    marginRight: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
});
