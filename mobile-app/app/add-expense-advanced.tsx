import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Platform,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Users, Calculator, Percent, Hash, Plus, Minus, Calendar } from 'lucide-react-native';
import { Group } from '@/types';
import { apiService } from '@/services/api';
import { deleteExpenseDraft, loadExpenseDraft, saveExpenseDraft } from '@/services/dataClient';
import { useToast } from '@/components/Toast';
import { limitService } from '@/services/limitService';
import AdModal from '@/components/AdModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

const SPLIT_METHODS = [
  { key: 'equal', label: 'Equal', icon: Users },
  { key: 'unequal', label: 'Unequal', icon: Calculator },
  { key: 'percentage', label: 'Percent', icon: Percent },
  { key: 'shares', label: 'Shares', icon: Hash },
];

const isSplitType = (value: unknown): value is 'equal' | 'unequal' | 'percentage' | 'shares' =>
  value === 'equal' || value === 'unequal' || value === 'percentage' || value === 'shares';

interface AdvancedExpenseDraft {
  groupId: string;
  description: string;
  totalAmount: string;
  payers: Array<{ memberId: string; amountPaid: string }>;
  splitType: 'equal' | 'unequal' | 'percentage' | 'shares';
  participants: Array<{ memberId: string; share: string }>;
  date: string;
}

function isAdvancedExpenseDraft(value: unknown): value is AdvancedExpenseDraft {
  if (!value || typeof value !== 'object' ||
      !('groupId' in value) || typeof value.groupId !== 'string' ||
      !('description' in value) || typeof value.description !== 'string' ||
      !('totalAmount' in value) || typeof value.totalAmount !== 'string' ||
      !('date' in value) || typeof value.date !== 'string' ||
      !('splitType' in value) || !isSplitType(value.splitType) ||
      !('payers' in value) || !Array.isArray(value.payers) ||
      !('participants' in value) || !Array.isArray(value.participants)) return false;
  return value.payers.every(payer => payer && typeof payer === 'object' &&
    'memberId' in payer && typeof payer.memberId === 'string' &&
    'amountPaid' in payer && typeof payer.amountPaid === 'string') &&
    value.participants.every(participant => participant && typeof participant === 'object' &&
      'memberId' in participant && typeof participant.memberId === 'string' &&
      'share' in participant && typeof participant.share === 'string');
}

function getInitials(name: string): string {
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
}

// Fixed calculation functions
function calculateEqualSplit(total: number, count: number): number[] {
  const amountPerPerson = Math.floor(total * 100 / count) / 100;
  const remainder = Math.round((total - amountPerPerson * count) * 100);
  
  return Array(count).fill(amountPerPerson).map((val, i) => 
    i < remainder ? Number((val + 0.01).toFixed(2)) : val
  );
}

function calculateSharesSplit(total: number, shares: number[]): number[] {
  const totalShares = shares.reduce((sum, share) => sum + share, 0);
  return shares.map(share => parseFloat((total * share / totalShares).toFixed(2)));
}

function calculatePercentageSplit(total: number, percentages: number[]): number[] {
  return percentages.map(pct => parseFloat((total * pct / 100).toFixed(2)));
}

