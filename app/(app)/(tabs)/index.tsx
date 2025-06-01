import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
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
import { Plus } from 'lucide-react-native';
import Layout from '@/constants/layout';

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const primaryColor = useThemeColor('primary');
  const backgroundColor = useThemeColor('background');

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Load profile
        const { data: profileData } = await getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
        }
        
        // Load groups
        const { data: groupsData } = await getGroups(user.id);
        if (groupsData) {
          // Transform data to GroupSummary
          const summaries: GroupSummary[] = groupsData.map(group => ({
            id: group.id,
            name: group.name,
            memberCount: 0, // This would normally come from the backend
            totalExpenses: 0, // This would normally come from the backend
            yourBalance: 0, // This would normally come from the backend
            recentActivity: null
          }));
          
          setGroups(summaries);
        }
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);

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
        <Text variant="heading1">
          Hello, {profile?.display_name || 'there'}
        </Text>
        <Text variant="body">
          Track and split expenses with friends and family
        </Text>
      </View>

      <View style={styles.content}>
        {groups.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text variant="heading3">Your Groups</Text>
              <TouchableOpacity onPress={() => router.push('/create-group')}>
                <Plus size={24} color={primaryColor} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={groups}
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
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text variant="heading3" style={{ textAlign: 'center', marginBottom: 12 }}>
              No Groups Yet
            </Text>
            <Text style={{ textAlign: 'center', marginBottom: 24 }}>
              Create a group to start tracking expenses with friends and family
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