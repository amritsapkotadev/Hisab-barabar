import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getProfile } from '@/services/profiles';
import { calculateBalances } from '@/services/expenses';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Bell, Settings } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [youAreOwed, setYouAreOwed] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');
  const successColor = useThemeColor('success');
  const errorColor = useThemeColor('error');
  const backgroundColor = useThemeColor('background');

  const loadUserData = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await getProfile(user.id);
      setProfile(profileData);

      // For demo purposes, setting static values
      setTotalBalance(1234.56);
      setYouOwe(450.75);
      setYouAreOwed(1685.31);

      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          title: 'Dinner at Restaurant',
          amount: 45.50,
          date: '2024-03-15',
          type: 'expense'
        },
        {
          id: '2',
          title: 'Movie Night',
          amount: 30.00,
          date: '2024-03-14',
          type: 'expense'
        },
        {
          id: '3',
          title: 'Groceries',
          amount: 85.25,
          date: '2024-03-13',
          type: 'expense'
        }
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text variant="heading1">Welcome back</Text>
          <Text style={{ color: textSecondaryColor }}>
            {profile?.display_name || 'Friend'}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={textSecondaryColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/(app)/(tabs)/profile')}
          >
            <Image
              source={{ uri: profile?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceCards}>
        <Card style={[styles.balanceCard, styles.totalBalanceCard]}>
          <View style={styles.cardHeader}>
            <TrendingUp size={24} color={primaryColor} />
            <Text variant="heading3" style={styles.cardTitle}>Total Balance</Text>
          </View>
          <Text variant="heading2" style={{ color: primaryColor }}>
            ${totalBalance.toFixed(2)}
          </Text>
        </Card>

        <View style={styles.smallCards}>
          <Card style={[styles.balanceCard, styles.smallCard]}>
            <View style={styles.cardHeader}>
              <ArrowUpRight size={24} color={successColor} />
              <Text style={styles.cardTitle}>You are owed</Text>
            </View>
            <Text variant="heading3" style={{ color: successColor }}>
              ${youAreOwed.toFixed(2)}
            </Text>
          </Card>

          <Card style={[styles.balanceCard, styles.smallCard]}>
            <View style={styles.cardHeader}>
              <ArrowDownRight size={24} color={errorColor} />
              <Text style={styles.cardTitle}>You owe</Text>
            </View>
            <Text variant="heading3" style={{ color: errorColor }}>
              ${youOwe.toFixed(2)}
            </Text>
          </Card>
        </View>
      </View>

      <View style={styles.recentActivity}>
        <Text variant="heading3" style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.map((activity) => (
          <Card key={activity.id} style={styles.activityCard}>
            <View style={styles.activityContent}>
              <View>
                <Text variant="body" bold>{activity.title}</Text>
                <Text variant="bodySmall" style={{ color: textSecondaryColor }}>
                  {new Date(activity.date).toLocaleDateString()}
                </Text>
              </View>
              <Text 
                variant="body" 
                bold 
                style={{ color: activity.type === 'expense' ? errorColor : successColor }}
              >
                ${activity.amount.toFixed(2)}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  balanceCards: {
    padding: 16,
  },
  balanceCard: {
    marginBottom: 16,
  },
  totalBalanceCard: {
    padding: 24,
  },
  smallCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallCard: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    marginLeft: 8,
  },
  recentActivity: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  activityCard: {
    marginBottom: 12,
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});