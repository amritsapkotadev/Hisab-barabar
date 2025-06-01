import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { ExpenseListItem } from '@/components/ExpenseListItem';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getExpenses } from '@/services/expenses';
import { getGroups } from '@/services/groups';
import { ExpenseWithDetails, Group } from '@/types';
import { Plus, Search, Filter } from 'lucide-react-native';
import Layout from '@/constants/layout';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseWithDetails[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user } = useAuth();
  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');
  const backgroundColor = useThemeColor('background');

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    filterExpenses();
  }, [searchQuery, selectedGroup, expenses]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load groups
      const { data: groupsData } = await getGroups(user.id);
      if (groupsData) {
        setGroups(groupsData);
      }

      // Load expenses from all groups
      const allExpenses: ExpenseWithDetails[] = [];
      for (const group of groupsData || []) {
        const { data: expensesData } = await getExpenses(group.id);
        if (expensesData) {
          allExpenses.push(...expensesData);
        }
      }

      // Sort expenses by date (most recent first)
      allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    if (searchQuery) {
      filtered = filtered.filter(expense =>
        expense.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGroup) {
      filtered = filtered.filter(expense => expense.group_id === selectedGroup);
    }

    setFilteredExpenses(filtered);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loading]} variant="screen">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View style={styles.container} variant="screen">
      <View style={styles.header}>
        <Text variant="heading1">Expenses</Text>
        <Text variant="body" style={{ color: textSecondaryColor }}>
          Track and manage your shared expenses
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search expenses"
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={textSecondaryColor} />}
          style={styles.searchInput}
        />

        <Button
          title="Filter"
          variant="outline"
          leftIcon={<Filter size={20} color={primaryColor} />}
          style={styles.filterButton}
          onPress={() => {/* TODO: Show filter modal */}}
        />
      </View>

      <View style={styles.content}>
        {filteredExpenses.length > 0 ? (
          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExpenseListItem
                expense={item}
                onPress={() => router.push({
                  pathname: '/(app)/expense/[id]',
                  params: { id: item.id }
                })}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={primaryColor}
                colors={[primaryColor]}
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Text variant="heading3" style={{ textAlign: 'center', marginBottom: 12 }}>
              {searchQuery ? 'No Matching Expenses' : 'No Expenses Yet'}
            </Text>
            <Text style={{ textAlign: 'center', color: textSecondaryColor, marginBottom: 24 }}>
              {searchQuery
                ? 'Try a different search term'
                : 'Add your first expense to start tracking'}
            </Text>
            {!searchQuery && (
              <Button
                title="Add Expense"
                onPress={() => router.push('/create-expense')}
                leftIcon={<Plus size={20} color="#FFFFFF" />}
              />
            )}
          </View>
        )}
      </View>

      <Button
        title="Add Expense"
        onPress={() => router.push('/create-expense')}
        leftIcon={<Plus size={20} color="#FFFFFF" />}
        style={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.l,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.m,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  searchInput: {
    flex: 1,
    marginRight: Layout.spacing.s,
  },
  filterButton: {
    width: 100,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Layout.spacing.xl + 60, // Extra padding for FAB
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: Layout.spacing.l,
    bottom: Layout.spacing.l,
    borderRadius: Layout.borderRadius.circle,
    paddingHorizontal: Layout.spacing.l,
  },
});