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
import { ArrowLeft, DollarSign, Check } from 'lucide-react-native';
import { Group, Expense } from '@/types';
import { apiService } from '@/services/api';

export default function EditExpenseScreen() {
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
        Alert.alert('Error', 'Failed to load expense or group data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId, expenseId]);

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
    setSubmitting(true);
    try {
      await apiService.updateExpense(expenseId, {
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
    } catch (error) {
      Alert.alert('Error', 'Failed to update expense. Please try again.');
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
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading expense data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group || !expense) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#374151" />
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
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
            placeholderTextColor="#9ca3af"
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
                रु {amount ? (parseFloat(amount) / selectedParticipants.length).toFixed(2) : '0.00'} per person
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
            <ActivityIndicator color="#ffffff" size="small" />
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerContent: {
    flex: 1,
    marginLeft: 10,
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
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
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
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#2563eb',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
    marginRight: 6,
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '700',
  },
  participantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedParticipant: {
    backgroundColor: '#059669',
  },
  participantText: {
    fontSize: 15,
    color: '#374151',
    marginRight: 6,
  },
  selectedParticipantText: {
    color: '#fff',
    fontWeight: '700',
  },
  uncheckedBox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  participantsHelper: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  splitPreview: {
    marginTop: 10,
    marginBottom: 20,
  },
  splitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  splitCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  splitParticipants: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  splitList: {
    fontSize: 14,
    color: '#374151',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 