import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { ExpenseForm } from '@/components/ExpenseForm';
import { useAuth } from '@/hooks/useAuth';
import { createExpense } from '@/services/expenses';
import { getGroups } from '@/services/groups';
import Layout from '@/constants/layout';

export default function AddExpenseScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await getGroups(user.id);
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!user) return;

    try {
      const { error } = await createExpense(
        data.groupId,
        data.title,
        data.amount,
        user.id,
        new Date(),
        data.splits
      );

      if (error) throw error;
      router.back();
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} variant="screen">
      <ExpenseForm
        groups={groups}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.l,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});