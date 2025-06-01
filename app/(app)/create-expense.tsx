import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { createExpense, ExpenseSplit } from '@/services/expenses';
import { Receipt, DollarSign } from 'lucide-react-native';
import Layout from '@/constants/layout';

export default function CreateExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const handleCreateExpense = async () => {
    if (!user || !groupId) return;
    if (!title.trim() || !amount) {
      setError('Title and amount are required');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      // For simplicity, creating a basic split where the creator pays everything
      const basicSplit: ExpenseSplit[] = [{
        userId: user.id,
        paidAmount: numAmount,
        owedAmount: numAmount
      }];

      const { error } = await createExpense(
        groupId,
        title.trim(),
        numAmount,
        user.id,
        new Date(),
        basicSplit
      );

      if (error) throw error;
      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container} variant="screen">
      <Text variant="heading1" style={styles.title}>Add New Expense</Text>
      <Text style={styles.subtitle}>
        Add a new expense to your group
      </Text>

      <View style={styles.form}>
        <TextInput
          label="Title"
          placeholder="Enter expense title"
          value={title}
          onChangeText={setTitle}
          error={error}
          leftIcon={<Receipt size={20} color="#6B7280" />}
        />

        <TextInput
          label="Amount"
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          leftIcon={<DollarSign size={20} color="#6B7280" />}
        />

        <Button
          title="Add Expense"
          onPress={handleCreateExpense}
          isLoading={isLoading}
          style={styles.button}
        />
      </View>
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
    marginBottom: Layout.spacing.s,
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: Layout.spacing.xl,
  },
  form: {
    flex: 1,
  },
  button: {
    marginTop: Layout.spacing.l,
  },
});