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
  // ... existing state and logic remains unchanged ...

  return (
    <View style={styles.container} variant="screen">
      <View style={styles.header}>
        <Text variant="heading1" style={styles.title}>Your Groups</Text>
        <Text variant="body" style={[styles.subtitle, { color: textSecondaryColor }]}>
          Manage your expense groups
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={20} color={textSecondaryColor} style={styles.searchIcon} />
          <TextInput
            placeholder="Search groups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        </View>
      </View>

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
                style={styles.groupCard}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <View style={[styles.circle, styles.circle1]} />
              <View style={[styles.circle, styles.circle2]} />
              <Plus size={48} color={textSecondaryColor} style={styles.plusIcon} />
            </View>
            <Text variant="heading3" style={styles.emptyTitle}>
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: textSecondaryColor }]}>
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Create your first group to get started'}
            </Text>
            {!searchQuery && (
              <Button
                title="Create Group"
                onPress={() => router.push('/create-group')}
                leftIcon={<Plus size={20} color="#FFFFFF" />}
                style={styles.createButton}
              />
            )}
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: primaryColor }]}
        onPress={() => router.push('/create-group')}
        activeOpacity={0.9}
      >
        <Plus size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Layout.spacing.xl,
    backgroundColor: '#F8FAFC',
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.xs,
  },
  title: {
    fontWeight: '800',
    fontSize: 32,
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 2,
    opacity: 0.8,
  },
  searchContainer: {
    marginBottom: Layout.spacing.m,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    paddingVertical: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    marginTop: Layout.spacing.xs,
  },
  listContent: {
    paddingBottom: Layout.spacing.xl,
  },
  groupCard: {
    marginBottom: Layout.spacing.m,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    marginTop: -50,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Layout.spacing.l,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(125, 125, 125, 0.08)',
  },
  circle1: {
    width: 100,
    height: 100,
  },
  circle2: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(125, 125, 125, 0.05)',
  },
  plusIcon: {
    opacity: 0.4,
  },
  emptyTitle: {
    fontWeight: '700',
    fontSize: 22,
    marginBottom: 8,
    color: '#1E293B',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
    lineHeight: 24,
    maxWidth: 300,
    opacity: 0.7,
  },
  createButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 34,
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
});