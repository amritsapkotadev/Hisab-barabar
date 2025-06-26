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
  Trash2
} from 'lucide-react-native';
import { Group, Expense } from '@/types';
import { apiService } from '@/services/api';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
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

  const fetchData = async () => {
    try {
      const groupsData = await apiService.getGroups();
      setGroups(groupsData);
      
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
    } catch (error: any) {
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

  const renderExpenseCard = ({ item }: { item: Expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseContent}>
        <View style={styles.expenseIcon}>
          <User size={22} color="#2563eb" />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <View style={styles.expenseDetails}>
            <View style={styles.detailItem}>
              <User size={12} color="#6b7280" />
              <Text style={styles.detailText}>Paid by {item.paidBy}</Text>
            </View>
            <View style={styles.detailItem}>
              <Receipt size={12} color="#6b7280" />
              <Text style={styles.detailText}>{getGroupName(item.groupId)}</Text>
            </View>
          </View>
          <View style={styles.participantsRow}>
            <Text style={styles.participantsLabel}>
              Split between {item.participants.length} people
            </Text>
          </View>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
          <Text style={styles.expenseDate}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.expenseTime}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.expenseActions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteExpense(item)}
        >
          <Trash2 size={14} color="#dc2626" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilterButton = (filter: 'all' | 'week' | 'month', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.activeFilterButton,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.activeFilterButtonText,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Transactions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconRow}>
          <DollarSign size={28} color="#2563eb" style={{ marginRight: 8 }} />
          <Text style={styles.summaryLabel}>Total Expenses</Text>
        </View>
        <Text style={styles.summaryAmount}>${getTotalAmount().toFixed(2)}</Text>
        <Text style={styles.summarySubtext}>
          {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
          {selectedFilter !== 'all' && ` in the last ${selectedFilter}`}
        </Text>
      </View>

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Receipt size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyDescription}>
              {selectedFilter === 'all' 
                ? 'Start adding expenses to see them here'
                : `No transactions found for the selected time period`
              }
            </Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => router.push('/add-expense-advanced')}
            >
              <Plus size={16} color="#2563eb" />
              <Text style={styles.addFirstText}>Add First Expense</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-expense-advanced')}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#fff" />
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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 18,
    padding: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '700',
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeFilterButton: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  transactionsList: {
    flex: 1,
  },
  transactionsContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  expenseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e7ef',
  },
  expenseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 10,
  },
  expenseDescription: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  expenseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
    marginBottom: 2,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  participantsRow: {
    marginTop: 2,
  },
  participantsLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  expenseRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  expenseAmount: {
    fontSize: 19,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 1,
  },
  expenseTime: {
    fontSize: 10,
    color: '#9ca3af',
  },
  expenseActions: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'flex-end',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#2563eb',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addFirstText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});