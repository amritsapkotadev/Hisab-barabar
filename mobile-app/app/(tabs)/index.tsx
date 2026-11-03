import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useServerRefresh } from '@/hooks/useServerRefresh';
import { useExpensePages } from '@/hooks/useExpensePages';
import { useNotificationInbox } from '@/hooks/useNotificationInbox';
import { refreshServerData } from '@/services/dataClient';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { TouchableOpacity as SwipeButton } from 'react-native-gesture-handler';
import { Plus, Users, FileText, RefreshCw, AlertCircle, Wallet, ChevronRight, Edit3, Trash2, Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiService } from '@/services/api';
import { useToast } from '@/components/Toast';
import type { Group, Expense } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import BudgetGauge from '@/components/BudgetGauge';
import AnimatedAmount from '@/components/AnimatedAmount';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { CATEGORY_COLORS, CATEGORY_ICONS, PAYMENT_COLORS, PAYMENT_ICONS } from '@/constants/categories';
import { Ionicons } from '@expo/vector-icons';

const PERSONAL_PAGE_SIZE = 7;


const TIME_THEMES = {
  morning: {
    greeting: 'Good morning',
    subtext: 'A fresh start for your finances',
  },
  afternoon: {
    greeting: 'Good afternoon',
    subtext: 'Keep your spending on track',
  },
  evening: {
    greeting: 'Good evening',
    subtext: "Time to review today's spending",
  },
  night: {
    greeting: 'Good night',
    subtext: 'Your books are resting easy',
  },
} as const;

