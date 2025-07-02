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
      <View style={styles.dashboardCard}>
        <View style={styles.dashboardRow}>
          <View style={styles.dashboardItem}>
            <Text style={styles.dashboardLabel}>Net Balance</Text>
            <Text style={styles.dashboardValuePositive}>₹ 2,350</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.dashboardItem}>
            <Text style={styles.dashboardLabel}>Monthly Expense</Text>
            <Text style={styles.dashboardValueNegative}>₹ 4,120</Text>
          </View>
        </View>
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
  dashboardCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dashboardItem: {
    flex: 1,
    alignItems: 'center',
  },
  dashboardLabel: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  dashboardValuePositive: {
    fontSize: 22,
    fontWeight: '700',
    color: '#22c55e', // green
  },
  dashboardValueNegative: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ef4444', // red
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },
});
