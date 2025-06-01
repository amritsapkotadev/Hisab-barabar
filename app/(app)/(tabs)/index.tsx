import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { GroupCard } from '@/components/GroupCard';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getGroups } from '@/services/groups';
import { getProfile } from '@/services/profiles';
import { GroupSummary, Profile } from '@/types';
import { Plus, TrendingUp, CircleArrowDown as ArrowDownCircle, ChartPie as PieChart } from 'lucide-react-native';
import Layout from '@/constants/layout';

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');
  const cardBackgroundColor = useThemeColor('card');

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const { data: profileData } = await getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
        }
        
        const { data: groupsData } = await getGroups(user.id);
        if (groupsData) {
          setGroups(groupsData);
        }
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const QuickStats = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}>
        <TrendingUp size={24} color={primaryColor} />
        <Text variant="heading3" style={styles.statAmount}>$1,234</Text>
        <Text style={{ color: textSecondaryColor }}>Total Spent</Text>
      </View>
      
      <View style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}>
        <ArrowDownCircle size={24} color={primaryColor} />
        <Text variant="heading3" style={styles.statAmount}>$567</Text>
        <Text style={{ color: textSecondaryColor }}>You Owe</Text>
      </View>
      
      <View style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}>
        <PieChart size={24} color={primaryColor} />
        <Text variant="heading3" style={styles.statAmount}>$321</Text>
        <Text style={{ color: textSecondaryColor }}>You're Owed</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loading]} variant="screen">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View style={styles.container} variant="screen">
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text variant="heading1">
            Hello, {profile?.display_name || 'there'}
          </Text>
          <Text style={{ color: textSecondaryColor }}>
            Track and split expenses with friends
          </Text>
        </View>
        <Image 
          source={{ uri: profile?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' }}
          style={styles.avatar}
        />
      </View>

      <QuickStats />

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text variant="heading3">Recent Groups</Text>
          <TouchableOpacity onPress={() => router.push('/create-group')}>
            <Plus size={24} color={primaryColor} />
          </TouchableOpacity>
        </View>

        {groups.length > 0 ? (
          <FlatList
            data={groups.slice(0, 3)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <GroupCard 
                group={item} 
                onPress={() => router.push({
                  pathname: '/(app)/group/[id]',
                  params: { id: item.id }
                })}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text variant="heading3" style={{ textAlign: 'center', marginBottom: 12 }}>
              No Groups Yet
            </Text>
            <Text style={{ textAlign: 'center', color: textSecondaryColor, marginBottom: 24 }}>
              Create a group to start tracking expenses
            </Text>
            <Button
              title="Create a Group"
              onPress={() => router.push('/create-group')}
              leftIcon={<Plus size={20} color="#FFFFFF" />}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.l,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.l,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: Layout.spacing.m,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
    marginHorizontal: Layout.spacing.xs,
    alignItems: 'center',
  },
  statAmount: {
    marginVertical: Layout.spacing.s,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  listContent: {
    paddingBottom: Layout.spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
});