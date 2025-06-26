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
  FlatList,
  Platform,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, DollarSign, Users, Calculator, Percent, Hash, Plus, Minus, Calendar } from 'lucide-react-native';
import { Group } from '@/types';
import { apiService } from '@/services/api';
import { limitService } from '@/services/limitService';
import AdModal from '@/components/AdModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

const SPLIT_METHODS = [
  { key: 'equal', label: 'Equal', icon: Users },
  { key: 'unequal', label: 'Unequal', icon: Calculator },
  { key: 'percentage', label: 'Percent', icon: Percent },
  { key: 'shares', label: 'Shares', icon: Hash },
];

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
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payers, setPayers] = useState<{ name: string; amountPaid: string }[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'unequal' | 'percentage' | 'shares'>('equal');
  const [participants, setParticipants] = useState<any[]>([]);
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

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groupsData = await apiService.getGroups();
        setGroups(groupsData);
        if (groupId) {
          const group = groupsData.find(g => g.id === groupId);
          if (group) {
            setSelectedGroup(group);
            setPayers([{ name: group.members[0], amountPaid: '' }]);
            setParticipants(group.members.map(m => ({ name: m, share: '' })));
          }
        } else if (groupsData.length > 0) {
          setSelectedGroup(groupsData[0]);
          setPayers([{ name: groupsData[0].members[0], amountPaid: '' }]);
          setParticipants(groupsData[0].members.map(m => ({ name: m, share: '' })));
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load groups');
      } finally {
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
    if (!selectedGroup) return;
    
    const total = parseFloat(totalAmount) || 0;
    if (splitType === 'equal' && total > 0) {
      const amounts = calculateEqualSplit(total, selectedGroup.members.length);
      setParticipants(selectedGroup.members.map((m, i) => ({ name: m, share: amounts[i].toFixed(2) })));
    }
  }, [totalAmount, splitType, selectedGroup]);

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setPayers([{ name: group.members[0], amountPaid: '' }]);
    setParticipants(group.members.map(m => ({ name: m, share: '' })));
    setGroupModalVisible(false);
  };

  const handleAddPayer = () => {
    if (!selectedGroup) return;
    const available = selectedGroup.members.filter(m => !payers.some(p => p.name === m));
    if (available.length > 0) {
      setPayers([...payers, { name: available[0], amountPaid: '' }]);
    }
  };

  const handleRemovePayer = (idx: number) => {
    if (payers.length > 1) setPayers(payers.filter((_, i) => i !== idx));
  };

  const handlePayerName = (idx: number, name: string) => {
    if (payers.some((p, i) => p.name === name && i !== idx)) return;
    setPayers(payers.map((p, i) => (i === idx ? { ...p, name } : p)));
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
      setParticipants(selectedGroup.members.map((m, i) => ({ name: m, share: amounts[i].toFixed(2) })));
    } else if (type === 'percentage') {
      setParticipants(selectedGroup.members.map(m => ({ name: m, share: (100 / selectedGroup.members.length).toFixed(1) })));
    } else if (type === 'shares') {
      setParticipants(selectedGroup.members.map(m => ({ name: m, share: '1' })));
    } else {
      setParticipants(selectedGroup.members.map(m => ({ name: m, share: '' })));
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
      errors.paid = `Total paid ($${paid.toFixed(2)}) must match total amount ($${total.toFixed(2)})`;
    }
    
    // Validate split amounts
    if (splitType === 'equal' || splitType === 'unequal') {
      const splitTotal = participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
      if (Math.abs(splitTotal - total) > 0.01) {
        errors.split = `Total split ($${splitTotal.toFixed(2)}) must match total amount ($${total.toFixed(2)})`;
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
        paidBy: payers.length === 1 ? payers[0].name : 'Multiple',
        payers: payers.map(p => ({ name: p.name, amountPaid: parseFloat(p.amountPaid) })),
        participants: participants.map(p => p.name),
        splits: participants.map(p => {
          // For shares and percentage, calculate actual amounts
          if (splitType === 'shares') {
            const shares = parseFloat(p.share) || 0;
            const totalShares = participants.reduce((sum, part) => sum + (parseFloat(part.share) || 0), 0);
            return { participant: p.name, amount: parseFloat(totalAmount) * shares / totalShares };
          } else if (splitType === 'percentage') {
            const percentage = parseFloat(p.share) || 0;
            return { participant: p.name, amount: parseFloat(totalAmount) * percentage / 100 };
          }
          return { participant: p.name, amount: parseFloat(p.share) };
        }),
        splitType,
        date,
      };
      
      await apiService.createUnequalExpense(expenseData);
      await limitService.incrementTransactions();
      Alert.alert('Success', 'Expense added!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      console.error('Create unequal expense error:', e);
      let message = 'Failed to add expense.';
      if (e?.response?.data?.message) message = e.response.data.message;
      else if (e?.message) message = e.message;
      Alert.alert('Error', message);
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
        <View style={styles.groupModalCard}>
          <Text style={styles.groupModalTitle}>Select Group</Text>
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }}>
            {groups.map(group => (
              <Pressable
                key={group.id}
                style={[styles.groupModalItem, selectedGroup?.id === group.id && styles.groupModalItemSelected]}
                onPress={() => handleSelectGroup(group)}
              >
                <View style={styles.groupModalAvatars}>
                  {group.members.slice(0, 3).map(m => (
                    <View key={m} style={styles.groupModalAvatar}>
                      <Text style={styles.groupModalAvatarText}>{getInitials(m)}</Text>
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
        </View>
      </Pressable>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#f8fafc', '#f1f5f9']} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#4f46e5" />
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
            {selectedGroup?.members.slice(0, 3).map(m => (
              <View key={m} style={styles.groupSelectorAvatar}>
                <Text style={styles.groupSelectorAvatarText}>{getInitials(m)}</Text>
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
          <Text style={styles.groupSelectorDropdown}>▼</Text>
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
            <DollarSign size={28} color="#7c3aed" />
            <TextInput
              style={styles.amountInput}
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
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
            placeholderTextColor="#94a3b8"
            maxLength={100}
            onFocus={() => setActiveField('description')}
            onBlur={() => setActiveField(null)}
          />
          
          <TouchableOpacity 
            style={styles.dateRow} 
            onPress={() => setDatePickerVisible(true)}
          >
            <Calendar size={18} color="#7c3aed" />
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
                    <Text style={styles.avatarText}>{getInitials(payer.name)}</Text>
                  </View>
                  <Text style={styles.payerName}>{payer.name}</Text>
                </View>
                
                <View style={styles.payerAmountContainer}>
                  <TextInput
                    style={styles.payerAmountInput}
                    value={payer.amountPaid}
                    onChangeText={v => handlePayerAmount(idx, v)}
                    placeholder="$0.00"
                    placeholderTextColor="#94a3b8"
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
                      <Minus size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
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
          
          {/* Remaining amount display */}
          <View style={styles.remainingContainer}>
            <Text style={styles.remainingLabel}>Remaining:</Text>
            {(() => {
              const total = parseFloat(totalAmount) || 0;
              const paid = getTotalPaid();
              const remaining = total - paid;
              let color = '#f59e0b';
              if (remaining === 0) color = '#10b981';
              if (remaining < 0) color = '#ef4444';
              
              return (
                <Text style={[styles.remainingAmount, { color }]}>
                  {remaining >= 0 ? `$${remaining.toFixed(2)}` : `-$${Math.abs(remaining).toFixed(2)}`}
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
                  <Icon size={20} color={isActive ? '#fff' : '#7c3aed'} />
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
            keyExtractor={item => item.name}
            renderItem={({ item, index }) => (
              <View style={styles.participantRow}>
                <View style={styles.participantInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                  </View>
                  <Text style={styles.participantName}>{item.name}</Text>
                </View>
                
                <TextInput
                  style={styles.participantShareInput}
                  value={item.share}
                  onChangeText={v => handleParticipantShare(index, v)}
                  placeholder={splitType === 'percentage' ? '0%' : splitType === 'shares' ? '0' : '$0.00'}
                  placeholderTextColor="#94a3b8"
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
            <Text style={styles.summaryValue}>${getTotalPaid().toFixed(2)}</Text>
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
          <LinearGradient
            colors={['#7c3aed', '#6d28d9']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Add Expense</Text>
            )}
          </LinearGradient>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: 'Inter-Bold',
  },
  groupSelectorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  groupSelectorAvatarText: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 14,
  },
  groupSelectorTextContainer: {
    flex: 1,
  },
  groupSelectorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: 'Inter-SemiBold',
  },
  groupSelectorMembers: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  groupSelectorDropdown: {
    fontSize: 18,
    color: '#7c3aed',
    marginLeft: 8,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  groupModalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  groupModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7c3aed',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  groupModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  groupModalItemSelected: {
    backgroundColor: '#f5f3ff',
  },
  groupModalAvatars: {
    flexDirection: 'row',
    marginRight: 16,
  },
  groupModalAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  groupModalAvatarText: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 12,
  },
  groupModalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'Inter-SemiBold',
  },
  groupModalMembers: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  groupModalCheck: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '700',
    marginLeft: 8,
  },
  groupModalClose: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  groupModalCloseText: {
    color: '#7c3aed',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#7c3aed',
    marginLeft: 12,
    flex: 1,
    fontFamily: 'Inter-Bold',
  },
  descInput: {
    fontSize: 18,
    color: '#334155',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    fontFamily: 'Inter-Medium',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  dateText: {
    marginLeft: 12,
    color: '#64748b',
    fontSize: 16,
    flex: 1,
    fontFamily: 'Inter-Medium',
  },
  dateEdit: {
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
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
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 16,
  },
  payerName: {
    fontSize: 16,
    color: '#334155',
    fontFamily: 'Inter-Medium',
  },
  payerAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payerAmountInput: {
    width: 100,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    textAlign: 'right',
    fontFamily: 'Inter-Medium',
  },
  removePayerBtn: {
    marginLeft: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 8,
  },
  addPayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    marginTop: 8,
  },
  addPayerBtnText: {
    color: '#7c3aed',
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
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginTop: 8,
  },
  remainingLabel: {
    fontSize: 16,
    color: '#64748b',
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
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
    justifyContent: 'center',
  },
  splitMethodBtnActive: {
    backgroundColor: '#7c3aed',
  },
  splitMethodText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#7c3aed',
    fontFamily: 'Inter-SemiBold',
  },
  splitMethodTextActive: {
    color: '#fff',
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitTypeHint: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Inter-Regular',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 16,
    color: '#334155',
    fontFamily: 'Inter-Medium',
  },
  participantShareInput: {
    width: 100,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    textAlign: 'right',
    fontFamily: 'Inter-Medium',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Inter-Medium',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: 'Inter-Bold',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});