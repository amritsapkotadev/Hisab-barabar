import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView,TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { createExpense } from '@/services/expenses';
import { getGroups } from '@/services/groups';
import { Receipt, DollarSign, Users, Percent } from 'lucide-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AddExpenseScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [splitMethod, setSplitMethod] = useState('equal');
  const [splits, setSplits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      const { data } = await getGroups(user?.id);
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      setError('Failed to load groups');
    }
  };

  const handleCreateExpense = async () => {
    if (!user || !selectedGroup) {
      setError('Please select a group');
      return;
    }
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
      const basicSplit = [{
        userId: user.id,
        paidAmount: numAmount,
        owedAmount: numAmount / (selectedGroup.members?.length || 1)
      }];

      const { error: expenseError } = await createExpense(
        selectedGroup.id,
        title.trim(),
        numAmount,
        user.id,
        new Date(),
        basicSplit
      );

      if (expenseError) throw expenseError;
      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="heading1" style={styles.title}>Add New Expense</Text>

      <Card style={styles.section}>
        <TextInput
          label="Title"
          placeholder="Enter expense title"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            setError('');
          }}
          leftIcon={<Receipt size={20} color={textSecondaryColor} />}
        />

        <TextInput
          label="Amount"
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          leftIcon={<DollarSign size={20} color={textSecondaryColor} />}
        />

        <Text variant="heading3" style={styles.sectionTitle}>Select Group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupList}>
          {groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              onPress={() => setSelectedGroup(group)}
              style={[
                styles.groupCard,
                selectedGroup?.id === group.id && { borderColor: primaryColor }
              ]}
            >
              <Users size={24} color={primaryColor} />
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.memberCount}>
                {group.memberCount} members
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      <Card style={styles.section}>
        <Text variant="heading3" style={styles.sectionTitle}>Split Method</Text>
        <View style={styles.splitMethods}>
          {['equal', 'percentage', 'custom'].map((method) => (
            <TouchableOpacity
              key={method}
              onPress={() => setSplitMethod(method)}
              style={[
                styles.splitMethodButton,
                splitMethod === method && { backgroundColor: primaryColor }
              ]}
            >
              <Text
                style={[
                  styles.splitMethodText,
                  splitMethod === method && { color: '#FFFFFF' }
                ]}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      <Button
        title="Add Expense"
        onPress={handleCreateExpense}
        isLoading={isLoading}
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginTop: 48,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 16,
  },
  groupList: {
    flexGrow: 0,
    marginTop: 8,
  },
  groupCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  groupName: {
    marginTop: 8,
    fontWeight: '600',
  },
  memberCount: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  splitMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  splitMethodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  splitMethodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  error: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    marginBottom: 32,
  },
});