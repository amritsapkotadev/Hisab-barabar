import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Calendar, User, DollarSign, Edit3, Users, PieChart } from 'lucide-react-native';
import { Expense } from '@/types';
import { apiService } from '@/services/api';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

const Avatar = ({ name, isPayer = false }: { name: string; isPayer?: boolean }) => {
  return (
    <View style={[styles.avatar, isPayer && styles.payerAvatar]}>
      <Text style={[styles.avatarText, isPayer && styles.payerAvatarText]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

export default function ExpenseDetailsScreen() {
  const { id, expenseId } = useLocalSearchParams<{ id: string; expenseId: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setError(null);
        const found = await apiService.getExpenseById(expenseId);
        setExpense(found || null);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
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
            <ArrowLeft size={24} color="#6C63FF" />
          </TouchableOpacity>
          <Text style={styles.title}>Expense Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !expense) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#6C63FF" />
          </TouchableOpacity>
          <Text style={styles.title}>Expense Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Expense not found.'}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              setExpense(null);
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#6C63FF" />
        </TouchableOpacity>
        <Text style={styles.title}>Expense Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Expense Card */}
          <View style={styles.expenseCard}>
            <View style={styles.expenseHeader}>
              <View style={styles.amountContainer}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.amount}>{expense.amount.toFixed(2)}</Text>
              </View>
              <Text style={styles.description}>{expense.description}</Text>
            </View>

            {/* Expense Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <User size={18} color="#6C63FF" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Paid by</Text>
                  <View style={styles.paidByContainer}>
                    <Avatar name={expense.paidBy} isPayer />
                    <Text style={styles.detailValue}>{expense.paidBy}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Calendar size={18} color="#6C63FF" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(expense.date)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Users size={18} color="#6C63FF" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Split between</Text>
                  <View style={styles.participantsContainer}>
                    {expense.participants.slice(0, 3).map((participant, index) => (
                      <Avatar key={participant} name={participant} />
                    ))}
                    {expense.participants.length > 3 && (
                      <View style={styles.moreParticipants}>
                        <Text style={styles.moreParticipantsText}>
                          +{expense.participants.length - 3}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Breakdown Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <PieChart size={20} color="#6C63FF" />
              <Text style={styles.sectionTitle}>Breakdown</Text>
            </View>
            <View style={styles.breakdownContainer}>
              {expense.participants.map((participant) => (
                <View key={participant} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <Avatar name={participant} isPayer={participant === expense.paidBy} />
                    <Text style={styles.breakdownName}>
                      {participant}
                      {participant === expense.paidBy && (
                        <Text style={styles.payerBadge}> (paid)</Text>
                      )}
                    </Text>
                  </View>
                  <Text 
                    style={[
                      styles.breakdownAmount,
                      participant === expense.paidBy 
                        ? styles.positiveAmount 
                        : styles.negativeAmount
                    ]}
                  >
                    {participant === expense.paidBy
                      ? `-$${(expense.amount - expense.amount / expense.participants.length).toFixed(2)}`
                      : `$${(expense.amount / expense.participants.length).toFixed(2)}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Edit Button */}
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
        activeOpacity={0.8}
      >
        <Edit3 size={18} color="#FFF" />
        <Text style={styles.editButtonText}>Edit Expense</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    textAlign: 'center',
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
    color: '#E53E3E',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  expenseCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expenseHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6C63FF',
    marginTop: 4,
  },
  amount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#2D3748',
    lineHeight: 48,
  },
  description: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4A5568',
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3748',
  },
  paidByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  payerAvatar: {
    backgroundColor: '#6C63FF',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
  },
  payerAvatarText: {
    color: '#FFF',
  },
  moreParticipants: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreParticipantsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  breakdownContainer: {
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A5568',
    marginLeft: 12,
  },
  payerBadge: {
    color: '#6C63FF',
    fontSize: 13,
  },
  breakdownAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  positiveAmount: {
    color: '#38A169',
  },
  negativeAmount: {
    color: '#E53E3E',
  },
  editButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});