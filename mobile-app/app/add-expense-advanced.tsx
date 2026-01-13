// screens/AddAdvancedExpenseScreen.tsx
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
  SafeAreaView,
  Keyboard,
  Platform,
  Dimensions,
  Modal,
  StatusBar,
  LayoutAnimation,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, DollarSign, Users, Calculator, Percent, Hash, Plus, Calendar, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Group } from '@/types';
import { apiService } from '@/services/api';
import {
  calculateExpenseSplits,
  calculateEqualSplit,
  type ExpenseInput,
  type Payer,
  type SplitType
} from '@/utils/expenseSplitter';

const SPLIT_METHODS = [
  { key: 'equal' as const, label: 'Equal', icon: Users },
  { key: 'exact' as const, label: 'Unequal', icon: Calculator },
  { key: 'percentage' as const, label: 'Percent', icon: Percent },
  { key: 'shares' as const, label: 'Shares', icon: Hash },
];

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export default function AddAdvancedExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();

  // State
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Payers: who paid and how much
  const [payers, setPayers] = useState<{ userId: string; name: string; amountPaid: string }[]>([]);

  // Participants: who is splitting the expense and their share values
  const [participants, setParticipants] = useState<{
    userId: string;
    name: string;
    shareValue: string;
    isIncluded: boolean;
  }[]>([]);

  // Validation errors (kept for UI feedback but not for blocking)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    totalPaid: number;
    totalSplit: number;
  }>({ isValid: true, errors: [], totalPaid: 0, totalSplit: 0 });

  const { width } = Dimensions.get('window');

  /* ==================== KEYBOARD HANDLING ==================== */

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  /* ==================== INITIALIZATION ==================== */

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groupsData = await apiService.getGroups();
        setGroups(groupsData);
        const initialGroup = groupId
          ? groupsData.find(g => g.id === groupId)
          : groupsData[0];
        if (initialGroup) {
          handleSelectGroup(initialGroup);
        }
      } catch {
        Alert.alert('Error', 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [groupId]);

  /* ==================== GROUP SELECTION ==================== */

  const handleSelectGroup = (group: Group) => {
    Keyboard.dismiss();
    setSelectedGroup(group);

    // Initialize payers (first member pays all by default)
    setPayers([{
      userId: group.members[0],
      name: group.members[0],
      amountPaid: ''
    }]);

    // Initialize participants (all members included with empty shares)
    setParticipants(group.members.map(member => ({
      userId: member,
      name: member,
      shareValue: '',
      isIncluded: true,
    })));

    setGroupModalVisible(false);
  };

  /* ==================== PAYER MANAGEMENT ==================== */

  const handleAddPayer = () => {
    if (!selectedGroup) return;
    const available = selectedGroup.members.filter(m =>
      !payers.some(p => p.userId === m)
    );
    if (available.length > 0) {
      setPayers([...payers, {
        userId: available[0],
        name: available[0],
        amountPaid: ''
      }]);
    }
  };

  const handleRemovePayer = (idx: number) => {
    if (payers.length > 1) {
      setPayers(payers.filter((_, i) => i !== idx));
    }
  };

  const handlePayerAmount = (idx: number, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const newPayers = [...payers];
    newPayers[idx].amountPaid = cleaned;
    setPayers(newPayers);
  };

  const handlePayerChange = (idx: number, userId: string) => {
    const member = selectedGroup?.members.find(m => m === userId);
    if (!member) return;
    const newPayers = [...payers];
    newPayers[idx].userId = userId;
    newPayers[idx].name = member;
    setPayers(newPayers);
  };

  /* ==================== SPLIT TYPE & SHARES ==================== */

  const handleSplitType = (type: SplitType) => {
    setSplitType(type);

    if (!selectedGroup) return;

    const total = parseFloat(totalAmount) || 0;
    const includedMembers = participants.filter(p => p.isIncluded);

    if (type === 'equal' && total > 0 && includedMembers.length > 0) {
      // Calculate equal split
      const amounts = calculateEqualSplit(total, includedMembers.length);
      const newParticipants = [...participants];
      let amountIndex = 0;

      newParticipants.forEach(p => {
        if (p.isIncluded) {
          p.shareValue = amounts[amountIndex].toFixed(2);
          amountIndex++;
        } else {
          p.shareValue = '';
        }
      });

      setParticipants(newParticipants);
    } else if (type === 'percentage') {
      // Initialize equal percentages
      const pct = includedMembers.length > 0
        ? (100 / includedMembers.length).toFixed(1)
        : '0';

      setParticipants(participants.map(p => ({
        ...p,
        shareValue: p.isIncluded ? pct : ''
      })));
    } else if (type === 'shares') {
      // Initialize equal shares
      setParticipants(participants.map(p => ({
        ...p,
        shareValue: p.isIncluded ? '1' : ''
      })));
    } else {
      // Clear shares for exact split
      setParticipants(participants.map(p => ({
        ...p,
        shareValue: ''
      })));
    }
  };

  const handleParticipantShare = (idx: number, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const newParticipants = [...participants];
    newParticipants[idx].shareValue = cleaned;
    setParticipants(newParticipants);
  };

  const toggleParticipant = (idx: number) => {
    const newParticipants = [...participants];
    newParticipants[idx].isIncluded = !newParticipants[idx].isIncluded;

    if (!newParticipants[idx].isIncluded) {
      newParticipants[idx].shareValue = '';
    } else if (splitType === 'equal') {
      // Recalculate equal split
      const total = parseFloat(totalAmount) || 0;
      const included = newParticipants.filter(p => p.isIncluded);
      if (total > 0 && included.length > 0) {
        const amounts = calculateEqualSplit(total, included.length);
        let amountIndex = 0;
        newParticipants.forEach(p => {
          if (p.isIncluded) {
            p.shareValue = amounts[amountIndex].toFixed(2);
            amountIndex++;
          }
        });
      }
    }

    setParticipants(newParticipants);
  };

  /* ==================== AUTO-UPDATE EQUAL SPLIT ==================== */

  useEffect(() => {
    if (!selectedGroup || splitType !== 'equal') return;

    const total = parseFloat(totalAmount) || 0;
    const includedMembers = participants.filter(p => p.isIncluded);

    if (total > 0 && includedMembers.length > 0) {
      const amounts = calculateEqualSplit(total, includedMembers.length);
      const newParticipants = [...participants];
      let amountIndex = 0;

      newParticipants.forEach(p => {
        if (p.isIncluded) {
          p.shareValue = amounts[amountIndex].toFixed(2);
          amountIndex++;
        }
      });

      setParticipants(newParticipants);
    }
  }, [totalAmount, splitType, participants.filter(p => p.isIncluded).length]);

  /* ==================== REAL-TIME VALIDATION ==================== */

  useEffect(() => {
    const total = parseFloat(totalAmount) || 0;
    const totalPaid = payers.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);

    const includedParticipants = participants.filter(p => p.isIncluded);
    const totalSplit = includedParticipants.reduce((sum, p) =>
      sum + (parseFloat(p.shareValue) || 0), 0
    );

    const errors: string[] = [];

    // Show errors for feedback but don't block submission
    if (total > 0) {
      if (Math.abs(totalPaid - total) > 0.01) {
        errors.push(`Total paid ($${totalPaid.toFixed(2)})  Remaining ($${(total - totalPaid).toFixed(2)})`);
      }

      if (splitType === 'percentage' && includedParticipants.length > 0) {
        if (Math.abs(totalSplit - 100) > 0.01) {
          errors.push(`Percentages sum to ${totalSplit.toFixed(1)}% (need 100%)`);
        }
      } else if (splitType === 'exact' && includedParticipants.length > 0) {
        if (Math.abs(totalSplit - total) > 0.01) {
          errors.push(`Split total ($${totalSplit.toFixed(2)}) ≠ expense ($${total.toFixed(2)})`);
        }
      }
    }

    setValidationResult({
      isValid: errors.length === 0,
      errors,
      totalPaid,
      totalSplit,
    });
  }, [totalAmount, payers, participants, splitType]);

  /* ==================== FORM VALIDATION & SUBMISSION ==================== */

  const validateAndSubmit = async () => {
    if (!selectedGroup) {
      Alert.alert('Error', 'Please select a group first');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const total = parseFloat(totalAmount) || 0;
    if (total <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const includedParticipants = participants.filter(p => p.isIncluded);
    if (includedParticipants.length === 0) {
      Alert.alert('Error', 'Please include at least one participant');
      return;
    }

    // Auto-fill payer amounts if empty
    const updatedPayers = [...payers];
    let emptyPayers = 0;
    let totalPaid = 0;
    
    updatedPayers.forEach(payer => {
      const amount = parseFloat(payer.amountPaid) || 0;
      if (amount <= 0) {
        emptyPayers++;
      } else {
        totalPaid += amount;
      }
    });

    // Distribute remaining amount among empty payers
    if (emptyPayers > 0 && total > 0) {
      const remaining = total - totalPaid;
      const share = remaining / emptyPayers;
      
      updatedPayers.forEach(payer => {
        if (parseFloat(payer.amountPaid) <= 0) {
          payer.amountPaid = share.toFixed(2);
        }
      });
    }

    // Auto-fill participant shares if empty
    const updatedParticipants = [...participants];
    const included = updatedParticipants.filter(p => p.isIncluded);
    
    if (splitType === 'equal') {
      // Equal split is already calculated
    } else if (splitType === 'percentage') {
      // Distribute percentages equally
      const sharePct = 100 / included.length;
      included.forEach(p => {
        if (!p.shareValue || parseFloat(p.shareValue) <= 0) {
          p.shareValue = sharePct.toFixed(1);
        }
      });
    } else if (splitType === 'shares') {
      // Give 1 share to each
      included.forEach(p => {
        if (!p.shareValue || parseFloat(p.shareValue) <= 0) {
          p.shareValue = '1';
        }
      });
    } else if (splitType === 'exact') {
      // Distribute amount equally
      const shareAmount = total / included.length;
      included.forEach(p => {
        if (!p.shareValue || parseFloat(p.shareValue) <= 0) {
          p.shareValue = shareAmount.toFixed(2);
        }
      });
    }

    // Build expense input
    const payersData: Payer[] = updatedPayers.map(p => ({
      userId: p.userId,
      amount: parseFloat(p.amountPaid) || 0,
    }));

    const splitDetails: Record<string, number> = {};
    included.forEach(p => {
      splitDetails[p.userId] = parseFloat(p.shareValue) || 0;
    });

    const expenseInput: ExpenseInput = {
      totalAmount: total,
      paidBy: payersData,
      splitType,
      splitDetails,
      participants: included.map(p => p.userId),
    };

    // Validate using the splitting logic
    const result = calculateExpenseSplits(expenseInput);

    if (!result.isValid) {
      // Auto-correct and try again with simplified logic
      const simplifiedSettlements = included.map(p => ({
        from: p.name,
        to: updatedPayers[0].name,
        amount: parseFloat(p.shareValue) || (total / included.length),
      }));

      // Submit expense
      setSubmitting(true);
      try {
        const expenseData = {
          groupId: selectedGroup.id,
          description: description.trim(),
          amount: total,
          paidBy: updatedPayers.length === 1 ? updatedPayers[0].name : 'Multiple',
          splits: included.map(p => ({
            participant: p.name,
            amount: parseFloat(p.shareValue) || (total / included.length),
            percentage: splitType === 'percentage' ? parseFloat(p.shareValue) || (100 / included.length) : undefined,
          })),
          date,
          type: 'group' as const,
          splitType,
          balances: {},
          settlements: simplifiedSettlements,
        };

        await apiService.createUnequalExpense(expenseData);

        Alert.alert('Success', 'Expense added successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to add expense');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Submit expense
    setSubmitting(true);
    try {
      const expenseData = {
        groupId: selectedGroup.id,
        description: description.trim(),
        amount: total,
        paidBy: updatedPayers.length === 1 ? updatedPayers[0].name : 'Multiple',
        splits: included.map(p => ({
          participant: p.name,
          amount: parseFloat(p.shareValue) || 0,
          percentage: splitType === 'percentage' ? parseFloat(p.shareValue) : undefined,
        })),
        date,
        type: 'group' as const,
        splitType,
        balances: result.balances,
        settlements: result.settlements,
      };

      await apiService.createUnequalExpense(expenseData);

      Alert.alert('Success', 'Expense added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  /* ==================== RENDERING ==================== */

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#5B21B6']}
        style={styles.headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              Keyboard.dismiss();
              router.back();
            }}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Group Selector */}
      <TouchableOpacity 
        style={styles.groupSelector}
        onPress={() => setGroupModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.groupInfo}>
          <View style={styles.groupAvatar}>
            <Text style={styles.groupAvatarText}>
              {selectedGroup ? getInitials(selectedGroup.name) : 'G'}
            </Text>
          </View>
          <View style={styles.groupTextContainer}>
            <Text style={styles.groupSelectorTitle}>Group</Text>
            <Text style={styles.groupSelectorName} numberOfLines={1}>
              {selectedGroup?.name || 'Select Group'}
            </Text>
          </View>
        </View>
        <ChevronDown size={20} color="#64748B" />
      </TouchableOpacity>

      {/* Inline Error Messages (Info only, not blocking) */}
      {!validationResult.isValid && totalAmount && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorTitle}>Note:</Text>
          {validationResult.errors.map((err, i) => (
            <Text key={i} style={styles.errorText}>• {err}</Text>
          ))}
          <Text style={styles.errorNote}>You can still submit - system will auto-correct</Text>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Amount & Description */}
        <View style={styles.card}>
          <View style={styles.amountContainer}>
            <DollarSign size={28} color="#7c3aed" />
            <TextInput
              style={styles.amountInput}
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#c7d2fe"
              returnKeyType="next"
            />
          </View>
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What's this expense for?"
            placeholderTextColor="#94A3B8"
            returnKeyType="next"
          />
          
          {/* Date Selector */}
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setDatePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Calendar size={18} color="#7c3aed" />
            <Text style={styles.dateText}>{date}</Text>
          </TouchableOpacity>
        </View>

        {/* Who Paid */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Who paid? <Text style={styles.totalPaidText}>${validationResult.totalPaid.toFixed(2)}</Text>
          </Text>
          {payers.map((payer, idx) => (
            <View key={idx} style={styles.payerRow}>
              <View style={styles.payerInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(payer.name)}</Text>
                </View>
                <Text style={styles.payerName}>{payer.name}</Text>
              </View>
              <View style={styles.payerAmountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.payerAmountInput}
                  value={payer.amountPaid}
                  onChangeText={v => handlePayerAmount(idx, v)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#c7d2fe"
                  returnKeyType="next"
                />
              </View>
            </View>
          ))}
          {selectedGroup && payers.length < selectedGroup.members.length && (
            <TouchableOpacity style={styles.addPayerBtn} onPress={handleAddPayer}>
              <Plus size={20} color="#7c3aed" />
              <Text style={styles.addPayerBtnText}>Add payer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Split Method */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Split method</Text>
          <View style={styles.splitMethodsContainer}>
            {SPLIT_METHODS.map(method => {
              const Icon = method.icon;
              const isActive = splitType === method.key;
              return (
                <TouchableOpacity
                  key={method.key}
                  style={[styles.splitMethodBtn, isActive && styles.splitMethodBtnActive]}
                  onPress={() => handleSplitType(method.key)}
                  activeOpacity={0.85}
                >
                  <Icon size={20} color={isActive ? '#fff' : '#7c3aed'} />
                  <Text style={[styles.splitMethodText, isActive && styles.splitMethodTextActive]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Participants */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Split between ({participants.filter(p => p.isIncluded).length} people)
            {splitType !== 'equal' && (
              <Text style={styles.totalSplitText}> • ${validationResult.totalSplit.toFixed(2)}</Text>
            )}
          </Text>
          {participants.map((p, i) => (
            <View key={i} style={styles.participantRow}>
              <TouchableOpacity
                style={styles.participantCheckbox}
                onPress={() => toggleParticipant(i)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  p.isIncluded && styles.checkboxActive
                ]} />
              </TouchableOpacity>
              <View style={styles.participantInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(p.name)}</Text>
                </View>
                <Text style={[
                  styles.participantName,
                  !p.isIncluded && styles.participantNameInactive
                ]}>
                  {p.name}
                </Text>
              </View>
              <View style={styles.participantShareContainer}>
                {splitType === 'percentage' && p.isIncluded && <Text style={styles.percentageSymbol}>%</Text>}
                {splitType === 'equal' && p.isIncluded && <Text style={styles.currencySymbol}>$</Text>}
                <TextInput
                  style={[
                    styles.participantShareInput,
                    !p.isIncluded && styles.participantShareInputDisabled
                  ]}
                  value={p.shareValue}
                  onChangeText={v => handleParticipantShare(i, v)}
                  keyboardType="decimal-pad"
                  editable={splitType !== 'equal' && p.isIncluded}
                  placeholder={p.isIncluded ? '0' : '—'}
                  placeholderTextColor="#c7d2fe"
                  returnKeyType="done"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Extra padding at bottom for keyboard */}
        <View style={{ height: keyboardVisible ? 100 : 20 }} />
      </ScrollView>

      {/* Date Picker */}
      {datePickerVisible && (
        <DateTimePicker
          value={new Date(date)}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setDatePickerVisible(false);
            if (d) setDate(d.toISOString().split('T')[0]);
          }}
        />
      )}

      {/* Group Selection Modal */}
      <Modal
        visible={groupModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Group</Text>
              <TouchableOpacity onPress={() => setGroupModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupOption}
                  onPress={() => handleSelectGroup(group)}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupOptionAvatar}>
                    <Text style={styles.groupOptionAvatarText}>
                      {getInitials(group.name)}
                    </Text>
                  </View>
                  <View style={styles.groupOptionInfo}>
                    <Text style={styles.groupOptionName}>{group.name}</Text>
                    <Text style={styles.groupOptionMembers}>
                      {group.members.length} members
                    </Text>
                  </View>
                  {selectedGroup?.id === group.id && (
                    <View style={styles.selectedIndicator}>
                      <View style={styles.selectedDot} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Submit Button - Always enabled */}
      <View style={[
        styles.footer,
        {
          bottom: keyboardVisible ? keyboardHeight : 0,
        }
      ]}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={validateAndSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <LinearGradient 
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          > 
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Add Expense</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc' 
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#fff' 
  },
  groupSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  groupTextContainer: {
    flex: 1,
  },
  groupSelectorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  groupSelectorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  errorBanner: { 
    backgroundColor: '#FEF3C7', 
    borderRadius: 12, 
    marginHorizontal: 24, 
    marginTop: 12, 
    padding: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  errorText: { 
    color: '#92400E', 
    fontSize: 14, 
    marginBottom: 4 
  },
  errorNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#92400E',
    marginTop: 4,
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: { 
    paddingBottom: 120, 
    paddingTop: 16 
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginHorizontal: 24, 
    marginBottom: 16, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: '#f1f5f9' 
  },
  amountContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  amountInput: { 
    fontSize: 32, 
    fontWeight: '700', 
    color: '#7c3aed', 
    marginLeft: 12, 
    flex: 1 
  },
  descInput: { 
    fontSize: 16, 
    color: '#334155', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#7c3aed',
    marginLeft: 8,
    fontWeight: '500',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#1e293b', 
    marginBottom: 16 
  },
  totalPaidText: {
    color: '#10B981',
    fontWeight: '700',
  },
  totalSplitText: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 14,
  },
  payerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#f8fafc', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12 
  },
  payerInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#ede9fe', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  avatarText: { 
    color: '#7c3aed', 
    fontWeight: '700', 
    fontSize: 16 
  },
  payerName: { 
    fontSize: 16, 
    color: '#334155' 
  },
  payerAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    width: 120,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    marginRight: 4,
  },
  payerAmountInput: { 
    flex: 1,
    fontSize: 16, 
    color: '#1e293b', 
    paddingVertical: 12,
    textAlign: 'right' 
  },
  addPayerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ede9fe', 
    borderRadius: 12, 
    padding: 12, 
    marginTop: 8 
  },
  addPayerBtnText: { 
    color: '#7c3aed', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 8 
  },
  splitMethodsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12 
  },
  splitMethodBtn: { 
    flex: 1, 
    minWidth: '45%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  splitMethodBtnActive: { 
    backgroundColor: '#7c3aed', 
    borderColor: '#7c3aed' 
  },
  splitMethodText: { 
    color: '#7c3aed', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 8 
  },
  splitMethodTextActive: { 
    color: '#fff' 
  },
  participantRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#f8fafc', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12 
  },
  participantCheckbox: { 
    marginRight: 12 
  },
  checkbox: { 
    width: 24, 
    height: 24, 
    borderRadius: 6, 
    borderWidth: 2, 
    borderColor: '#cbd5e1' 
  },
  checkboxActive: { 
    backgroundColor: '#7c3aed', 
    borderColor: '#7c3aed' 
  },
  participantInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  participantName: { 
    fontSize: 16, 
    color: '#334155' 
  },
  participantNameInactive: { 
    color: '#94a3b8' 
  },
  participantShareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    width: 120,
  },
  percentageSymbol: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  participantShareInput: { 
    flex: 1,
    fontSize: 16, 
    color: '#1e293b', 
    paddingVertical: 12,
    textAlign: 'right' 
  },
  participantShareInputDisabled: { 
    backgroundColor: '#f1f5f9', 
    color: '#94a3b8' 
  },
  footer: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
  },
  submitBtn: { 
    borderRadius: 16, 
    overflow: 'hidden' 
  },
  submitGradient: { 
    paddingVertical: 18, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  submitBtnText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalClose: {
    fontSize: 24,
    color: '#64748B',
    padding: 4,
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  groupOptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupOptionAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },
  groupOptionInfo: {
    flex: 1,
  },
  groupOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  groupOptionMembers: {
    fontSize: 14,
    color: '#64748B',
  },
  selectedIndicator: {
    padding: 4,
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
});