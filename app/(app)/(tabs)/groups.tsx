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
import { GroupSummary } from '@/types';
import { Plus, Search } from 'lucide-react-native';
import { TextInput } from '@/components/TextInput';
import Layout from '@/constants/layout';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');

  useEffect(() => {
    const loadGroups = async () => {
      if (!user) return;
      
      try {
        const { data } = await getGroups(user.id);
        if (data) {
          // Transform data to GroupSummary
          const summaries: GroupSummary[] = data.map(group => ({
            id: group.id,
            name: group.name,
            memberCount: 0, // This would normally come from the backend
            totalExpenses: 0, // This would normally come from the backend
            yourBalance: 0, // This would normally come from the backend
            recentActivity: null
          }));
          
          setGroups(summaries);
          setFilteredGroups(summaries);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGroups();
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [searchQuery, groups]);

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
        <Text variant="heading1">Groups</Text>
        <Text variant="body" style={{ color: textSecondaryColor }}>
          Manage your expense groups
        </Text>
      </View>

      <TextInput
        placeholder="Search groups"
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Search size={20} color={textSecondaryColor} />}
        style={styles.searchInput}
      />

      <View style={styles.content}>
        {filteredGroups.length > 0 ? (
          <FlatList
            data={filteredGroups}
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
              {searchQuery ? 'No Matching Groups' : 'No Groups Yet'}
            </Text>
            <Text style={{ textAlign: 'center', color: textSecondaryColor, marginBottom: 24 }}>
              {searchQuery 
                ? 'Try a different search term' 
                : 'Create a group to start tracking expenses'}
            </Text>
            {!searchQuery && (
              <Button
                title="Create a Group"
                onPress={() => router.push('/create-group')}
                leftIcon={<Plus size={20} color="#FFFFFF" />}
              />
            )}
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: primaryColor }]}
        onPress={() => router.push('/create-group')}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
    marginBottom: Layout.spacing.m,
  },
  searchInput: {
    marginBottom: Layout.spacing.m,
  },
  content: {
    flex: 1,
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
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});