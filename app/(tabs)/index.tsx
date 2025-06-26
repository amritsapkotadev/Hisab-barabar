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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Users, FileText, RefreshCw, AlertCircle, Wallet, Bell, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import type { Group, Expense, User } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#6c5ce7',
  secondary: '#00b894',
  accent: '#fbc2eb',
  background: '#f5f7fa',
  card: 'rgba(255,255,255,0.95)',
  glass: 'rgba(255,255,255,0.5)',
  border: '#e0e3eb',
  text: '#22223b',
  subtext: '#636e72',
  positive: '#00b894',
  negative: '#e17055',
  shadow: '#d1d8e0',
  progressBg: '#e0e3eb',
  chip: 'rgba(255,255,255,0.7)',
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
        duration: 600,
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
  const renderHeroHeader = () => {
    const net = user ? getNetBalance(groups, user.id) : 0;
    const isPositive = net >= 0;
    return (
      <LinearGradient
        colors={[COLORS.primary, COLORS.accent, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroHeader}
      >
        <SafeAreaView>
          <View style={styles.heroRow}>
            <View style={styles.heroAvatarWrap}>
              <Image
                source={user?.picture ? { uri: user.picture } : require('@/assets/images/icon.png')}
                style={styles.heroAvatar}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.heroGreeting}>{user ? `Hi, ${user.name.split(' ')[0]}!` : 'Welcome!'}</Text>
              <Text style={styles.heroSubtitle}>Your smart expense dashboard</Text>
            </View>
            <TouchableOpacity style={styles.heroBellBtn} onPress={() => router.push('/profile/notifications')}>
              <Bell size={26} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.heroBalanceCard}>
            <Animated.View style={styles.heroBalanceIconBg}>
              <Wallet size={70} color={'#fff'} style={{ opacity: 0.08 }} />
            </Animated.View>
            <Text style={styles.heroBalanceLabel}>Net Balance</Text>
            <Text style={[styles.heroBalanceValue, { color: isPositive ? COLORS.positive : COLORS.negative }]}>₹{Math.abs(net).toFixed(2)}</Text>
            <View style={[styles.heroChip, { backgroundColor: COLORS.chip }]}> 
              <Text style={[styles.heroChipText, { color: isPositive ? COLORS.positive : COLORS.negative }]}>{isPositive ? 'You are owed' : 'You owe'}</Text>
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.heroCurve} />
      </LinearGradient>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsBarWrap}>
      <View style={styles.quickActionsBarGlass}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/add-expense-advanced')} activeOpacity={0.85}>
          <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.quickActionIconGlass}>
            <Plus size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/add-group')} activeOpacity={0.85}>
          <LinearGradient colors={[COLORS.secondary, COLORS.primary]} style={styles.quickActionIconGlass}>
            <Users size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionText}>Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => alert('Scan Receipt coming soon!')} activeOpacity={0.85}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.quickActionIconGlass}>
            <Camera size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionText}>Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGroupCard = ({ item, index }: { item: Group; index: number }) => {
    const spent = item.totalExpenses;
    const limit = item.limit || Math.max(1000, spent * 1.5);
    const progress = Math.min(spent / limit, 1);
    const isActive = index === activeGroupIdx;
    return (
      <TouchableOpacity
        style={[styles.groupCarouselCard, isActive && styles.groupCarouselCardActive]}
        onPress={() => router.push(`/group/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.groupCarouselAvatarWrap}>
          <View style={styles.groupCarouselAvatar}>
            <Users size={22} color={COLORS.primary} />
          </View>
        </View>
        <Text style={styles.groupCarouselName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.groupCarouselMembers}>{item.members.length} members</Text>
        <View style={styles.groupCarouselProgressWrap}>
          <View style={styles.groupCarouselProgressBg} />
          <Animated.View style={[styles.groupCarouselProgress, { width: `${progress * 100}%`, backgroundColor: progress < 1 ? COLORS.secondary : COLORS.negative }]} />
          <Text style={styles.groupCarouselProgressText}>{Math.round(progress * 100)}%</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupsCarousel = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Groups</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      {groups.length === 0 ? (
        <Text style={styles.emptyText}>No groups yet. Create one to get started!</Text>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupCard}
          keyExtractor={g => g.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupsCarouselRow}
          snapToInterval={180}
          decelerationRate="fast"
          onScroll={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / 180);
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
        <View style={[styles.expenseIcon, { backgroundColor: isPositive ? COLORS.positive : COLORS.negative }] }>
          <FileText size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.expenseTitle} numberOfLines={1}>{item.description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.expenseSubtitle} numberOfLines={1}>
              {group ? group.name : 'Unknown Group'}
            </Text>
            <View style={styles.groupTag}>
              <Text style={styles.groupTagText}>{item.paidBy}</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.expenseAmount, { color: isPositive ? COLORS.positive : COLORS.negative }]}>₹{item.amount.toFixed(2)}</Text>
          <Text style={styles.expenseDate}>{new Date(item.date || item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecentExpenses = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      {expenses.length === 0 ? (
        <Text style={styles.emptyText}>No expenses recorded yet.</Text>
      ) : (
        <FlatList
          data={expenses.slice(0, 5)}
          renderItem={renderExpenseItem}
          keyExtractor={e => e.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  // --- Main Render ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <AlertCircle size={40} color={COLORS.negative} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAll}>
            <RefreshCw size={18} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {renderHeroHeader()}
        {renderQuickActions()}
        {renderGroupsCarousel()}
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
  heroHeader: {
    width: '100%',
    paddingBottom: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    minHeight: 260,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    marginBottom: 8,
  },
  heroAvatarWrap: {
    backgroundColor: COLORS.card,
    borderRadius: 32,
    padding: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.glass,
  },
  heroBellBtn: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: COLORS.glass,
    elevation: 2,
  },
  heroGreeting: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.subtext,
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  heroBalanceCard: {
    marginHorizontal: 24,
    marginTop: 18,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBalanceIconBg: {
    position: 'absolute',
    right: 18,
    top: 18,
    opacity: 0.18,
  },
  heroBalanceLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  heroBalanceValue: {
    fontSize: 36,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  heroChip: {
    marginTop: 8,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  heroChipText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
  },
  heroCurve: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 40,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    zIndex: 2,
  },
  quickActionsBarWrap: {
    marginTop: -32,
    marginBottom: 16,
    alignItems: 'center',
    zIndex: 10,
  },
  quickActionsBarGlass: {
    flexDirection: 'row',
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    padding: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    width: SCREEN_WIDTH - 48,
    justifyContent: 'space-between',
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickActionIconGlass: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  quickActionText: {
    fontSize: 15,
    color: COLORS.primary,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  groupsCarouselRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    gap: 12,
  },
  groupCarouselCard: {
    width: 160,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    padding: 18,
    transform: [{ scale: 0.95 }],
  },
  groupCarouselCardActive: {
    transform: [{ scale: 1.08 }],
    shadowOpacity: 0.18,
    elevation: 8,
  },
  groupCarouselAvatarWrap: {
    marginBottom: 10,
  },
  groupCarouselAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: 2,
  },
  groupCarouselName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
    textAlign: 'center',
  },
  groupCarouselMembers: {
    fontSize: 12,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
    marginBottom: 6,
    textAlign: 'center',
  },
  groupCarouselProgressWrap: {
    width: '100%',
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.progressBg,
    marginTop: 6,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  groupCarouselProgressBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.progressBg,
    borderRadius: 9,
  },
  groupCarouselProgress: {
    height: 18,
    borderRadius: 9,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  groupCarouselProgressText: {
    fontSize: 11,
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    zIndex: 2,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  expenseIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  expenseSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  groupTag: {
    backgroundColor: COLORS.glass,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  groupTagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontFamily: 'Inter-SemiBold',
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 11,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.subtext,
    marginTop: 16,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.negative,
    marginTop: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyText: {
    color: COLORS.subtext,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});