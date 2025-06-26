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
        style={{
          backgroundColor: '#2563eb',
          padding: 14,
          borderRadius: 8,
          alignItems: 'center',
          marginHorizontal: 20,
          marginTop: 10,
        }}
        onPress={() => router.push({
          pathname: `/add-expense/${id}`,
          params: {
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
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Edit Expense</Text>
      </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
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
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
  },
  description: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 8,
  },
  participantsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  participantsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  participantsList: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
  },
  breakdownSection: {
    marginTop: 18,
    marginBottom: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownPayer: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  breakdownAmount: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  breakdownOwes: {
    fontSize: 14,
    color: '#374151',
  },
  breakdownOwesAmount: {
    fontSize: 14,
    color: '#ef4444',
  },
}); 