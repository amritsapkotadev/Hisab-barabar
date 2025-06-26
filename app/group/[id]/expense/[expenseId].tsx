import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Calendar, User, DollarSign } from 'lucide-react-native';
import { Expense } from '@/types';
import { apiService } from '@/services/api';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

export default function ExpenseDetailsScreen() {
  const { id, expenseId } = useLocalSearchParams<{ id: string; expenseId: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setError(null);
        const found = await apiService.getExpenseById(expenseId);
        setExpense(found || null);
      } catch (err) {
        setError('Failed to load expense details.');
      } finally {
        setLoading(false);
      }
    };
    fetchExpense();
  }, [id, expenseId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Expense Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !expense) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Expense Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Expense not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Expense Details</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(expense.paidBy)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.description}>{expense.description}</Text>
            <View style={styles.detailRow}>
              <User size={16} color="#6b7280" />
              <Text style={styles.detailText}>Paid by {expense.paidBy}</Text>
            </View>
            <View style={styles.detailRow}>
              <Calendar size={16} color="#6b7280" />
              <Text style={styles.detailText}>On {formatDate(expense.date)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.amountRow}>
          <DollarSign size={20} color="#059669" />
          <Text style={styles.amount}>${expense.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownPayer}>{expense.paidBy} paid</Text>
            <Text style={styles.breakdownAmount}>${expense.amount.toFixed(2)}</Text>
          </View>
          {expense.participants.map((participant) => (
            <View key={participant} style={styles.breakdownRow}>
              <Text style={styles.breakdownOwes}>{participant === expense.paidBy ? `${participant} (paid)` : `${participant} owes`}</Text>
              <Text style={styles.breakdownOwesAmount}>
                {participant === expense.paidBy
                  ? `-$${(expense.amount - expense.amount / expense.participants.length).toFixed(2)}`
                  : `$${(expense.amount / expense.participants.length).toFixed(2)}`}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.participantsSection}>
          <Text style={styles.participantsLabel}>Participants:</Text>
          <Text style={styles.participantsList}>{expense.participants.join(', ')}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push({
          pathname: '/add-expense/[groupId]',
          params: {
            groupId: id,
            edit: 'true',
            expenseId: expense.id,
            description: expense.description,
            amount: expense.amount.toString(),
            paidBy: expense.paidBy,
            participants: JSON.stringify(expense.participants),
            date: expense.date,
          }
        })}
      >
        <Text style={styles.editButtonText}>Edit Expense</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F3F4F6',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F87171',
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1F2937',
    margin: 20,
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  description: {
    fontSize: 19,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 15,
    color: '#9CA3AF',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 14,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: 10,
    padding: 10,
    alignSelf: 'flex-start',
  },
  amount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#A78BFA',
    marginLeft: 8,
  },
  participantsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
  },
  participantsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
    marginBottom: 4,
  },
  participantsList: {
    fontSize: 15,
    color: '#F3F4F6',
    lineHeight: 20,
  },
  breakdownSection: {
    marginTop: 18,
    marginBottom: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 2,
  },
  breakdownPayer: {
    fontSize: 15,
    color: '#22C55E',
    fontWeight: '700',
  },
  breakdownAmount: {
    fontSize: 15,
    color: '#22C55E',
    fontWeight: '700',
  },
  breakdownOwes: {
    fontSize: 15,
    color: '#F3F4F6',
  },
  breakdownOwesAmount: {
    fontSize: 15,
    color: '#F87171',
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 18,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.2,
  },
}); 