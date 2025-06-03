import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getProfile } from '@/services/profiles';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Bell, Settings, Plus, Search } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [youAreOwed, setYouAreOwed] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  type Activity = {
    id: string;
    title: string;
    amount: number;
    date: string;
    type: string;
    participants: string[];
  };
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');
  const successColor = useThemeColor('success');
  const errorColor = useThemeColor('error');
  const backgroundColor = useThemeColor('background');
  const cardColor = useThemeColor('card');
  const accentColor = useThemeColor('accent');

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
          type: 'expense',
          participants: ['You', 'Alex', 'Sam']
        },
        {
          id: '2',
          title: 'Movie Night',
          amount: 30.00,
          date: '2024-03-14',
          type: 'expense',
          participants: ['You', 'Taylor']
        },
        {
          id: '3',
          title: 'Groceries',
          amount: 85.25,
          date: '2024-03-13',
          type: 'expense',
          participants: ['You', 'Jordan', 'Casey']
        },
        {
          id: '4',
          title: 'Settlement',
          amount: 120.00,
          date: '2024-03-10',
          type: 'income',
          participants: ['Alex']
        }
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
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

  const renderBalanceTrend = (balance) => {
    const isPositive = balance >= 0;
    return (
      <View style={styles.trendContainer}>
        <Text style={[styles.trendText, { color: isPositive ? successColor : errorColor }]}>
          {isPositive ? '+' : ''}{balance.toFixed(2)}%
        </Text>
        {isPositive ? (
          <ArrowUpRight size={16} color={successColor} />
        ) : (
          <ArrowDownRight size={16} color={errorColor} />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={textSecondaryColor}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text variant="heading1" style={styles.greeting}>Good morning</Text>
            <Text style={[styles.username, { color: textSecondaryColor }]}>
              {profile?.display_name || 'Friend'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={24} color={textSecondaryColor} />
              <View style={[styles.notificationBadge, { backgroundColor: accentColor }]} />
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

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/(app)/create-expense')}
          >
            <Plus size={20} color="white" />
            <Text style={styles.actionText}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: cardColor }]}
            onPress={() => router.push('/(app)/search')}
          >
            <Search size={20} color={textSecondaryColor} />
            <Text style={[styles.actionText, { color: textSecondaryColor }]}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Cards */}
        <Animated.View style={[styles.balanceCards, { opacity: fadeAnim }]}>
          <Card style={[styles.balanceCard, { backgroundColor: primaryColor }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: 'rgba(255,255,255,0.7)' }]}>Total Balance</Text>
              <TrendingUp size={24} color="white" />
            </View>
            <Text variant="heading1" style={[styles.balanceAmount, { color: 'white' }]}>
              ${totalBalance.toFixed(2)}
            </Text>
            {renderBalanceTrend(2.5)}
          </Card>

          <View style={styles.smallCards}>
            <Card style={[styles.smallCard, { backgroundColor: cardColor }]}>
              <View style={styles.cardHeader}>
                <ArrowUpRight size={20} color={successColor} />
                <Text style={styles.cardTitle}>You are owed</Text>
              </View>
              <Text variant="heading3" style={[styles.smallCardAmount, { color: successColor }]}>
                ${youAreOwed.toFixed(2)}
              </Text>
            </Card>

            <Card style={[styles.smallCard, { backgroundColor: cardColor }]}>
              <View style={styles.cardHeader}>
                <ArrowDownRight size={20} color={errorColor} />
                <Text style={styles.cardTitle}>You owe</Text>
              </View>
              <Text variant="heading3" style={[styles.smallCardAmount, { color: errorColor }]}>
                ${youOwe.toFixed(2)}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <View style={styles.sectionHeader}>
            <Text variant="heading3" style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: primaryColor }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentActivity.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: textSecondaryColor }]}>
                No recent activity
              </Text>
            </Card>
          ) : (
            recentActivity.map((activity) => (
              <Card 
                key={activity.id} 
                style={styles.activityCard}
                onPress={() => router.push(`/(app)/expenses/${activity.id}`)}
              >
                <View style={styles.activityContent}>
                  <View style={styles.activityIcon}>
                    {activity.type === 'expense' ? (
                      <ArrowUpRight size={20} color={errorColor} />
                    ) : (
                      <ArrowDownRight size={20} color={successColor} />
                    )}
                  </View>
                  <View style={styles.activityDetails}>
                    <Text variant="body" bold style={styles.activityTitle}>{activity.title}</Text>
                    <Text variant="bodySmall" style={{ color: textSecondaryColor }}>
                      {activity.participants.join(', ')}
                    </Text>
                  </View>
                  <View style={styles.activityAmount}>
                    <Text 
                      variant="body" 
                      bold 
                      style={{ 
                        color: activity.type === 'expense' ? errorColor : successColor 
                      }}
                    >
                      {activity.type === 'expense' ? '-' : '+'}${activity.amount.toFixed(2)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: textSecondaryColor }}>
                      {new Date(activity.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    marginBottom: 4,
  },
  username: {
    fontSize: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
  },
  balanceCards: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 8,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  smallCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  smallCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  smallCardAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  recentActivity: {
    padding: 24,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
  },
  seeAll: {
    fontWeight: '500',
    fontSize: 14,
  },
  activityCard: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    marginBottom: 4,
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
  },
});