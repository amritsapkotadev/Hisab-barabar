import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Users, FileText, RefreshCw, AlertCircle, Wallet, Bell, Camera, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { apiService } from '@/services/api';
import type { Group, Expense, User } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

// Modern color palette
const COLORS = {
  primary: '#7E57C2',
  secondary: '#5C6BC0',
  accent: '#EC407A',
  background: '#0F0F1B',
  card: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.1)',
  text: '#FFFFFF',
  subtext: '#A0A0C0',
  positive: '#66BB6A',
  negative: '#EF5350',
  shadow: '#000000',
  progressBg: 'rgba(255,255,255,0.1)',
  chip: 'rgba(255,255,255,0.2)',
  gradientStart: '#1E1E3A',
  gradientEnd: '#2D2D4A',
};

function getNetBalance(groups: Group[], userId: string) {
  let net = 0;
  groups.forEach(g => {
    if (g.balances && g.balances[userId]) net += g.balances[userId];
  });
  return net;
}

export default function HomeScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsRes, expensesRes, userRes] = await Promise.all([
        apiService.getGroups(),
        apiService.getAllExpenses(),
        apiService.getUserProfile(),
      ]);
      setGroups(groupsRes);
      setExpenses(expensesRes);
      setUser(userRes);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  // --- UI Components ---
  const renderAppBar = () => (
    <View style={styles.appBar}>
      <View style={styles.appBarContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={user?.picture ? { uri: user.picture } : require('@/assets/images/icon.png')}
            style={styles.avatar}
          />
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{user ? user.name.split(' ')[0] : 'User'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/profile/notifications')}
        >
          <View style={styles.notificationBadge} />
          <Bell size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNetBalanceCard = () => {
    const net = user ? getNetBalance(groups, user.id) : 0;
    const isPositive = net >= 0;
    const formattedNet = Math.abs(net).toFixed(2);
    
    return (
      <BlurView intensity={20} tint="dark" style={styles.balanceCard}>
        <LinearGradient
          colors={['rgba(126, 87, 194, 0.3)', 'rgba(92, 107, 192, 0.3)']}
          style={styles.balanceGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.balanceContent}>
          <View style={styles.balanceHeader}>
            <Wallet size={20} color={COLORS.text} />
            <Text style={styles.balanceTitle}>Net Balance</Text>
          </View>
          <Text style={[styles.balanceValue, { color: isPositive ? COLORS.positive : COLORS.negative }]}>
            ₹{formattedNet}
          </Text>
          <Text style={[styles.balanceStatus, { color: isPositive ? COLORS.positive : COLORS.negative }]}>
            {isPositive ? 'You are owed' : 'You owe'}
          </Text>
        </View>
      </BlurView>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.actionsContainer}>
      {[
        { icon: <Plus size={22} color="#FFF" />, label: 'Add', action: () => router.push('/add-expense-advanced') },
        { icon: <Users size={22} color="#FFF" />, label: 'Group', action: () => router.push('/add-group') },
        { icon: <Camera size={22} color="#FFF" />, label: 'Scan', action: () => alert('Scan Receipt coming soon!') },
      ].map((action, index) => (
        <TouchableOpacity
          key={index}
          style={styles.actionButton}
          onPress={action.action}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.actionIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {action.icon}
          </LinearGradient>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGroupCard = ({ item, index }: { item: Group; index: number }) => {
    const spent = item.totalExpenses;
    const limit = item.limit || Math.max(1000, spent * 1.5);
    const progress = Math.min(spent / limit, 1);
    const isActive = index === activeGroupIdx;
    
    return (
      <TouchableOpacity
        style={[styles.groupCard, isActive && styles.groupCardActive]}
        onPress={() => router.push(`/group/${item.id}`)}
        activeOpacity={0.9}
      >
        <BlurView intensity={isIOS ? 20 : 10} tint="dark" style={styles.groupCardInner}>
          <View style={styles.groupIcon}>
            <Users size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.groupMembers}>{item.members.length} members</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground} />
            <View style={[styles.progressFill, { 
              width: `${progress * 100}%`,
              backgroundColor: progress < 0.7 ? COLORS.positive : COLORS.negative 
            }]} />
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderGroupsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Groups</Text>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={() => router.push('/(tabs)/groups')}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={16} color={COLORS.subtext} />
        </TouchableOpacity>
      </View>
      {groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No groups yet</Text>
          <Text style={styles.emptySubtext}>Create your first group to get started</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupCard}
          keyExtractor={g => g.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupsContainer}
          snapToInterval={SCREEN_WIDTH * 0.7 + 16}
          decelerationRate="fast"
          onScroll={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH * 0.7 + 16));
            setActiveGroupIdx(idx);
          }}
        />
      )}
    </View>
  );

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const group = groups.find((g) => g.id === item.groupId);
    const isPositive = user && item.paidBy === user.name;
    
    return (
      <TouchableOpacity
        style={styles.expenseCard}
        onPress={() => router.push(`/group/${item.groupId}`)}
        activeOpacity={0.85}
      >
        <BlurView intensity={20} tint="dark" style={styles.expenseCardInner}>
          <View style={[styles.expenseIcon, { backgroundColor: isPositive ? COLORS.positive : COLORS.negative }]}>
            <FileText size={16} color="#FFF" />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseTitle} numberOfLines={1}>{item.description}</Text>
            <Text style={styles.expenseGroup} numberOfLines={1}>
              {group ? group.name : 'Unknown Group'}
            </Text>
          </View>
          <View style={styles.expenseAmountContainer}>
            <Text style={[styles.expenseAmount, { color: isPositive ? COLORS.positive : COLORS.negative }]}>
              ₹{item.amount.toFixed(2)}
            </Text>
            <Text style={styles.expenseDate}>
              {new Date(item.date || item.createdAt).toLocaleDateString('en-IN', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderRecentExpenses = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={() => router.push('/(tabs)/transactions')}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={16} color={COLORS.subtext} />
        </TouchableOpacity>
      </View>
      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Add your first expense to see it here</Text>
        </View>
      ) : (
        <FlatList
          data={expenses.slice(0, 5)}
          renderItem={renderExpenseItem}
          keyExtractor={e => e.id}
          scrollEnabled={false}
          contentContainerStyle={styles.expensesContainer}
        />
      )}
    </View>
  );

  // --- Main Render ---
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <AlertCircle size={48} color={COLORS.negative} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAll}>
          <RefreshCw size={18} color="#FFF" />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[COLORS.primary]} 
            tintColor={COLORS.primary}
            progressBackgroundColor={COLORS.background}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderAppBar()}
        {renderNetBalanceCard()}
        {renderQuickActions()}
        {renderGroupsSection()}
        {renderRecentExpenses()}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  appBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  appBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.glass,
  },
  greetingContainer: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginTop: 2,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    zIndex: 10,
  },
  balanceCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
    height: 160,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  balanceGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  balanceContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
  },
  balanceStatus: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
    marginRight: 4,
  },
  groupsContainer: {
    paddingLeft: 24,
    paddingRight: 8,
  },
  groupCard: {
    width: SCREEN_WIDTH * 0.7,
    marginRight: 16,
    borderRadius: 24,
    overflow: 'hidden',
    height: 180,
  },
  groupCardActive: {
    transform: [{ scale: 1.02 }],
  },
  groupCardInner: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(126, 87, 194, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(126, 87, 194, 0.4)',
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
  },
  groupMembers: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.progressBg,
    marginTop: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.progressBg,
  },
  progressFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    top: -20,
    fontSize: 12,
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  expensesContainer: {
    paddingHorizontal: 24,
  },
  expenseCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  expenseCardInner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  expenseGroup: {
    fontSize: 13,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.subtext,
    marginTop: 24,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
    marginTop: 24,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});