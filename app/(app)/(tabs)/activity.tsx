import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { ExpenseListItem } from '@/components/ExpenseListItem';
import { useAuth } from '@/hooks/useAuth';
import { getExpenses } from '@/services/expenses';
import { Expense, User } from '@/types';
import Layout from '@/constants/layout';

export default function ActivityScreen() {
  const [expenses, setExpenses] = useState<(Expense & { paidBy: User })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadExpenses();
  }, [user]);

  const loadExpenses = async () => {
    if (!user) return;

    try {
      const { data, error } = await getExpenses(user.id);
      if (error) throw error;

      if (data) {
        // Transform the data to match the expected type
        const transformedExpenses = data.map(expense => ({
          ...expense,
          paidBy: {
            id: expense.created_by,
            name: 'User', // This will be populated from the joined users table
            email: '',
            phone: null,
            created_at: ''
          }
        }));
        setExpenses(transformedExpenses);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container} variant="screen">
      <Text variant="heading1" style={styles.title}>Activity</Text>
      
      {isLoading ? (
        <View style={styles.centered}>
          <Text>Loading expenses...</Text>
        </View>
      ) : expenses.length > 0 ? (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseListItem
              expense={item}
              onPress={() => {
                // Handle expense press
              }}
            />
          )}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.centered}>
          <Text>No expenses found</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.l,
  },
  title: {
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.l,
  },
  list: {
    paddingBottom: Layout.spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});