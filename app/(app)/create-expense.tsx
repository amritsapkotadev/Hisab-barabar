import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { createExpense } from '@/services/expenses';
import { Receipt, DollarSign } from 'lucide-react-native';
import Layout from '@/constants/layout';

export default function CreateExpenseScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const handleCreateExpense = async () => {
    if (!user) return;
    if (!title.trim() || !amount) {
      setError('Title and amount are required');
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll use a dummy group ID. In a real app, this would be passed as a parameter
      const dummyGroupId = 'your-group-id';
      const { error } = await createExpense(
        dummyGroupId,
        title,
        parseFloat(amount),
        user.id,
        new Date().toISOString(),
        null,
        description,
        [{ userId: user.id, amount: parseFloat(amount), splitMode: 'equal' }]
      );
      if (error) throw error;
      router.replace('/(app)/(tabs)/expenses');
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
        Add a new expense to track and split with your group
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

        <TextInput
          label="Description (Optional)"
          placeholder="Enter expense description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
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