import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Users, DollarSign, TrendingUp, TrendingDown, Plus, ChevronRight, AlertCircle, Smile } from 'lucide-react-native';
import { Group } from '@/types';
import { apiService } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchGroups = async () => {
    try {
      setError(null);
      const fetchedGroups = await apiService.getGroups();
      setGroups(fetchedGroups);
    } catch (err) {
      setError('Failed to load groups. Please try again.');
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      fetchGroups();
    }, [])
  );

  useEffect(() => {
    fetchGroups();
  }, []);

  const renderGroupCard = ({ item, index }: { item: Group; index: number }) => {
    const netAmount = Object.values(item.balances).reduce((sum, balance) => sum + balance, 0);
    const statusText = netAmount > 0 
      ? `You're owed $${Math.abs(netAmount).toFixed(2)}` 
      : netAmount < 0 
        ? `You owe $${Math.abs(netAmount).toFixed(2)}` 
        : 'Settled up';

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.groupCard}
          onPress={() => router.push(`/group/${item.id}`)}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View style={styles.groupIcon}>
              <Text style={styles.groupInitial}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.groupDescription} numberOfLines={1}>{item.description || 'No description'}</Text>
            </View>
            <ChevronRight size={20} color="#94a3b8" />
          </View>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            <View style={styles.membersContainer}>
              <Users size={16} color="#64748b" />
              <Text style={styles.membersCount}>{item.members.length} member{item.members.length !== 1 ? 's' : ''}</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              netAmount > 0 && styles.positiveStatus,
              netAmount < 0 && styles.negativeStatus
            ]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Groups</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9']}
        style={styles.background}
      />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Groups</Text>
          <Text style={styles.subtitle}>Track shared expenses</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={24} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id}
          style={styles.groupsList}
          contentContainerStyle={[
            styles.groupsContent,
            groups.length === 0 && styles.emptyContainer
          ]}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#7c3aed']}
              tintColor={'#7c3aed'}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Smile size={48} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyDescription}>
                Create a group to start splitting expenses with friends
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/add-group')}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.createButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-group')}
      >
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Plus size={24} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    margin: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  groupsList: {
    flex: 1,
  },
  groupsContent: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7c3aed',
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  positiveStatus: {
    backgroundColor: '#dcfce7',
  },
  negativeStatus: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  positiveText: {
    color: '#16a34a',
  },
  negativeText: {
    color: '#dc2626',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: width * 0.2,
  },
  emptyIllustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  createButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});