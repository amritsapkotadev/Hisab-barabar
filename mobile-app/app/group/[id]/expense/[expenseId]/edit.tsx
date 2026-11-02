import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, DollarSign, Check } from 'lucide-react-native';
import { Group, Expense } from '@/types';
import { apiService } from '@/services/api';
import { useToast } from '@/components/Toast';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function EditExpenseScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const { id: groupId, expenseId } = useLocalSearchParams<{ id: string; expenseId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupData, expenseData] = await Promise.all([
          apiService.getGroup(groupId),
          apiService.getExpenseById(expenseId),
        ]);
        setGroup(groupData);
        setExpense(expenseData);
        setDescription(expenseData.description);
        setAmount(expenseData.amount.toString());
        setPaidBy(expenseData.paidBy);
        setSelectedParticipants(expenseData.participants);
        setDate(expenseData.date);
      } catch (error) {
        toast.error('Failed to load expense or group data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId, expenseId]);

  const getMemberName = (memberId: string): string => {
    return group?.members.find(m => m.id === memberId)?.name || memberId;
  };

  const toggleParticipant = (memberId: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) {
          toast.error('At least one participant is required');
          return prev;
        }
        return prev.filter(p => p !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!paidBy) {
      toast.error('Please select who paid');
      return;
    }
    if (selectedParticipants.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.updateExpense(expenseId, {
        description: description.trim(),
        amount: numAmount,
        paidBy,
        participants: selectedParticipants,
        date,
      }, expense?.revision);
      toast.success('Expense updated successfully!');
      router.back();
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'OFFLINE_QUEUED') {
        toast.info('Edit saved locally, pending sync. Group balances remain unchanged until sync completes.');
        router.replace('/profile/offline-sync');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to update expense. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.action} />
          <Text style={styles.loadingText}>Loading expense data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group || !expense) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Expense or group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Edit Expense</Text>
          <Text style={styles.subtitle}>{group.name}</Text>
        </View>
      </View>
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Dinner at Italian restaurant"
            placeholderTextColor={COLORS.textTertiary}
            maxLength={100}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Amount *</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Paid by *</Text>
          <View style={styles.optionsContainer}>
            {group.members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.optionButton,
                  paidBy === member.id && styles.selectedOption,
                ]}
                onPress={() => setPaidBy(member.id)}
              >
                <Text style={[
                  styles.optionText,
                  paidBy === member.id && styles.selectedOptionText,
                ]}>
                  {member.name}
                </Text>
                {paidBy === member.id && (
                  <Check size={16} color={COLORS.actionText} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Participants *</Text>
          <Text style={styles.participantsHelper}>
            Select who should split this expense
          </Text>
          <View style={styles.optionsContainer}>
            {group.members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.participantButton,
                  selectedParticipants.includes(member.id) && styles.selectedParticipant,
                ]}
                onPress={() => toggleParticipant(member.id)}
              >
                <Text style={[
                  styles.participantText,
                  selectedParticipants.includes(member.id) && styles.selectedParticipantText,
                ]}>
                  {member.name}
                </Text>
                {selectedParticipants.includes(member.id) ? (
                  <Check size={16} color={COLORS.positive} />
                ) : (
                  <View style={styles.uncheckedBox} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {selectedParticipants.length > 0 && (
          <View style={styles.splitPreview}>
            <Text style={styles.splitTitle}>Split Preview</Text>
            <View style={styles.splitCard}>
              <Text style={styles.splitAmount}>
                रु {amount ? (parseFloat(amount) / selectedParticipants.length).toFixed(2) : '0.00'} per person
              </Text>
              <Text style={styles.splitParticipants}>
                Split between {selectedParticipants.length} participant(s):
              </Text>
              <Text style={styles.splitList}>
                {selectedParticipants.map(getMemberName).join(', ')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.actionText} size="small" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Update Expense</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerContent: {
    flex: 1,
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textTertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.negative,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 10,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 10,
    backgroundColor: COLORS.card,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: COLORS.action,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  selectedOptionText: {
    color: COLORS.actionText,
    fontWeight: '700',
  },
  participantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedParticipant: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.positive,
  },
  participantText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  selectedParticipantText: {
    color: COLORS.positive,
    fontWeight: '700',
  },
  uncheckedBox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 4,
    backgroundColor: COLORS.card,
  },
  participantsHelper: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  splitPreview: {
    marginTop: 10,
    marginBottom: 20,
  },
  splitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  splitCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.positive,
    marginBottom: 2,
  },
  splitParticipants: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  splitList: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.action,
    paddingVertical: 14,
    borderRadius: 999,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.actionText,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
