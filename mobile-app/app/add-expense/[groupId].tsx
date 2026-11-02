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
import { ArrowLeft, DollarSign, Check, User, Users } from 'lucide-react-native';
import { Group } from '@/types';
import { apiService } from '@/services/api';
import { useToast } from '@/components/Toast';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function AddExpenseScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const params = useLocalSearchParams<{ 
    groupId?: string;
    edit?: string;
    expenseId?: string;
    revision?: string;
    description?: string;
    amount?: string;
    paidBy?: string;
    participants?: string;
    date?: string;
  }>();
  const { groupId, edit } = params;
  const [group, setGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (edit === 'true') return;
    if (groupId) {
      router.replace({ pathname: '/add-expense-advanced', params: { groupId } });
    } else {
      router.replace('/add-expense-advanced');
    }
  }, [groupId, edit]);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return;

      try {
        const groupData = await apiService.getGroup(groupId);
        if (groupData) {
          setGroup(groupData);
          setSelectedParticipants(groupData.members.map(m => m.id));
          if (groupData.members.length > 0) {
            setPaidBy(groupData.members[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching group:', error);
        toast.error('Failed to load group data');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  useEffect(() => {
    if (edit === 'true') {
      if (params.description) setDescription(params.description as string);
      if (params.amount) setAmount(params.amount as string);
      if (params.paidBy) setPaidBy(params.paidBy as string);
      if (params.participants) setSelectedParticipants(JSON.parse(params.participants as string));
      if (params.date) setDate(params.date as string);
    }
  }, [edit, params.description, params.amount, params.paidBy, params.participants, params.date]);

  const toggleParticipant = (member: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(member)) {
        if (prev.length === 1) {
          toast.error('At least one participant is required');
          return prev;
        }
        return prev.filter(p => p !== member);
      } else {
        return [...prev, member];
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

    if (!groupId) {
      toast.error('Group ID is missing');
      return;
    }

    setSubmitting(true);
    try {
      if (params.edit === 'true' && params.expenseId) {
        const revision = Number(Array.isArray(params.revision) ? params.revision[0] : params.revision);
        await apiService.updateExpense(params.expenseId as string, {
          description: description.trim(),
          amount: numAmount,
          paidBy,
          participants: selectedParticipants,
          date,
        }, revision);
        toast.success('Expense updated successfully!');
        router.back();
      } else {
        await apiService.createExpense({
          groupId,
          description: description.trim(),
          amount: numAmount,
          paidBy,
          participants: selectedParticipants,
          date,
        });
        toast.success('Expense added successfully!');
        router.back();
      }
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof Error && 'code' in error && error.code === 'OFFLINE_QUEUED') {
        toast.info(params.edit === 'true'
          ? 'Edit saved locally, pending sync. Group balances remain unchanged.'
          : 'Expense saved locally, pending sync. It is not included in balances yet.');
        router.replace('/profile/offline-sync');
        return;
      }
      toast.error(error instanceof Error ? error.message : params.edit === 'true'
        ? 'Failed to update expense. Please try again.'
        : 'Failed to add expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading group data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{params.edit === 'true' ? 'Edit Expense' : 'Add Expense'}</Text>
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
            <DollarSign size={20} color={COLORS.muted} />
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

        {/* Enhanced Paid By Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Paid by *</Text>
          </View>
          <View style={styles.paidByContainer}>
            {group.members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.paidByButton,
                  paidBy === member.id && styles.paidByButtonSelected,
                ]}
                onPress={() => setPaidBy(member.id)}
              >
                <View style={styles.paidByContent}>
                  <View style={[
                    styles.paidByAvatar,
                    paidBy === member.id && styles.paidByAvatarSelected
                  ]}>
                    <Text style={[
                      styles.paidByInitial,
                      paidBy === member.id && styles.paidByInitialSelected
                    ]}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.paidByText,
                    paidBy === member.id && styles.paidByTextSelected,
                  ]}>
                    {member.name}
                  </Text>
                </View>
                {paidBy === member.id && (
                  <View style={styles.paidByCheckmark}>
                    <Check size={16} color={COLORS.actionText} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Enhanced Split Between Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Split between *</Text>
          </View>
          <Text style={styles.participantsHelper}>
            Select who should share this expense
          </Text>
          <View style={styles.participantsContainer}>
            {group.members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.participantButton,
                  selectedParticipants.includes(member.id) && styles.participantButtonSelected,
                ]}
                onPress={() => toggleParticipant(member.id)}
              >
                <View style={styles.participantContent}>
                  <View style={[
                    styles.participantAvatar,
                    selectedParticipants.includes(member.id) && styles.participantAvatarSelected
                  ]}>
                    <Text style={[
                      styles.participantInitial,
                      selectedParticipants.includes(member.id) && styles.participantInitialSelected
                    ]}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.participantName}>{member.name}</Text>
                </View>
                <View style={[
                  styles.participantCheckbox,
                  selectedParticipants.includes(member.id) && styles.participantCheckboxSelected,
                ]}>
                  {selectedParticipants.includes(member.id) && (
                    <Check size={14} color={COLORS.actionText} />
                  )}
                </View>
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
              <View style={styles.splitDetails}>
                <View style={styles.splitDetailRow}>
                  <Text style={styles.splitDetailLabel}>Paid by: </Text>
                  <Text style={styles.splitDetailValue}>{paidBy}</Text>
                </View>
                <View style={styles.splitDetailRow}>
                  <Text style={styles.splitDetailLabel}>Split between: </Text>
                  <Text style={styles.splitDetailValue}>
                    {selectedParticipants.length} {selectedParticipants.length === 1 ? 'person' : 'people'}
                  </Text>
                </View>
              </View>
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
              <DollarSign size={20} color={COLORS.actionText} />
              <Text style={styles.submitButtonText}>
                {params.edit === 'true' ? 'Update Expense' : 'Add Expense'}
              </Text>
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
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
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
    color: COLORS.muted,
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
  },
  form: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  amountInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.text,
  },
  participantsHelper: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 12,
  },
  // Paid By Section Styles
  paidByContainer: {
    gap: 8,
  },
  paidByButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidByButtonSelected: {
    backgroundColor: COLORS.chip,
    borderColor: COLORS.primary,
  },
  paidByContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidByAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paidByAvatarSelected: {
    backgroundColor: COLORS.action,
  },
  paidByInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  paidByInitialSelected: {
    color: COLORS.actionText,
  },
  paidByText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  paidByTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  paidByCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.action,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Participants Section Styles
  participantsContainer: {
    gap: 8,
  },
  participantButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantButtonSelected: {
    backgroundColor: COLORS.chip,
    borderColor: COLORS.primary,
  },
  participantContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarSelected: {
    backgroundColor: COLORS.action,
  },
  participantInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  participantInitialSelected: {
    color: COLORS.actionText,
  },
  participantName: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  participantCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantCheckboxSelected: {
    backgroundColor: COLORS.action,
    borderColor: COLORS.action,
  },
  // Split Preview Styles
  splitPreview: {
    marginTop: 16,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  splitCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  splitAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.positive,
    marginBottom: 8,
  },
  splitDetails: {
    marginTop: 8,
  },
  splitDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  splitDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.muted,
  },
  splitDetailValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Footer Styles
  footer: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.action,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.surfaceMuted,
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.actionText,
  }  ,
});