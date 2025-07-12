import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Receipt, 
  DollarSign, 
  Calendar, 
  User, 
  Filter,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Eye,
  Edit3,
  MoreVertical,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Group, Expense } from '@/types';
import { apiService } from '@/services/api';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium Design System
const COLORS = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  secondary: '#EC4899',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: 'rgba(0, 0, 0, 0.08)',
  glass: 'rgba(255, 255, 255, 0.95)',
  gradient1: ['#7C3AED', '#A78BFA'] as any,
  gradient2: ['#EC4899', '#F472B6'] as any,
  gradient3: ['#06B6D4', '#22D3EE'] as any,
  gradient4: ['#10B981', '#34D399'] as any,
  gradient5: ['#F59E0B', '#FBBF24'] as any,
  gradient6: ['#8B5CF6', '#A78BFA'] as any,
};

export default function TransactionsScreen() {
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

  const fetchData = async () => {
    try {
      const [groupsData, userData] = await Promise.all([
        apiService.getGroups(),
        apiService.getUserProfile()
      ]);
      setGroups(groupsData);
      setUser(userData);
      
      // Get all expenses from all groups
      const allExpensesData: Expense[] = [];
      for (const group of groupsData) {
        const expenses = await apiService.getGroupExpenses(group.id);
        allExpensesData.push(...expenses);
      }
      
      // Sort by date (newest first)
      const sortedExpenses = allExpensesData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setAllExpenses(sortedExpenses);
      setFilteredExpenses(sortedExpenses);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterExpenses();
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
      await apiService.deleteExpense(selectedExpense.id);
      setAllExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
      setFilteredExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
      setSelectedExpense(null);
      setDeleteModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert(error.message || 'Failed to delete expense. Please try again.');
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.name || 'Unknown Group';
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getAverageAmount = () => {
    return filteredExpenses.length > 0 ? getTotalAmount() / filteredExpenses.length : 0;
  };



  const renderExpenseCard = ({ item }: { item: Expense }) => {
    const isPaidByUser = user && item.paidBy === user.name;
    const group = groups.find(g => g.id === item.groupId);
    
    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/group/${item.groupId}/expense/${item.id}`);
        }}
        activeOpacity={0.85}
        style={styles.expenseCard}
      >
        <LinearGradient
          colors={isPaidByUser ? COLORS.gradient4 : COLORS.gradient1}
          style={styles.expenseCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.expenseContent}>
          <View style={styles.expenseLeft}>
            <View style={[styles.expenseIcon, { backgroundColor: isPaidByUser ? `${COLORS.success}20` : `${COLORS.primary}20` }]}>
              {isPaidByUser ? (
                <CheckCircle size={20} color={COLORS.success} />
              ) : (
                <Receipt size={20} color={COLORS.primary} />
              )}
            </View>
            
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseDescription} numberOfLines={1}>
                {item.description}
              </Text>
              <View style={styles.expenseDetails}>
                <View style={styles.detailItem}>
                  <User size={12} color={COLORS.textTertiary} />
                  <Text style={styles.detailText}>{item.paidBy}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Users size={12} color={COLORS.textTertiary} />
                  <Text style={styles.detailText}>{getGroupName(item.groupId)}</Text>
                </View>
              </View>
              <View style={styles.participantsRow}>
                <Text style={styles.participantsLabel}>
                  Split between {item.participants.length} people
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.expenseRight}>
            <Text style={[styles.expenseAmount, { color: isPaidByUser ? COLORS.success : COLORS.primary }]}>
              ₹{item.amount.toFixed(2)}
            </Text>
            <View style={styles.expenseDateTime}>
              <View style={styles.dateTimeItem}>
                <Calendar size={10} color={COLORS.textTertiary} />
                <Text style={styles.dateTimeText}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={styles.dateTimeItem}>
                <Clock size={10} color={COLORS.textTertiary} />
                <Text style={styles.dateTimeText}>{formatTime(item.createdAt)}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.expenseActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/group/${item.groupId}/expense/${item.id}/edit`);
            }}
          >
            <Edit3 size={14} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteActionButton]}
            onPress={() => handleDeleteExpense(item)}
          >
            <Trash2 size={14} color={COLORS.danger} />
            <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
        <LinearGradient
          colors={['#7C3AED', '#8B5CF6']}
          style={styles.statsCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.statsContent}>
          <View style={styles.statsHeader}>
            <View style={styles.statsIconContainer}>
              <DollarSign size={24} color="#fff" />
            </View>
            <View style={styles.statsHeaderText}>
              <Text style={styles.statsTitle}>Total Expenses</Text>
              <Text style={styles.statsSubtitle}>
                {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
                {selectedFilter !== 'all' && ` in the last ${selectedFilter}`}
              </Text>
            </View>
          </View>
          
          <View style={styles.statsAmounts}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total</Text>
              <Text style={styles.amountValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            
            <View style={styles.amountDivider} />
            
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Average</Text>
              <Text style={styles.amountValue}>₹{averageAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Premium Header */}
      <LinearGradient
        colors={COLORS.gradient1}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            activeOpacity={0.8}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Transactions</Text>
            <Text style={styles.headerSubtitle}>Track your shared expenses</Text>
          </View>
          
          <View style={styles.headerIcon}>
            <Receipt size={24} color="#fff" />
          </View>
        </View>
      </LinearGradient>

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
        data={filteredExpenses}
        renderItem={renderExpenseCard}
        keyExtractor={(item) => item.id}
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsContent}
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
              <LinearGradient
                colors={COLORS.gradient1}
                style={styles.addFirstGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.addFirstText}>Add First Expense</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/add-expense-advanced');
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={COLORS.gradient1}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Plus size={28} color="#fff" />
        </LinearGradient>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    height: 160,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  statsCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  statsContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statsHeaderText: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  statsAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  amountLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  amountDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 20,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-SemiBold',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  transactionsList: {
    flex: 1,
  },
  transactionsContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  expenseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  expenseCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  expenseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
  },
  expenseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 2,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  participantsRow: {
    marginTop: 2,
  },
  participantsLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  expenseRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
  },
  expenseDateTime: {
    alignItems: 'flex-end',
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dateTimeText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  expenseActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  deleteActionButton: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'Inter-SemiBold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addFirstGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  addFirstText: {
    color: '#fff',
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