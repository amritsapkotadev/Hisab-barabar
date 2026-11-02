import React, { useState, useEffect } from 'react';
import { useServerRefresh } from '@/hooks/useServerRefresh';
import { refreshServerData } from '@/services/dataClient';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { TouchableOpacity as SwipeButton } from 'react-native-gesture-handler';
import { useToast } from '@/components/Toast';
import { 
  Receipt, 
  User, 
  Plus,
  Trash2,
  ArrowLeft,
  Users,
  Edit3,
  HandCoins
} from 'lucide-react-native';
import { Group, Expense } from '@/types';
import { apiService } from '@/services/api';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import AnimatedAmount from '@/components/AnimatedAmount';
import * as Haptics from 'expo-haptics';
import { type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PAGE_SIZE = 7;
const SHOW_MORE_INCREMENT = 5;

export default function TransactionsScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'week' | 'month'>('all');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchData = async () => {
    try {
      const [groupsData, userData] = await Promise.all([
        apiService.getGroups(),
        apiService.getUserProfile()
      ]);
      setGroups(groupsData);
      setUser(userData);
      
      const allExpensesData = (await apiService.getAllExpenses()).filter(expense => expense.groupId);
      
      // Sort by date (newest first)
      const sortedExpenses = allExpensesData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setAllExpenses(sortedExpenses);
      setFilteredExpenses(sortedExpenses);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error instanceof Error ? error.message : 'Could not load transactions.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshServerData(false);
    await fetchData();
    setRefreshing(false);
  };

  useServerRefresh(fetchData);

  useEffect(() => {
    filterExpenses();
    setVisibleCount(PAGE_SIZE);
  }, [selectedFilter, allExpenses]);

  const filterExpenses = () => {
    const now = new Date();
    let filtered = [...allExpenses];

    if (selectedFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = allExpenses.filter(expense => new Date(expense.createdAt) >= weekAgo);
    } else if (selectedFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = allExpenses.filter(expense => new Date(expense.createdAt) >= monthAgo);
    }

    setFilteredExpenses(filtered);
  };

  const handleDeleteExpense = (expense: Expense) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedExpense(expense);
    setDeleteModalVisible(true);
  };

  const confirmDeleteExpense = async () => {
    if (!selectedExpense) return;
    setDeleting(true);
    try {
      await apiService.deleteExpense(selectedExpense.id, selectedExpense.revision);
      setAllExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
      setFilteredExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
      setSelectedExpense(null);
      setDeleteModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error?.code === 'OFFLINE_QUEUED') {
        setDeleteModalVisible(false);
        toast.info('Delete saved locally, pending sync. The expense remains confirmed until sync completes.');
        router.push('/profile/offline-sync');
        return;
      }
      toast.error(error.message || 'Failed to delete expense. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    const [whole, dec] = amount.toFixed(2).split('.');
    // en-IN grouping matches the Nepali lakh/crore comma system (e.g. 1,00,000)
    return `${Number(whole).toLocaleString('en-IN')}.${dec}`;
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.name || 'Unknown Group';
  };

  // Group expenses store paidBy/participants as a member's stable
  // group-scoped id, not a display name - resolve it for rendering.
  const getMemberName = (groupId: string, memberId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.members.find(m => m.id === memberId)?.name || memberId;
  };

  const isPaidByMe = (item: Expense) => {
    if (!user) return false;
    const group = groups.find(g => g.id === item.groupId);
    if (!group) return item.paidBy === user.name; // personal expense fallback
    const myMemberId = group.members.find(m => m.userId === user.id)?.id;
    return item.paidBy === myMemberId;
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getAverageAmount = () => {
    return filteredExpenses.length > 0 ? getTotalAmount() / filteredExpenses.length : 0;
  };

  const handleShowMore = () => {
    if (loadingMore) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingMore(true);
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setVisibleCount(prev => prev + SHOW_MORE_INCREMENT);
      setLoadingMore(false);
    }, 400);
  };

  const displayedExpenses = filteredExpenses.slice(0, visibleCount);
  const hiddenCount = filteredExpenses.length - displayedExpenses.length;

  const renderExpenseCard = ({ item }: { item: Expense }) => {
    const isPaidByUser = isPaidByMe(item);
    
    return (
      <View style={styles.expenseCardShadowWrap}>
        <View style={styles.expenseCardClip}>
          <Swipeable
            overshootLeft={false}
            overshootRight={false}
            friction={2.2}
            dragOffsetFromLeftEdge={28}
            dragOffsetFromRightEdge={28}
            renderLeftActions={(_p, _t, methods) => (
              <SwipeButton
                containerStyle={styles.swipeActionContainer}
                style={[styles.swipeAction, { backgroundColor: COLORS.action }]}
                accessibilityRole="button"
                accessibilityLabel="Edit transaction"
                onPress={() => {
                  methods.close();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/group/${item.groupId}/expense/${item.id}/edit`);
                }}
              >
                <Edit3 size={18} color={COLORS.actionText} />
              </SwipeButton>
            )}
            renderRightActions={(_p, _t, methods) => (
              <SwipeButton
                containerStyle={styles.swipeActionContainer}
                style={[styles.swipeAction, { backgroundColor: COLORS.negative }]}
                accessibilityRole="button"
                accessibilityLabel="Delete transaction"
                onPress={() => {
                  methods.close();
                  handleDeleteExpense(item);
                }}
              >
                <Trash2 size={18} color={COLORS.actionText} />
              </SwipeButton>
            )}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/group/${item.groupId}/expense/${item.id}`);
              }}
              activeOpacity={0.85}
              style={styles.expenseCard}
            >
              <View style={styles.expenseContent}>
                <View style={styles.expenseLeft}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDescription} numberOfLines={1}>
                      {item.description}
                    </Text>
                    {item.offlinePending && <Text style={styles.pendingLabel}>Pending sync · not in balances</Text>}
                    <View style={styles.expenseDetails}>
                      <View style={styles.detailItem}>
                        <User size={11} color={COLORS.textTertiary} />
                        <Text style={styles.detailText}>{getMemberName(item.groupId, item.paidBy)}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Users size={11} color={COLORS.textTertiary} />
                        <Text style={styles.detailText}>{getGroupName(item.groupId)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={[styles.expenseAmount, { color: isPaidByUser ? COLORS.success : COLORS.text }]}>
                    रु {formatAmount(item.amount)}
                  </Text>
                  <Text style={styles.dateTimeText}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Swipeable>
        </View>
      </View>
    );
  };

  const renderFilterButton = (filter: 'all' | 'week' | 'month', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.activeFilterButton,
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedFilter(filter);
      }}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.filterButtonText,
        { fontSize: filter === 'month' ? 13 : undefined },
        selectedFilter === filter && styles.activeFilterButtonText,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStatsCard = () => {
    const totalAmount = getTotalAmount();
    const averageAmount = getAverageAmount();
    
    return (
      <View style={styles.statsCard}>
        <View style={styles.statsMain}>
          <View style={styles.statsTitleRow}>
            <HandCoins size={14} color={COLORS.textSecondary} />
            <Text style={styles.statsTitle}>Total Expenses</Text>
          </View>
          <AnimatedAmount
            value={formatAmount(totalAmount)}
            prefix="रु "
            style={styles.totalValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          />
        </View>
        <View style={styles.statsSide}>
          <View style={styles.statsItem}>
            <Text style={styles.statsLabel}>Transactions</Text>
            <AnimatedAmount value={String(filteredExpenses.length)} style={styles.statsValue} />
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsLabel}>Average</Text>
            <AnimatedAmount value={formatAmount(averageAmount)} prefix="रु " style={styles.statsValue} />
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.action} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>History</Text>
            <Text style={styles.headerSubtitle}>Track your shared expenses</Text>
          </View>
          
          <View style={styles.headerIcon}>
            <Receipt size={24} color={COLORS.text} />
          </View>
        </View>
      </View>

      {/* Stats Card */}
      {renderStatsCard()}

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <View style={styles.filterButtons}>
          {renderFilterButton('all', 'All Time')}
          {renderFilterButton('week', 'This Week')}
          {renderFilterButton('month', 'This Month')}
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={displayedExpenses}
        renderItem={renderExpenseCard}
        keyExtractor={(item) => item.id}
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[COLORS.action]}
            tintColor={COLORS.action}
            progressBackgroundColor={COLORS.surface}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Receipt size={48} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyDescription}>
              {selectedFilter === 'all' 
                ? 'Start adding expenses to see them here'
                : `No transactions found for the selected time period`
              }
            </Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/add-expense-advanced');
              }}
              activeOpacity={0.8}
            >
              <Plus size={18} color={COLORS.actionText} />
              <Text style={styles.addFirstText}>Add First Expense</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          hiddenCount > 0 ? (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={handleShowMore}
              activeOpacity={0.8}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={COLORS.actionText} />
              ) : (
                <Text style={styles.showMoreText}>Show More</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/add-expense-advanced');
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <View style={styles.fabGradient}>
          <Plus size={28} color={COLORS.actionText} />
        </View>
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setSelectedExpense(null);
        }}
        onConfirm={confirmDeleteExpense}
        title="Delete Transaction"
        message={`Are you sure you want to delete \"${selectedExpense?.description}\"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Transaction'}
        requiresConfirmation={false}
        isDangerous={true}
      />
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  statsMain: {
    flex: 1,
    marginRight: 16,
  },
  statsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-SemiBold',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  statsSide: {
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    gap: 10,
  },
  statsItem: {},
  statsLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeFilterButton: {
    backgroundColor: COLORS.action,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-SemiBold',
  },
  activeFilterButtonText: {
    color: COLORS.actionText,
  },
  transactionsList: {
    flex: 1,
  },
  transactionsContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    minWidth: 112,
    minHeight: 40,
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: COLORS.action,
    marginTop: 4,
    marginBottom: 8,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.actionText,
    fontFamily: 'Inter-SemiBold',
  },
  expenseCardShadowWrap: {
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseCardClip: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  expenseCard: {
    backgroundColor: COLORS.card,
  },
  expenseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 3,
  },
  pendingLabel: {
    fontSize: 11,
    color: COLORS.warning,
    marginBottom: 4,
  },
  expenseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  expenseRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 3,
  },
  dateTimeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  swipeAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionContainer: {
    width: 64,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: COLORS.action,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 10,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: COLORS.action,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.action,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 8,
  },
  addFirstText: {
    color: COLORS.actionText,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
});