export default function AddAdvancedExpenseScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const toast = useToast();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payers, setPayers] = useState<{ memberId: string; amountPaid: string }[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'unequal' | 'percentage' | 'shares'>('equal');
  const [participants, setParticipants] = useState<{ memberId: string; share: string }[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [canAddExpense, setCanAddExpense] = useState(true);
  const [remainingTransactions, setRemainingTransactions] = useState(0);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groupsData = await apiService.getGroups();
        setGroups(groupsData);
        const draft = await loadExpenseDraft<unknown>(`advanced-expense:${groupId || 'all'}`);
        if (groupId) {
          const group = groupsData.find(g => g.id === groupId);
          if (group) {
            setSelectedGroup(group);
            setPayers([{ memberId: group.members[0].id, amountPaid: '' }]);
            setParticipants(group.members.map(m => ({ memberId: m.id, share: '' })));
          }
        } else if (groupsData.length > 0) {
          setSelectedGroup(groupsData[0]);
          setPayers([{ memberId: groupsData[0].members[0].id, amountPaid: '' }]);
          setParticipants(groupsData[0].members.map(m => ({ memberId: m.id, share: '' })));
        }
        if (isAdvancedExpenseDraft(draft)) {
          const draftGroup = groupsData.find(group => group.id === draft.groupId);
          if (draftGroup &&
              draft.payers.every(payer => draftGroup.members.some(member => member.id === payer.memberId)) &&
              draft.participants.every(participant =>
                draftGroup.members.some(member => member.id === participant.memberId))) {
            setSelectedGroup(draftGroup);
            setDescription(draft.description);
            setTotalAmount(draft.totalAmount);
            setPayers(draft.payers);
            setSplitType(draft.splitType);
            setParticipants(draft.participants);
            setDate(draft.date);
          }
        }
      } catch (error) {
        toast.error('Failed to load groups');
      } finally {
        setDraftReady(true);
        setLoading(false);
      }
    };
    const checkLimits = async () => {
      const { canAdd, remaining } = await limitService.canAddTransaction();
      setCanAddExpense(canAdd);
      setRemainingTransactions(remaining);
    };
    fetchGroups();
    checkLimits();
  }, [groupId]);

  useEffect(() => {
    if (!draftReady || !selectedGroup) return;
    const timer = setTimeout(() => {
      void saveExpenseDraft(`advanced-expense:${groupId || 'all'}`, {
        groupId: selectedGroup.id,
        description,
        totalAmount,
        payers,
        splitType,
        participants,
        date,
      }).catch(error => console.error('Unable to save group expense draft:', error));
    }, 300);
    return () => clearTimeout(timer);
  }, [draftReady, groupId, selectedGroup, description, totalAmount, payers, splitType, participants, date]);

  useEffect(() => {
    if (!selectedGroup) return;
    
    const total = parseFloat(totalAmount) || 0;
    if (splitType === 'equal' && total > 0) {
      const amounts = calculateEqualSplit(total, selectedGroup.members.length);
      setParticipants(selectedGroup.members.map((m, i) => ({ memberId: m.id, share: amounts[i].toFixed(2) })));
    }
  }, [totalAmount, splitType, selectedGroup]);

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setPayers([{ memberId: group.members[0].id, amountPaid: '' }]);
    setParticipants(group.members.map(m => ({ memberId: m.id, share: '' })));
    setGroupModalVisible(false);
  };

  const handleAddPayer = () => {
    if (!selectedGroup) return;
    const available = selectedGroup.members.filter(m => !payers.some(p => p.memberId === m.id));
    if (available.length > 0) {
      setPayers([...payers, { memberId: available[0].id, amountPaid: '' }]);
    }
  };

  const handleRemovePayer = (idx: number) => {
    if (payers.length > 1) setPayers(payers.filter((_, i) => i !== idx));
  };

  const getMemberName = (memberId: string): string => {
    return selectedGroup?.members.find(m => m.id === memberId)?.name || memberId;
  };

  const handlePayerAmount = (idx: number, value: string) => {
    setPayers(payers.map((p, i) => (i === idx ? { ...p, amountPaid: value.replace(/[^0-9.]/g, '') } : p)));
  };

  const handleSplitType = (type: any) => {
    setSplitType(type);
    if (!selectedGroup) return;
    
    const total = parseFloat(totalAmount) || 0;
    if (type === 'equal' && total > 0) {
      const amounts = calculateEqualSplit(total, selectedGroup.members.length);
      setParticipants(selectedGroup.members.map((m, i) => ({ memberId: m.id, share: amounts[i].toFixed(2) })));
    } else if (type === 'percentage') {
      setParticipants(selectedGroup.members.map(m => ({ memberId: m.id, share: (100 / selectedGroup.members.length).toFixed(1) })));
    } else if (type === 'shares') {
      setParticipants(selectedGroup.members.map(m => ({ memberId: m.id, share: '1' })));
    } else {
      setParticipants(selectedGroup.members.map(m => ({ memberId: m.id, share: '' })));
    }
  };

  const handleParticipantShare = (idx: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[idx].share = value.replace(/[^0-9.]/g, '');
    setParticipants(newParticipants);
  };

  const handleDateChange = (event: any, selected?: Date) => {
    setDatePickerVisible(false);
    if (selected) {
      setDate(selected.toISOString().split('T')[0]);
    }
  };

  const getTotalPaid = () => {
    return payers.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
  };

  const getTotalSplit = () => {
    const total = parseFloat(totalAmount) || 0;
    
    if (splitType === 'equal' || splitType === 'unequal') {
      return participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
    } else if (splitType === 'percentage') {
      return participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
    } else if (splitType === 'shares') {
      return participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
    }
    return 0;
  };

  const validateExpense = () => {
    const errors: any = {};
    const total = parseFloat(totalAmount) || 0;
    const paid = getTotalPaid();
    
    if (!description.trim()) errors.description = 'Enter a description';
    if (!totalAmount || total <= 0) errors.totalAmount = 'Enter a valid amount';
    
    // Validate paid amount
    if (Math.abs(paid - total) > 0.01) {
      errors.paid = `Total paid (रु ${paid.toFixed(2)}) must match total amount (रु ${total.toFixed(2)})`;
    }
    
    // Validate split amounts
    if (splitType === 'equal' || splitType === 'unequal') {
      const splitTotal = participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
      if (Math.abs(splitTotal - total) > 0.01) {
        errors.split = `Total split (रु ${splitTotal.toFixed(2)}) must match total amount (रु ${total.toFixed(2)})`;
      }
    } else if (splitType === 'percentage') {
      const percentageTotal = participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
      if (Math.abs(percentageTotal - 100) > 0.01) {
        errors.split = `Total percentage (${percentageTotal.toFixed(1)}%) must equal 100%`;
      }
    } else if (splitType === 'shares') {
      const sharesTotal = participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
      if (sharesTotal <= 0) {
        errors.split = 'Total shares must be greater than zero';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateExpense()) return;
    setSubmitting(true);
    
    try {
      const expenseData = {
        groupId: selectedGroup!.id,
        description: description.trim(),
        amount: parseFloat(totalAmount),
        paidBy: payers.length === 1 ? payers[0].memberId : 'Multiple',
        payers: payers.map(p => ({ name: p.memberId, amountPaid: parseFloat(p.amountPaid) })),
        participants: participants.map(p => p.memberId),
        splits: participants.map(p => {
          // For shares and percentage, calculate actual amounts
          if (splitType === 'shares') {
            const shares = parseFloat(p.share) || 0;
            const totalShares = participants.reduce((sum, part) => sum + (parseFloat(part.share) || 0), 0);
            return { participant: p.memberId, amount: parseFloat(totalAmount) * shares / totalShares };
          } else if (splitType === 'percentage') {
            const percentage = parseFloat(p.share) || 0;
            return { participant: p.memberId, amount: parseFloat(totalAmount) * percentage / 100 };
          }
          return { participant: p.memberId, amount: parseFloat(p.share) };
        }),
        splitType,
        date,
        type: 'group' as const,
      };
      
      await apiService.createUnequalExpense(expenseData);
      void deleteExpenseDraft(`advanced-expense:${groupId || 'all'}`).catch(error =>
        console.error('Unable to clear group expense draft:', error));
      await limitService.incrementTransactions();
      toast.success('Expense added!');
      router.back();
    } catch (e: any) {
      console.error('Create unequal expense error:', e);
      if (e.code === 'OFFLINE_QUEUED') {
        void deleteExpenseDraft(`advanced-expense:${groupId || 'all'}`).catch(error =>
          console.error('Unable to clear queued group expense draft:', error));
        toast.info('Expense saved locally, pending sync. It is not included in balances yet.');
        router.replace('/profile/offline-sync');
        return;
      }
      let message = 'Failed to add expense.';
      if (e?.response?.data?.message) message = e.response.data.message;
      else if (e?.message) message = e.message;
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderGroupModal = () => (
    <Modal
      visible={groupModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setGroupModalVisible(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setGroupModalVisible(false)}>
        <Pressable style={styles.groupModalCard} onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <View style={styles.groupModalHeader}>
            <View>
              <Text style={styles.groupModalTitle}>Select group</Text>
              <Text style={styles.groupModalSubtitle}>Choose where to add this expense</Text>
            </View>
          </View>
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }}>
            {groups.map(group => (
              <Pressable
                key={group.id}
                style={[styles.groupModalItem, selectedGroup?.id === group.id && styles.groupModalItemSelected]}
                onPress={() => handleSelectGroup(group)}
              >
                <View style={styles.groupModalAvatars}>
                  {group.members.slice(0, 3).map(member => (
                    <View key={member.id} style={styles.groupModalAvatar}>
                      <Text style={styles.groupModalAvatarText}>{getInitials(member.name)}</Text>
                    </View>
                  ))}
                  {group.members.length > 3 && (
                    <View style={styles.groupModalAvatar}>
                      <Text style={styles.groupModalAvatarText}>+{group.members.length - 3}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupModalName}>{group.name}</Text>
                  <Text style={styles.groupModalMembers}>{group.members.length} members</Text>
                </View>
                {selectedGroup?.id === group.id && <Text style={styles.groupModalCheck}>✓</Text>}
              </Pressable>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.groupModalClose} onPress={() => setGroupModalVisible(false)}>
            <Text style={styles.groupModalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.action} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={24} color={COLORS.action} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
      </View>

      {/* Group Selector */}
      <TouchableOpacity 
        style={styles.groupSelectorCard} 
        onPress={() => setGroupModalVisible(true)}
      >
        <View style={styles.groupSelectorRow}>
          <View style={styles.groupSelectorAvatars}>
            {selectedGroup?.members.slice(0, 3).map(member => (
              <View key={member.id} style={styles.groupSelectorAvatar}>
                <Text style={styles.groupSelectorAvatarText}>{getInitials(member.name)}</Text>
              </View>
            ))}
            {selectedGroup && selectedGroup.members.length > 3 && (
              <View style={styles.groupSelectorAvatar}>
                <Text style={styles.groupSelectorAvatarText}>+{selectedGroup.members.length - 3}</Text>
              </View>
            )}
          </View>
          <View style={styles.groupSelectorTextContainer}>
            <Text style={styles.groupSelectorName}>{selectedGroup?.name || 'Select Group'}</Text>
            <Text style={styles.groupSelectorMembers}>{selectedGroup?.members.length || 0} members</Text>
          </View>
          <Text style={styles.groupSelectorDropdown}>▾</Text>
        </View>
      </TouchableOpacity>
      
      {renderGroupModal()}

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Expense Details */}
        <View style={styles.card}>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>रु</Text>
            <TextInput
              style={styles.amountInput}
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder="0.00"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="decimal-pad"
              maxLength={10}
              onFocus={() => setActiveField('amount')}
              onBlur={() => setActiveField(null)}
            />
          </View>
          
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (e.g. Dinner)"
                  placeholderTextColor={COLORS.textTertiary}
            maxLength={100}
            onFocus={() => setActiveField('description')}
            onBlur={() => setActiveField(null)}
          />
          
          <TouchableOpacity 
            style={styles.dateRow} 
            onPress={() => setDatePickerVisible(true)}
          >
            <Calendar size={18} color={COLORS.action} />
            <Text style={styles.dateText}>{date}</Text>
            <Text style={styles.dateEdit}>Edit</Text>
          </TouchableOpacity>
          
          {(formErrors.description || formErrors.totalAmount) && (
            <View style={styles.errorContainer}>
              {formErrors.description && <Text style={styles.errorText}>{formErrors.description}</Text>}
              {formErrors.totalAmount && <Text style={styles.errorText}>{formErrors.totalAmount}</Text>}
            </View>
          )}
        </View>

        {/* Who Paid Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Who paid?</Text>
          
          <View style={styles.payersContainer}>
            {payers.map((payer, idx) => (
              <View key={idx} style={styles.payerRow}>
                <View style={styles.payerInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(getMemberName(payer.memberId))}</Text>
                  </View>
                  <Text style={styles.payerName}>{getMemberName(payer.memberId)}</Text>
                </View>
                
                <View style={styles.payerAmountContainer}>
                  <TextInput
                    style={styles.payerAmountInput}
                    value={payer.amountPaid}
                    onChangeText={v => handlePayerAmount(idx, v)}
                    placeholder="रु 0.00"
                    placeholderTextColor={COLORS.textTertiary}
                    keyboardType="decimal-pad"
                    maxLength={10}
                    onFocus={() => setActiveField(`payer-${idx}`)}
                    onBlur={() => setActiveField(null)}
                  />
                  {payers.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removePayerBtn} 
                      onPress={() => handleRemovePayer(idx)}
                    >
                      <Minus size={16} color={COLORS.negative} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            
            {selectedGroup && payers.length < selectedGroup.members.length && (
              <TouchableOpacity style={styles.addPayerBtn} onPress={handleAddPayer}>
                <Plus size={20} color={COLORS.action} />
                <Text style={styles.addPayerBtnText}>Add payer</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Remaining amount display */}
          <View style={styles.remainingContainer}>
            <Text style={styles.remainingLabel}>Remaining:</Text>
            {(() => {
              const total = parseFloat(totalAmount) || 0;
              const paid = getTotalPaid();
              const remaining = total - paid;
              let color: string = COLORS.warning;
              if (remaining === 0) color = COLORS.positive;
              if (remaining < 0) color = COLORS.negative;
              
              return (
                <Text style={[styles.remainingAmount, { color }]}>
                  {remaining >= 0 ? `रु ${remaining.toFixed(2)}` : `-रु ${Math.abs(remaining).toFixed(2)}`}
                </Text>
              );
            })()}
          </View>
          
          {formErrors.paid && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{formErrors.paid}</Text>
            </View>
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
                >
                  <Icon size={20} color={isActive ? COLORS.actionText : COLORS.action} />
                  <Text style={[styles.splitMethodText, isActive && styles.splitMethodTextActive]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Participants List */}
        <View style={styles.card}>
          <View style={styles.participantsHeader}>
            <Text style={styles.sectionTitle}>Split between</Text>
            <Text style={styles.splitTypeHint}>
              {splitType === 'percentage' ? 'Enter %' : 
               splitType === 'shares' ? 'Enter shares' : 
               'Amount per person'}
            </Text>
          </View>
          
          <FlatList
            data={participants}
            scrollEnabled={false}
            keyExtractor={item => item.memberId}
            renderItem={({ item, index }) => (
              <View style={styles.participantRow}>
                <View style={styles.participantInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(getMemberName(item.memberId))}</Text>
                  </View>
                  <Text style={styles.participantName}>{getMemberName(item.memberId)}</Text>
                </View>
                
                <TextInput
                  style={styles.participantShareInput}
                  value={item.share}
                  onChangeText={v => handleParticipantShare(index, v)}
                  placeholder={splitType === 'percentage' ? '0%' : splitType === 'shares' ? '0' : 'रु 0.00'}
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  maxLength={10}
                  editable={splitType !== 'equal'}
                  onFocus={() => setActiveField(`participant-${index}`)}
                  onBlur={() => setActiveField(null)}
                />
              </View>
            )}
          />
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total paid:</Text>
            <Text style={styles.summaryValue}>रु {getTotalPaid().toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {splitType === 'percentage' ? 'Total %: ' : 
               splitType === 'shares' ? 'Total shares: ' : 
               'Total split: '}
            </Text>
            <Text style={styles.summaryValue}>
              {getTotalSplit().toFixed(2)}{splitType === 'percentage' ? '%' : ''}
            </Text>
          </View>
          
          {formErrors.split && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{formErrors.split}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Picker */}
      {datePickerVisible && (
        <DateTimePicker
          themeVariant={isDark ? 'dark' : 'light'}
          value={new Date(date)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!canAddExpense || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canAddExpense || submitting}
        >
          <View style={styles.submitGradient}>
            {submitting ? (
              <ActivityIndicator color={COLORS.actionText} />
            ) : (
              <Text style={styles.submitBtnText}>Add Expense</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      <AdModal
        visible={showAdModal}
        onClose={() => setShowAdModal(false)}
        onAdWatched={() => {}}
        adType="transaction"
      />
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    marginTop:20,

    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    marginLeft:50,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  groupSelectorCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  groupSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupSelectorAvatars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  groupSelectorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  groupSelectorAvatarText: {
    color: COLORS.action,
    fontWeight: '700',
    fontSize: 14,
  },
  groupSelectorTextContainer: {
    flex: 1,
  },
  groupSelectorName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  groupSelectorMembers: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  groupSelectorDropdown: {
    fontSize: 18,
    color: COLORS.action,
    marginLeft: 8,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  groupModalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    width: '100%',
    maxHeight: '88%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderStrong,
    marginBottom: 16,
  },
  groupModalHeader: {
    marginBottom: 14,
  },
  groupModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  groupModalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  groupModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  groupModalItemSelected: {
    backgroundColor: COLORS.surfaceSecondary,
  },
  groupModalAvatars: {
    flexDirection: 'row',
    marginRight: 16,
  },
  groupModalAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  groupModalAvatarText: {
    color: COLORS.action,
    fontWeight: '700',
    fontSize: 12,
  },
  groupModalName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  groupModalMembers: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  groupModalCheck: {
    fontSize: 18,
    color: COLORS.positive,
    fontWeight: '700',
    marginLeft: 8,
  },
  groupModalClose: {
    marginTop: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
  },
  groupModalCloseText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.action,
    fontFamily: 'Inter-Bold',
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 12,
    flex: 1,
    fontFamily: 'Inter-Bold',
  },
  descInput: {
    fontSize: 18,
    color: COLORS.textSecondary,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    fontFamily: 'Inter-Medium',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
  },
  dateText: {
    marginLeft: 12,
    color: COLORS.textTertiary,
    fontSize: 16,
    flex: 1,
    fontFamily: 'Inter-Medium',
  },
  dateEdit: {
    color: COLORS.action,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  payersContainer: {
    marginBottom: 16,
  },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  payerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.action,
    fontWeight: '700',
    fontSize: 16,
  },
  payerName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  payerAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payerAmountInput: {
    width: 100,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    textAlign: 'right',
    fontFamily: 'Inter-Medium',
  },
  removePayerBtn: {
    marginLeft: 12,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 999,
    padding: 8,
  },
  addPayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 999,
    padding: 16,
    justifyContent: 'center',
    marginTop: 8,
  },
  addPayerBtnText: {
    color: COLORS.action,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  remainingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    marginTop: 8,
  },
  remainingLabel: {
    fontSize: 16,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Medium',
  },
  remainingAmount: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  splitMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  splitMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
    justifyContent: 'center',
  },
  splitMethodBtnActive: {
    backgroundColor: COLORS.action,
  },
  splitMethodText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.action,
    fontFamily: 'Inter-SemiBold',
  },
  splitMethodTextActive: {
    color: COLORS.actionText,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitTypeHint: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  participantShareInput: {
    width: 100,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    textAlign: 'right',
    fontFamily: 'Inter-Medium',
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Medium',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  errorContainer: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: COLORS.negative,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.card,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitBtn: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.action,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: COLORS.actionText,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});