function getTimeKey(hour: number): keyof typeof TIME_THEMES {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

// Balances are keyed by each member's stable group-scoped id, not their
// name (two members, or two different accounts, can share a display name).
function getNetBalance(groups: Group[], userId: string) {
  let net = 0;
  groups.forEach(g => {
    const member = g.members?.find(m => m.userId === userId);
    if (member && g.balances && g.balances[member.id]) net += g.balances[member.id];
  });
  return net;
}

// Inter has no Devanagari glyphs, so the रु symbol uses Noto Sans Devanagari
// (a matching sans-serif at the same weight) instead of the system fallback.
function CurrencyAmount({ value }: { value: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.balanceAmountRow}>
      <Text style={styles.balanceCurrency}>रु</Text>
      <AnimatedAmount
        value={value}
        style={styles.balanceValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      />
    </View>
  );
}

const formatMoney = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function HomeScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const { user } = useAuth();
  const notifications = useNotificationInbox(user?.id);
  useEffect(() => {
    if (notifications.error) toast.error(`Notification count unavailable: ${notifications.error}`);
  }, [notifications.error, toast]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [activeTab, setActiveTab] = useState<'personal' | 'shared'>('personal');
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const [toggleWidth, setToggleWidth] = useState(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const inputRef = useRef<TextInput>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const fetchPersonalPage = useCallback((page: number) =>
    apiService.getPersonalExpensePage({ limit: PERSONAL_PAGE_SIZE, page }), []);
  const personal = useExpensePages(fetchPersonalPage);
  const perExpenses = personal.expenses;
  const personalExpenseCount = personal.page?.summary.count ?? 0;
  const spentThisMonth = personal.page?.summary.monthlySpent ?? 0;
  const personalBudget = personal.page?.budget ?? 0;
  const refreshPersonal = personal.refresh;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'personal') {
        await refreshPersonal();
      } else {
        const [groupsRes, expensesRes] = await Promise.all([
          apiService.getGroups(),
          apiService.getExpensePage({ limit: 5, page: 1, type: 'group' }),
        ]);
        setGroups(groupsRes);
        setExpenses(expensesRes.data);
      }
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
  }, [activeTab, fadeAnim, refreshPersonal]);

  useServerRefresh(fetchAll, activeTab);

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: activeTab === 'personal' ? 0 : 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshServerData(false);
    await fetchAll();
  };

  const handleSetBudget = async () => {
    const budget = Number(budgetInput);
    if (!budgetInput.trim() || !Number.isFinite(budget) || budget < 0) {
      toast.error('Enter a valid budget of zero or more.');
      return;
    }
    try {
      const res = await apiService.setPersonalBudget(budget);
      if (!res.success) throw new Error(res.message || 'Failed to update budget');
      setShowBudgetModal(false);
      setBudgetInput('');
      await refreshPersonal();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : 'Failed to update budget');
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    try {
      await apiService.deletePersonalExpense(selectedExpense.id, selectedExpense.revision);
      await fetchAll();
      setSelectedExpense(null);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'OFFLINE_QUEUED') {
        setDeleteModalVisible(false);
        toast.info('Delete saved locally, pending sync. The expense remains confirmed until sync completes.');
        router.push('/profile/offline-sync');
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Failed to delete expense. Please try again later.');
    } finally {
      setDeleteModalVisible(false);
    }
  };

  const now = new Date();
  const leftThisMonth = Math.max(0, personalBudget - spentThisMonth);
  const isOverBudget = personalBudget > 0 && spentThisMonth > personalBudget;

  const timeTheme = TIME_THEMES[getTimeKey(now.getHours())];
  const weekdayLabel = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  const renderAppBar = () => (
    <View style={styles.appBar}>
      <View style={styles.appBarTopRow}>
        <View style={styles.dateRow}>
          <Text style={styles.greetingWeekday}>{weekdayLabel}</Text>
          <Text style={styles.greetingMonthDay}>{dateLabel}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={notifications.error ? 'Notifications, unread count unavailable'
            : notifications.unreadCount ? `Notifications, ${notifications.unreadCount} unread` : 'Notifications'}
        >
          <Bell size={20} color={COLORS.text} />
          {(notifications.error || !!notifications.unreadCount) && (
            <View style={styles.notificationBadge} pointerEvents="none">
              <Text style={styles.notificationBadgeText}>
                {notifications.error ? '?' : (notifications.unreadCount ?? 0) > 99 ? '99+' : notifications.unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.greetingHeading} numberOfLines={1}>
        {timeTheme.greeting}, {user ? user.name.split(' ')[0] : 'User'}
      </Text>
      <Text style={styles.greetingSubtext}>{timeTheme.subtext}</Text>
    </View>
  );

  const renderNetBalanceCard = () => {
    const net = user ? getNetBalance(groups, user.id) : 0;
    const roundedNet = Number(net.toFixed(2));
    const balanceStatus =
      roundedNet === 0
        ? { text: 'All settled up', color: COLORS.muted }
        : roundedNet > 0
          ? { text: 'You are owed', color: COLORS.positive }
          : { text: 'You owe', color: COLORS.negative };
    return (
      <View style={styles.balanceCard}>
        <View style={styles.balanceContent}>
          <View style={styles.balanceTextBlock}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceTitle}>Net Balance</Text>
            </View>
            <CurrencyAmount value={Math.abs(roundedNet).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} />
            <Text style={[styles.balanceStatus, { color: balanceStatus.color }]}>
              {balanceStatus.text}
            </Text>
          </View>
          <View style={styles.balanceIconCircle}>
            <Wallet size={24} color={COLORS.text} />
          </View>
        </View>
      </View>
    );
  };

  const renderGroupCard = ({ item }: { item: Group }) => {
    const memberCount = item.members.length;

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => router.push(`/group/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.groupCardInner}>
          <View style={styles.groupIcon}>
            <Users size={18} color={COLORS.textSecondary} />
          </View>
          <View style={styles.groupText}>
            <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.groupMembers}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>
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
        <View style={styles.groupsContainer}>
          {groups.slice(0, 5).map((group) => (
            <React.Fragment key={group.id}>
              {renderGroupCard({ item: group })}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const group = groups.find((g) => g.id === item.groupId);
    // Group expenses key paidBy by the member's stable group-scoped id;
    // personal expenses still store a plain display name.
    const myMemberId = group?.members.find((m) => m.userId === user?.id)?.id;
    const isPositive = user && (group ? item.paidBy === myMemberId : item.paidBy === user.name);

    return (
      <View style={styles.expenseCard}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => router.push(`/group/${item.groupId}`)}
          activeOpacity={0.85}
        >
          <View style={styles.expenseCardInner}>
            <View style={[styles.expenseIcon, { backgroundColor: isPositive ? COLORS.positive + '14' : COLORS.negative + '14' }]}>
              <FileText size={16} color={isPositive ? COLORS.positive : COLORS.negative} />
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseTitle} numberOfLines={1}>{item.description}</Text>
              <Text style={styles.expenseGroup} numberOfLines={1}>
                {group ? group.name : 'Unknown Group'}
              </Text>
            </View>
            <View style={styles.expenseAmountContainer}>
              <Text
                style={[styles.expenseAmount, { color: isPositive ? COLORS.positive : COLORS.negative }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                रु {item.amount.toFixed(2)}
              </Text>
              <Text style={styles.expenseDate}>
                {new Date(item.date || item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPersonalExpenses = () => {
    const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const dayLabel = (d: Date) => {
      if (dayKey(d) === dayKey(today)) return 'Today';
      if (dayKey(d) === dayKey(yesterday)) return 'Yesterday';
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        ...(d.getFullYear() !== today.getFullYear() && { year: 'numeric' as const }),
      });
    };

    const days: { key: string; label: string; total: number; items: Expense[] }[] = [];
    [...perExpenses]
      .sort((a, b) => +new Date(b.date || b.createdAt) - +new Date(a.date || a.createdAt))
      .forEach((e) => {
        const d = new Date(e.date || e.createdAt);
        const key = dayKey(d);
        let day = days.find((x) => x.key === key);
        if (!day) {
          day = { key, label: dayLabel(d), total: 0, items: [] };
          days.push(day);
        }
        day.total += e.amount;
        day.items.push(e);
      });

    const money = (n: number) => {
      const [whole, dec] = n.toFixed(2).split('.');
      return { whole: Number(whole).toLocaleString('en-IN'), dec };
    };

    return (
      <View style={styles.personalList}>
        {days.map((day, dayIndex) => (
          <View key={day.key}>
            <View style={[styles.dayHeader, dayIndex > 0 && styles.dayHeaderSpaced]}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              {day.items.length > 1 && (
                <Text style={styles.dayTotal}>रु {money(day.total).whole}</Text>
              )}
            </View>
            <View style={styles.dayCard}>
              {day.items.map((item, i) => {
                const amt = money(item.amount);
                return (
                  <Swipeable
                    key={item.id}
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
                        accessibilityLabel="Edit personal expense"
                        onPress={() => {
                          methods.close();
                          router.push({ pathname: '/add-personal-expense', params: {
                            expenseId: item.id,
                            amount: item.amount,
                            description: item.description,
                            date: item.date,
                            category: item.category,
                            paymentMethod: item.paymentMethod,
                            revision: item.revision,
                          } });
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
                        accessibilityLabel="Delete expense"
                        onPress={() => {
                          methods.close();
                          setSelectedExpense(item);
                          setDeleteModalVisible(true);
                        }}
                      >
                        <Trash2 size={18} color={COLORS.actionText} />
                      </SwipeButton>
                    )}
                  >
                    <View style={[styles.personalRow, i > 0 && styles.personalRowDivider]}>
                      <View style={styles.personalInfo}>
                        <Text style={styles.personalTitle}>{item.description}</Text>
                        {(!!item.category || !!item.paymentMethod) && (
                          <View style={styles.personalMeta}>
                            {!!item.category && (
                              <View style={styles.personalMetaItem}>
                                <Ionicons
                                  name={CATEGORY_ICONS[item.category] || 'pricetag'}
                                  size={15}
                                  color={CATEGORY_COLORS[item.category] || COLORS.textTertiary}
                                />
                                <Text style={styles.personalMetaText} numberOfLines={1}>{item.category}</Text>
                              </View>
                            )}
                            {!!item.paymentMethod && (
                              <View style={styles.personalMetaItem}>
                                <Ionicons
                                  name={PAYMENT_ICONS[item.paymentMethod] || 'cash'}
                                  size={15}
                                  color={PAYMENT_COLORS[item.paymentMethod] || COLORS.textTertiary}
                                />
                                <Text style={styles.personalMetaText} numberOfLines={1}>{item.paymentMethod}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                      <Text style={styles.personalAmount} numberOfLines={1} adjustsFontSizeToFit>
                        रु {amt.whole}
                        <Text style={styles.personalDecimals}>.{amt.dec}</Text>
                      </Text>
                    </View>
                  </Swipeable>
                );
              })}
            </View>
          </View>
        ))}
        {personal.page?.pageInfo.hasMore && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={personal.loadMore}
            activeOpacity={0.8}
            disabled={personal.loadingMore}
            accessibilityRole="button"
            accessibilityLabel="Load more personal expenses"
          >
            {personal.loadingMore ? (
              <ActivityIndicator size="small" color={COLORS.actionText} />
            ) : (
              <Text style={styles.showMoreText}>Load more</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRecentExpenses = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity
          // Inset by the card's inner padding (16) so "See All" lines up with the amounts.
          // The chevron glyph has ~5px of built-in right whitespace, so offset it.
          style={[styles.seeAllButton, { marginRight: 16 - 5 }]}
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
        <View style={styles.expensesContainer}>
          {expenses.slice(0, 5).map((expense) => (
            <React.Fragment key={expense.id}>
              {renderExpenseItem({ item: expense })}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );

  const renderToggle = () => {
    const segmentWidth = toggleWidth / 2;

    return (
      <View style={styles.toggleContainer}>
        <View
          style={styles.toggleTrack}
          onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[
              styles.toggleSlider,
              {
                width: segmentWidth,
                transform: [{
                  translateX: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, segmentWidth]
                  })
                }]
              }
            ]}
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setActiveTab('personal')}
          >
            <Text style={[
              styles.toggleText,
              activeTab === 'personal' && styles.toggleTextActive
            ]}>Personal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setActiveTab('shared')}
          >
            <Text style={[
              styles.toggleText,
              activeTab === 'shared' && styles.toggleTextActive
            ]}>Shared</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.action} />
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
          <RefreshCw size={18} color={COLORS.actionText} />
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
        {renderToggle()}
        
        {activeTab === 'personal' ? (
          <>
            <View style={styles.budgetCard}>
              <View style={styles.budgetLeft}>
                <View style={styles.budgetLabelRow}>
                  <Text style={styles.budgetLabel}>Monthly Budget</Text>
                </View>
                <View style={styles.budgetAmountRow}>
                  <Text style={styles.budgetCurrency}>रु</Text>
                  <AnimatedAmount
                    value={formatMoney(personalBudget)}
                    style={styles.budgetAmount}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  />
                  <TouchableOpacity
                    style={styles.budgetEditButton}
                    onPress={() => {
                      setBudgetInput(String(personalBudget));
                      setShowBudgetModal(true);
                      setTimeout(() => inputRef.current?.focus(), 200);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Edit monthly budget"
                  >
                    <Edit3 size={13} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.budgetStats}>
                  <View style={styles.budgetStatRow}>
                    <View style={[styles.budgetDot, { backgroundColor: COLORS.negative }]} />
                    <Text style={styles.budgetStatLabel}>Spent</Text>
                    <AnimatedAmount
                      value={formatMoney(spentThisMonth)}
                      prefix="रु "
                      style={styles.budgetStatValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    />
                  </View>
                  <View style={styles.budgetStatRow}>
                    <View style={[styles.budgetDot, { backgroundColor: isOverBudget ? COLORS.negative : COLORS.positive }]} />
                    <Text style={styles.budgetStatLabel}>{isOverBudget ? 'Over by' : 'Left'}</Text>
                    <AnimatedAmount
                      value={formatMoney(isOverBudget ? spentThisMonth - personalBudget : leftThisMonth)}
                      prefix="रु "
                      style={[styles.budgetStatValue, isOverBudget && { color: COLORS.negative }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    />
                  </View>
                </View>
              </View>

              <View style={styles.budgetDivider} />

              <View style={styles.budgetRight}>
                <BudgetGauge
                  size={112}
                  used={personalBudget > 0 ? spentThisMonth / personalBudget : 0}
                  hasBudget={personalBudget > 0}
                />
              </View>
            </View>
            
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Personal Expenses</Text>
                  {personalExpenseCount > 0 && (
                    <Text style={styles.sectionCount}>{personalExpenseCount}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.editBudgetButton}
                  onPress={() => router.push('/add-personal-expense')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Add personal expense"
                >
                  <Plus size={16} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              {personal.error && <Text style={{ color: COLORS.negative }}>{personal.error}</Text>}
              {!personal.online && <Text style={{ color: COLORS.textSecondary }}>Showing downloaded expenses. More may require internet.</Text>}
              {perExpenses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No personal expenses yet</Text>
                  <Text style={styles.emptySubtext}>Add a personal expense to see it here</Text>
                </View>
              ) : (
                renderPersonalExpenses()
              )}
            </View>
            <Modal
              visible={showBudgetModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowBudgetModal(false)}
            >
              <KeyboardAvoidingView style={styles.budgetModalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.budgetModalContent}>
                  <Text style={styles.budgetModalTitle}>Set Monthly Budget</Text>
                  <TextInput
                    ref={inputRef}
                    style={styles.budgetInput}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    placeholderTextColor={COLORS.textTertiary}
                    value={budgetInput}
                    onChangeText={setBudgetInput}
                    onSubmitEditing={handleSetBudget}
                  />
                  <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
                    <TouchableOpacity
                      style={[styles.budgetModalBtn, { backgroundColor: COLORS.surfaceSecondary, borderWidth: 1, borderColor: COLORS.border }]}
                      onPress={() => setShowBudgetModal(false)}
                    >
                      <Text style={[styles.budgetModalBtnText, { color: COLORS.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.budgetModalBtn, { backgroundColor: COLORS.action }]}
                      onPress={handleSetBudget}
                    >
                      <Text style={styles.budgetModalBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          </>
        ) : (
          <>
            {renderNetBalanceCard()}
            {renderGroupsSection()}
            {renderRecentExpenses()}
          </>
        )}
      </Animated.ScrollView>
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this personal expense?"
        confirmText="Delete"
        isDangerous
      />
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
    paddingTop: 24,
  },
  appBarTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute', top: -5, right: -7, minWidth: 20, height: 20,
    paddingHorizontal: 4, borderRadius: 10, backgroundColor: COLORS.action,
    borderWidth: 2, borderColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },
  notificationBadgeText: { fontSize: 10, fontFamily: 'Inter-SemiBold', color: COLORS.actionText },
  greetingHeading: {
    flexShrink: 1,
    fontSize: 28,
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: 6,
  },
  greetingSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  greetingWeekday: {
    fontSize: 10,
    color: COLORS.muted,
    fontFamily: 'Inter-Medium',
    letterSpacing: 1.4,
  },
  greetingMonthDay: {
    fontSize: 14,
    color: COLORS.muted,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.3,
  },
  toggleContainer: {
    marginTop: 18,
    marginBottom: 18,
    marginHorizontal: 24,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 4,
  },
  toggleTrack: {
    flexDirection: 'row',
    height: 36,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    zIndex: 2,
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    zIndex: 3,
  },
  toggleTextActive: {
    color: COLORS.actionText,
  },
  toggleSlider: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 36,
    backgroundColor: COLORS.action,
    borderRadius: 18,
    zIndex: 1,
  },
  balanceCard: {
    marginHorizontal: 24,
    marginBottom: 18,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  balanceContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceTextBlock: {
    flex: 1,
  },
  balanceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: 16,
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  balanceValue: {
    flexShrink: 1,
    fontSize: 28,
    lineHeight: 36,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.6,
    color: COLORS.text,
    includeFontPadding: false,
  },
  balanceCurrency: {
    fontFamily: 'NotoSansDevanagari-Bold',
    fontSize: 18,
    lineHeight: 24,
    marginTop: 4,
    color: COLORS.textSecondary,
    includeFontPadding: false,
  },
  balanceStatus: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
    color: COLORS.subtext,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: 'Inter-ExtraBold',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Inter-SemiBold',
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
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
    paddingHorizontal: 24,
    marginBottom: -10, // cancels the last card's bottom margin so section gaps stay uniform
  },
  groupCard: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  groupCardInner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupText: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  groupMembers: {
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  expensesContainer: {
    paddingHorizontal: 24,
    marginBottom: -10,
  },
  expenseCard: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseCardInner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalList: {
    paddingHorizontal: 24,
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
    marginTop: 18,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.actionText,
    fontFamily: 'Inter-SemiBold',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  dayHeaderSpaced: {
    marginTop: 18,
  },
  dayLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.muted,
    fontFamily: 'Inter-SemiBold',
  },
  dayTotal: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Inter-SemiBold',
    fontVariant: ['tabular-nums'],
  },
  dayCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  personalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
  },
  personalRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderLight,
  },
  personalInfo: {
    flex: 1,
  },
  personalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 12,
    rowGap: 2,
    marginTop: 4,
  },
  personalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  personalMetaText: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Inter-Medium',
  },
  personalTitle: {
    fontSize: 15,
    letterSpacing: -0.2,
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  personalAmount: {
    marginLeft: 12,
    maxWidth: '45%',
    fontSize: 16,
    letterSpacing: -0.3,
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    fontVariant: ['tabular-nums'],
  },
  personalDecimals: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Medium',
  },
  swipeAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionContainer: {
    width: 72,
    flexShrink: 0,
    alignSelf: 'stretch',
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
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Inter-Regular',
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '45%',
    marginLeft: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 11,
    color: COLORS.muted,
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
    backgroundColor: COLORS.card,
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
    backgroundColor: COLORS.action,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 24,
    gap: 8,
  },
  retryText: {
    color: COLORS.actionText,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 18,
    padding: 20,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  budgetLeft: {
    flex: 1,
    minWidth: 0,
  },
  budgetLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.muted,
    fontFamily: 'Inter-SemiBold',
  },
  budgetAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetEditButton: {
    width: 24,
    height: 24,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetAmount: {
    flexShrink: 1,
    fontSize: 28,
    letterSpacing: -0.6,
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  budgetCurrency: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginRight: 4,
    fontSize: 16,
    lineHeight: 22,
    includeFontPadding: false,
    color: COLORS.textSecondary,
    fontFamily: 'NotoSansDevanagari-Bold',
  },
  budgetStats: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderLight,
    gap: 8,
  },
  budgetStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  budgetStatLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Inter-Medium',
  },
  budgetStatValue: {
    maxWidth: '65%',
    fontSize: 14,
    letterSpacing: -0.2,
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  budgetDivider: {
    alignSelf: 'stretch',
    width: StyleSheet.hairlineWidth,
    marginLeft: 16,
    marginRight: 8,
    backgroundColor: COLORS.border,
  },
  budgetRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBudgetButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
  },
  budgetModalContent: {
    width: '85%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  budgetModalTitle: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  budgetInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 18,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  budgetModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  budgetModalBtnText: {
    color: COLORS.actionText,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});