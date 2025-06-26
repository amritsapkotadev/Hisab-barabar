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
import { ArrowLeft, DollarSign, Check, X } from 'lucide-react-native';
import { Group } from '@/types';
import { apiService } from '@/services/api';

export default function AddExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.edit === 'true') return;
    if (params.add === 'true') return;
    if (groupId) {
      router.replace({ pathname: '/add-expense-advanced', params: { groupId } });
    } else {
      router.replace('/add-expense-advanced');
    }
  }, [groupId, params]);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return;

      try {
        const groupData = await apiService.getGroup(groupId);
        if (groupData) {
          setGroup(groupData);
          // Select all members by default
          setSelectedParticipants(groupData.members);
          // Set first member as default payer
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
    if (params.edit === 'true') {
      if (params.description) setDescription(params.description as string);
      if (params.amount) setAmount(params.amount as string);
      if (params.paidBy) setPaidBy(params.paidBy as string);
      if (params.participants) setSelectedParticipants(JSON.parse(params.participants as string));
      if (params.date) setDate(params.date as string);
    }
  }, [params]);

  const toggleParticipant = (member: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(member)) {
        // Don't allow removing if it's the only participant
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
    // Validation
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
          {
            text: 'OK',
            onPress: () => router.back(),
          },
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
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', params.edit === 'true' ? 'Failed to update expense. Please try again.' : 'Failed to add expense. Please try again.');
      console.error(params.edit === 'true' ? 'Error updating expense:' : 'Error creating expense:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading group data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Add Expense</Text>
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
            placeholderTextColor="#9ca3af"
            maxLength={100}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Amount *</Text>
          <View style={styles.amountContainer}>
            <DollarSign size={20} color="#6b7280" />
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
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
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Paid by *</Text>
          <View style={styles.optionsContainer}>
            {group.members.map((member) => (
              <TouchableOpacity
                key={member}
                style={[
                  styles.optionButton,
                  paidBy === member && styles.selectedOption,
                ]}
                onPress={() => setPaidBy(member)}
              >
                <Text style={[
                  styles.optionText,
                  paidBy === member && styles.selectedOptionText,
                ]}>
                  {member}
                </Text>
                {paidBy === member && (
                  <Check size={16} color="#ffffff" />
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
                key={member}
                style={[
                  styles.participantButton,
                  selectedParticipants.includes(member) && styles.selectedParticipant,
                ]}
                onPress={() => toggleParticipant(member)}
              >
                <Text style={[
                  styles.participantText,
                  selectedParticipants.includes(member) && styles.selectedParticipantText,
                ]}>
                  {member}
                </Text>
                {selectedParticipants.includes(member) ? (
                  <Check size={16} color="#059669" />
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
                ${amount ? (parseFloat(amount) / selectedParticipants.length).toFixed(2) : '0.00'} per person
              </Text>
              <Text style={styles.splitParticipants}>
                Split between {selectedParticipants.length} participant(s):
              </Text>
              <Text style={styles.splitList}>
                {selectedParticipants.join(', ')}
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
            <ActivityIndicator color="#ffffff\" size="small" />
          ) : (
            <>
              <DollarSign size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Add Expense</Text>
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
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#6b7280',
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
  form: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  amountInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  participantsHelper: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  participantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedParticipant: {
    backgroundColor: '#f0fdf4',
    borderColor: '#059669',
  },
  participantText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedParticipantText: {
    color: '#059669',
  },
  uncheckedBox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 2,
  },
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  splitAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  splitParticipants: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  splitList: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});