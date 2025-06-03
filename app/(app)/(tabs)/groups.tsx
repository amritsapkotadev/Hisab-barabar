import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { router } from 'expo-router';
import { Plus, Search, User, Users, ArrowRight } from 'lucide-react-native';

export default function GroupsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState([
    { id: '1', name: 'Family Vacation', members: 8, balance: 245.75, recentActivity: 'Today, 10:30 AM' },
    { id: '2', name: 'Office Lunch Group', members: 12, balance: -32.50, recentActivity: 'Yesterday, 1:15 PM' },
    { id: '3', name: 'Roommates', members: 4, balance: 87.25, recentActivity: '2 days ago' },
    { id: '4', name: 'Weekend Trip', members: 6, balance: 0.00, recentActivity: '3 days ago' },
    { id: '5', name: 'Birthday Party', members: 15, balance: -145.00, recentActivity: 'Last week' },
  ]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
    }, 1500);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGroupCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.groupCard}
      onPress={() => router.push(`/group/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.groupIcon}>
          <Users size={20} color="#4F46E5" />
        </View>
        <Text style={styles.groupName}>{item.name}</Text>
        <ArrowRight size={20} color="#94A3B8" />
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <User size={16} color="#64748B" />
          <Text style={styles.detailText}>{item.members} members</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={[
            styles.balanceText,
            item.balance > 0 ? styles.positiveBalance : item.balance < 0 ? styles.negativeBalance : styles.neutralBalance
          ]}>
            {item.balance > 0 ? `+$${Math.abs(item.balance).toFixed(2)}` : 
             item.balance < 0 ? `-$${Math.abs(item.balance).toFixed(2)}` : 'Settled'}
          </Text>
        </View>
      </View>
      
      <View style={styles.activityContainer}>
        <Text style={styles.activityText}>Recent activity: {item.recentActivity}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Groups</Text>
        <Text style={styles.subtitle}>Manage your expense groups</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={20} color="#64748B" style={styles.searchIcon} />
          <Text style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{groups.length}</Text>
          <Text style={styles.statLabel}>Total Groups</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading your groups...</Text>
          </View>
        ) : filteredGroups.length > 0 ? (
          <FlatList
            data={filteredGroups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroupCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#4F46E5"
                colors={['#4F46E5']}
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <View style={styles.illustrationCircle} />
              <Image 
                // source={require('@/assets/images/empty-groups.png')} 
                style={styles.illustrationImage}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Create your first group to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/create-group')}
              >
                <Plus size={20} color="#FFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Create Group</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
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
    paddingHorizontal: 24,
    paddingTop: 60,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    paddingVertical: 16,
    fontWeight: '500',
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  groupCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  positiveBalance: {
    color: '#10B981',
  },
  negativeBalance: {
    color: '#EF4444',
  },
  neutralBalance: {
    color: '#64748B',
  },
  activityContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  activityText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIllustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  illustrationCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: '#E0E7FF',
    opacity: 0.6,
  },
  illustrationImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 300,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
});