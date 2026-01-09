import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, DollarSign, Check, User, Users } from 'lucide-react-native';
import { Group } from '@/types';
import { apiService } from '@/services/api';

export default function AddExpenseScreen() {
  const params = useLocalSearchParams<{ 
    groupId?: string;
    edit?: string;
    add?: string;
    description?: string;
    amount?: string;
    paidBy?: string;
    participants?: string;
    date?: string;
  }>();
  const { groupId, edit, add } = params;
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
    if (add === 'true') return;
    if (groupId) {
      router.replace({ pathname: '/add-expense-advanced', params: { groupId } });
    } else {
      router.replace('/add-expense-advanced');
    }
  }, [groupId, edit, add]);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return;

      try {
        const groupData = await apiService.getGroup(groupId);
        if (groupData) {
          setGroup(groupData);
          setSelectedParticipants(groupData.members);
          if (groupData.members.length > 0) {
            setPaidBy(groupData.members[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching group:', error);
        Alert.alert('Error', 'Failed to load group data');
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
          Alert.alert('Error', 'At least one participant is required');
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
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!paidBy) {
      Alert.alert('Error', 'Please select who paid');
      return;
    }

    if (selectedParticipants.length === 0) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }

    if (!groupId) {
      Alert.alert('Error', 'Group ID is missing');
      return;
    }

    setSubmitting(true);
    try {
      if (params.edit === 'true' && params.expenseId) {
        await apiService.updateExpense(params.expenseId as string, {
          description: description.trim(),
          amount: numAmount,
          paidBy,
          participants: selectedParticipants,
          date,
        });
        Alert.alert('Success', 'Expense updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await apiService.createExpense({
          groupId,
          description: description.trim(),
          amount: numAmount,
          paidBy,
          participants: selectedParticipants,
          date,
        });
        Alert.alert('Success', 'Expense added successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', params.edit === 'true' 
        ? 'Failed to update expense. Please try again.' 
        : 'Failed to add expense. Please try again.');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading group data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#374151" />
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
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
            placeholderTextColor="#9CA3AF"
            maxLength={100}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Amount *</Text>
          <View style={styles.amountContainer}>
            <DollarSign size={20} color="#6B7280" />
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
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
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Enhanced Paid By Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={18} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Paid by *</Text>
          </View>
          <View style={styles.paidByContainer}>
            {group.members.map((member) => (
              <TouchableOpacity
                key={member}
                style={[
                  styles.paidByButton,
                  paidBy === member && styles.paidByButtonSelected,
                ]}
                onPress={() => setPaidBy(member)}
              >
                <View style={styles.paidByContent}>
                  <View style={[
                    styles.paidByAvatar,
                    paidBy === member && styles.paidByAvatarSelected
                  ]}>
                    <Text style={[
                      styles.paidByInitial,
                      paidBy === member && styles.paidByInitialSelected
                    ]}>
                      {member.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.paidByText,
                    paidBy === member && styles.paidByTextSelected,
                  ]}>
                    {member}
                  </Text>
                </View>
                {paidBy === member && (
                  <View style={styles.paidByCheckmark}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Enhanced Split Between Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={18} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Split between *</Text>
          </View>
          <Text style={styles.participantsHelper}>
            Select who should share this expense
          </Text>
          <View style={styles.participantsContainer}>
            {group.members.map((member) => (
              <TouchableOpacity
                key={member}
                style={[
                  styles.participantButton,
                  selectedParticipants.includes(member) && styles.participantButtonSelected,
                ]}
                onPress={() => toggleParticipant(member)}
              >
                <View style={styles.participantContent}>
                  <View style={[
                    styles.participantAvatar,
                    selectedParticipants.includes(member) && styles.participantAvatarSelected
                  ]}>
                    <Text style={[
                      styles.participantInitial,
                      selectedParticipants.includes(member) && styles.participantInitialSelected
                    ]}>
                      {member.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.participantName}>{member}</Text>
                </View>
                <View style={[
                  styles.participantCheckbox,
                  selectedParticipants.includes(member) && styles.participantCheckboxSelected,
                ]}>
                  {selectedParticipants.includes(member) && (
                    <Check size={14} color="#FFFFFF" />
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
                ${amount ? (parseFloat(amount) / selectedParticipants.length).toFixed(2) : '0.00'} per person
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
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <DollarSign size={20} color="#FFFFFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#DC2626',
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
    color: '#111827',
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  amountInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  participantsHelper: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  // Paid By Section Styles
  paidByContainer: {
    gap: 8,
  },
  paidByButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidByButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  paidByContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidByAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paidByAvatarSelected: {
    backgroundColor: '#4F46E5',
  },
  paidByInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  paidByInitialSelected: {
    color: '#FFFFFF',
  },
  paidByText: {
    fontSize: 16,
    color: '#374151',
  },
  paidByTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  paidByCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Participants Section Styles
  participantsContainer: {
    gap: 8,
  },
  participantButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantButtonSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  participantContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarSelected: {
    backgroundColor: '#8B5CF6',
  },
  participantInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  participantInitialSelected: {
    color: '#FFFFFF',
  },
  participantName: {
    fontSize: 16,
    color: '#374151',
  },
  participantCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantCheckboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  // Split Preview Styles
  splitPreview: {
    marginTop: 16,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  splitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  splitAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
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
    color: '#6B7280',
  },
  splitDetailValue: {
    fontSize: 14,
    color: '#4B5563',
  },
  // Footer Styles
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  }  ,
});