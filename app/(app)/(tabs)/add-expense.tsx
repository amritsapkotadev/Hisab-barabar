import React from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { ExpenseForm } from '@/components/ExpenseForm';
import { useAuth } from '@/hooks/useAuth';
import { createExpense } from '@/services/expenses';
import Layout from '@/constants/layout';

export default function AddExpenseScreen() {
  const { user } = useAuth();

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

  return (
    <View style={styles.container} variant="screen">
      <ExpenseForm
        groupMembers={[]} // You'll need to fetch and pass group members
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});