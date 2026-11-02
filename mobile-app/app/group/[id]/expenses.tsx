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
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Plus, Calendar, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Expense, GroupMember } from '@/types';
import { apiService } from '@/services/api';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PAGE_SIZE = 5;

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

export default function GroupExpensesScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [membersById, setMembersById] = useState<Record<string, GroupMember>>({});

  const getMemberName = (memberId: string): string => {
    return membersById[memberId]?.name || memberId;
  };

  const fetchExpenses = async () => {
    if (!id) return;
    try {
      setError(null);
      const [expenseData, group] = await Promise.all([
        apiService.getGroupExpenses(id),
        apiService.getGroup(id),
      ]);
      setExpenses(expenseData);
      const map: Record<string, GroupMember> = {};
      group?.members.forEach((member) => {
        map[member.id] = member;
      });
      setMembersById(map);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      setError('Failed to load expenses. Please try again.');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshServerData(false);
    await fetchExpenses();
    setRefreshing(false);
  };

  useServerRefresh(fetchExpenses, id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleShowMore = () => {
    if (loadingMore) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingMore(true);
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 400);
  };

  const displayedExpenses = expenses.slice(0, visibleCount);
  const hiddenCount = expenses.length - displayedExpenses.length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Expenses</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.action} />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Expenses</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchExpenses}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity
          style={styles.addExpenseButton}
          onPress={() => router.push({ pathname: '/add-expense-advanced', params: { groupId: id } })}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
        >
          <Plus size={20} color={COLORS.actionText} />
          <Text style={styles.addExpenseText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={displayedExpenses}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/group/${id}/expense/${item.id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <View style={styles.expenseAvatar}>
                  <Text style={styles.expenseAvatarText}>{getInitials(getMemberName(item.paidBy))}</Text>
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{item.description}</Text>
                  {item.offlinePending && <Text style={styles.pendingLabel}>Pending sync · not in balances</Text>}
                  <View style={styles.expenseDetails}>
                    <View style={styles.detailItem}>
                      <User size={12} color={COLORS.textTertiary} />
                      <Text style={styles.detailText}>Paid by {getMemberName(item.paidBy)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Calendar size={12} color={COLORS.textTertiary} />
                      <Text style={styles.detailText}>{formatDate(item.date)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={styles.amount}>रु {item.amount.toFixed(2)}</Text>
                  <Text style={styles.participants}>
                    Split {item.participants.length} ways
                  </Text>
                </View>
              </View>
              {item.participants.length > 0 && (
                <View style={styles.participantsContainer}>
                  <Text style={styles.participantsLabel}>Participants:</Text>
                  <Text style={styles.participantsList}>
                    {item.participants.map(getMemberName).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        style={styles.expensesList}
        contentContainerStyle={styles.expensesContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.action]} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first expense to start tracking shared costs
            </Text>
            <TouchableOpacity
              style={styles.addFirstExpenseButton}
              onPress={() => router.push({ pathname: '/add-expense-advanced', params: { groupId: id } })}
              accessibilityRole="button"
              accessibilityLabel="Add first expense"
            >
              <Plus size={16} color={COLORS.text} />
              <Text style={styles.addFirstExpenseText}>Add First Expense</Text>
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
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.action,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addExpenseText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.actionText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textTertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.negative,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.negative,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  retryButtonText: {
    color: COLORS.actionText,
    fontSize: 14,
    fontWeight: '600',
  },
  expensesList: {
    flex: 1,
  },
  expensesContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  },
  expenseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  expenseAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  pendingLabel: {
    fontSize: 11,
    color: COLORS.warning,
    marginBottom: 6,
  },
  expenseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.positive,
  },
  participants: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  participantsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  participantsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  participantsList: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 24,
  },
  addFirstExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addFirstExpenseText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
