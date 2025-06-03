import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  View as RNView,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { createExpense, ExpenseSplit } from '@/services/expenses';
import { 
  Receipt, 
  DollarSign, 
  User, 
  Percent, 
  PieChart, 
  ArrowRight,
  XCircle
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

type SplitMethod = 'equal' | 'unequal' | 'percentage' | 'share';
type Payer = { userId: string; amount: string };

const mockGroupMembers = [
  { id: '1', name: 'Alex Morgan', email: 'alex@example.com' },
  { id: '2', name: 'Jamie Smith', email: 'jamie@example.com' },
  { id: '3', name: 'Taylor Johnson', email: 'taylor@example.com' },
  { id: '4', name: 'Jordan Williams', email: 'jordan@example.com' },
];

export default function CreateExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [payers, setPayers] = useState<Payer[]>([{ userId: '', amount: '' }]);
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [totalValidation, setTotalValidation] = useState({ paid: 0, owed: 0 });

  const { user } = useAuth();
  const groupMembers = mockGroupMembers;

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    groupMembers.forEach(member => {
      initialValues[member.id] = splitMethod === 'share' ? '1' : 
                                splitMethod === 'percentage' ? '0' : 
                                (parseFloat(amount) > 0 
                                  ? (parseFloat(amount) / groupMembers.length).toFixed(2) 
                                  : '0');
    });
    setSplitValues(initialValues);
  }, [groupMembers, splitMethod]);

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setSplits([]);
      setTotalValidation({ paid: 0, owed: 0 });
      return;
    }

    const totalAmount = parseFloat(amount);
    let newSplits: ExpenseSplit[] = [];
    let newError = '';

    if (splitMethod === 'equal') {
      const equalAmount = totalAmount / groupMembers.length;
      newSplits = groupMembers.map(member => ({
        userId: member.id,
        paidAmount: 0,
        owedAmount: parseFloat(equalAmount.toFixed(2)),
      }));
    } else if (splitMethod === 'percentage') {
      let totalPercentage = 0;
      groupMembers.forEach(member => {
        const percentage = parseFloat(splitValues[member.id]) || 0;
        totalPercentage += percentage;
      });

      if (Math.abs(totalPercentage - 100) > 0.01) {
        newError = `Total percentage must be 100% (currently ${totalPercentage.toFixed(2)}%)`;
      }

      newSplits = groupMembers.map(member => {
        const percentage = parseFloat(splitValues[member.id]) || 0;
        const amountForMember = (totalAmount * percentage) / 100;
        return {
          userId: member.id,
          paidAmount: 0,
          owedAmount: parseFloat(amountForMember.toFixed(2))
        };
      });
    } else if (splitMethod === 'share') {
      let totalShares = 0;
      groupMembers.forEach(member => {
        const shares = parseFloat(splitValues[member.id]) || 0;
        totalShares += shares;
      });

      if (totalShares <= 0) {
        newError = 'Total shares must be greater than 0';
      } else {
        newSplits = groupMembers.map(member => {
          const shares = parseFloat(splitValues[member.id]) || 0;
          const amountForMember = (totalAmount * shares) / totalShares;
          return {
            userId: member.id,
            paidAmount: 0,
            owedAmount: parseFloat(amountForMember.toFixed(2))
          };
        });
      }
    } else if (splitMethod === 'unequal') {
      let totalOwed = 0;
      groupMembers.forEach(member => {
        const owed = parseFloat(splitValues[member.id]) || 0;
        totalOwed += owed;
      });

      if (Math.abs(totalOwed - totalAmount) > 0.01) {
        newError = `Total owed (${totalOwed.toFixed(2)}) doesn't match expense amount (${totalAmount.toFixed(2)})`;
      } else {
        newSplits = groupMembers.map(member => ({
          userId: member.id,
          paidAmount: 0,
          owedAmount: parseFloat(splitValues[member.id]) || 0,
        }));
      }
    }

    const owedTotal = newSplits.reduce((sum, split) => sum + split.owedAmount, 0);
    let paidTotal = 0;
    payers.forEach(payer => {
      const paidAmount = parseFloat(payer.amount) || 0;
      paidTotal += paidAmount;
    });

    setSplits(newSplits);
    setError(newError);
    setTotalValidation({ paid: paidTotal, owed: owedTotal });
  }, [amount, splitMethod, splitValues, payers]);

  const addPayer = () => {
    setPayers([...payers, { userId: '', amount: '' }]);
  };

  const removePayer = (index: number) => {
    if (payers.length <= 1) return;
    const newPayers = [...payers];
    newPayers.splice(index, 1);
    setPayers(newPayers);
  };

  const updatePayer = (index: number, field: keyof Payer, value: string) => {
    const newPayers = [...payers];
    newPayers[index][field] = value;
    setPayers(newPayers);
  };

  const updateSplitValue = (userId: string, value: string) => {
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setSplitValues(prev => ({ ...prev, [userId]: value }));
  };

  const UserAvatar = ({ name, size }: { name: string; size: number }) => (
    <RNView style={[styles.avatar, { width: size, height: size }]}>
      <Text style={styles.avatarText}>{name.charAt(0)}</Text>
    </RNView>
  );

  const handleCreateExpense = async () => {
    if (!user || !groupId) {
      setError('User or group information missing');
      return;
    }
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    const totalAmount = parseFloat(amount);
    let paidTotal = 0;
    const paidSplits: ExpenseSplit[] = [];
    
    for (const payer of payers) {
      if (!payer.userId) {
        setError('Please select a payer for all entries');
        return;
      }
      
      const paidAmount = parseFloat(payer.amount);
      if (isNaN(paidAmount) || paidAmount <= 0) {
        setError('Please enter a valid amount for all payers');
        return;
      }
      
      paidTotal += paidAmount;
      
      const existingIndex = paidSplits.findIndex(s => s.userId === payer.userId);
      if (existingIndex >= 0) {
        paidSplits[existingIndex].paidAmount += paidAmount;
      } else {
        paidSplits.push({
          userId: payer.userId,
          paidAmount,
          owedAmount: 0,
        });
      }
    }
    
    if (Math.abs(paidTotal - totalAmount) > 0.01) {
      setError(`Paid total (${paidTotal.toFixed(2)}) doesn't match expense amount (${totalAmount.toFixed(2)})`);
      return;
    }
    
    const owedTotal = splits.reduce((sum, split) => sum + split.owedAmount, 0);
    if (Math.abs(owedTotal - totalAmount) > 0.01) {
      setError(`Owed total (${owedTotal.toFixed(2)}) doesn't match expense amount (${totalAmount.toFixed(2)})`);
      return;
    }
    
    const finalSplits = splits.map(split => {
      const paidSplit = paidSplits.find(p => p.userId === split.userId);
      return {
        userId: split.userId,
        paidAmount: paidSplit?.paidAmount || 0,
        owedAmount: split.owedAmount,
      };
    });
    
    paidSplits.forEach(paidSplit => {
      if (!finalSplits.some(s => s.userId === paidSplit.userId)) {
        finalSplits.push({
          userId: paidSplit.userId,
          paidAmount: paidSplit.paidAmount,
          owedAmount: 0,
        });
      }
    });

    setIsLoading(true);
    try {
      const { error } = await createExpense(
        groupId,
        title.trim(),
        totalAmount,
        user.id,
        new Date(),
        finalSplits
      );

      if (error) throw error;
      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container} variant="screen">
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="heading1" style={styles.title}>Create New Expense</Text>
        <Text style={styles.subtitle}>
          Add a new expense and split it with your group
        </Text>

        <View style={styles.card}>
          {/* Expense Details */}
          <Text style={styles.sectionHeader}>Expense Details</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              label="Title"
              placeholder="Dinner, Rent, Groceries..."
              value={title}
              onChangeText={setTitle}
              containerStyle={styles.inputField}
              leftIcon={<Receipt size={20} color="#6B7280" />}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Total Amount"
              placeholder="0.00"
              value={amount}
              onChangeText={(text) => {
                if (text && !/^\d*\.?\d*$/.test(text)) return;
                setAmount(text);
              }}
              keyboardType="numeric"
              containerStyle={styles.inputField}
              leftIcon={<DollarSign size={20} color="#6B7280" />}
            />
          </View>

          {/* Paid By Section */}
          <Text style={styles.sectionHeader}>Paid By</Text>
          
          {payers.map((payer, index) => (
            <RNView key={index} style={styles.payerRow}>
              <RNView style={[styles.payerSelector, Platform.OS === 'ios' && styles.iosPicker]}>
                <Picker
                  selectedValue={payer.userId}
                  onValueChange={(value) => updatePayer(index, 'userId', value)}
                  style={styles.picker}
                  dropdownIconColor="#6B7280"
                >
                  <Picker.Item label="Select payer..." value="" />
                  {groupMembers.map(member => (
                    <Picker.Item 
                      key={member.id} 
                      label={member.name} 
                      value={member.id} 
                    />
                  ))}
                </Picker>
              </RNView>
              
              <TextInput
                placeholder="Amount"
                value={payer.amount}
                onChangeText={(value) => {
                  if (value && !/^\d*\.?\d*$/.test(value)) return;
                  updatePayer(index, 'amount', value);
                }}
                keyboardType="numeric"
                containerStyle={styles.payerAmountInput}
              />
              
              {payers.length > 1 && (
                <TouchableOpacity 
                  onPress={() => removePayer(index)}
                  style={styles.removePayerButton}
                >
                  <XCircle size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </RNView>
          ))}
          
          <Button 
            title="Add Another Payer" 
            onPress={addPayer} 
            variant="outline"
            style={styles.addButton}
            textStyle={styles.addButtonText}
          />

          {/* Split Method */}
          <Text style={styles.sectionHeader}>Split Method</Text>
          
          <RNView style={styles.splitMethodContainer}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                splitMethod === 'equal' && styles.methodButtonActive
              ]}
              onPress={() => setSplitMethod('equal')}
            >
              <PieChart size={24} color={splitMethod === 'equal' ? '#6366F1' : '#6B7280'} />
              <Text style={[
                styles.methodText,
                splitMethod === 'equal' && styles.methodTextActive
              ]}>
                Equal
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.methodButton,
                splitMethod === 'unequal' && styles.methodButtonActive
              ]}
              onPress={() => setSplitMethod('unequal')}
            >
              <User size={24} color={splitMethod === 'unequal' ? '#6366F1' : '#6B7280'} />
              <Text style={[
                styles.methodText,
                splitMethod === 'unequal' && styles.methodTextActive
              ]}>
                Unequal
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.methodButton,
                splitMethod === 'percentage' && styles.methodButtonActive
              ]}
              onPress={() => setSplitMethod('percentage')}
            >
              <Percent size={24} color={splitMethod === 'percentage' ? '#6366F1' : '#6B7280'} />
              <Text style={[
                styles.methodText,
                splitMethod === 'percentage' && styles.methodTextActive
              ]}>
                %
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.methodButton,
                splitMethod === 'share' && styles.methodButtonActive
              ]}
              onPress={() => setSplitMethod('share')}
            >
              <Text style={[
                styles.methodText,
                splitMethod === 'share' && styles.methodTextActive
              ]}>
                Shares
              </Text>
            </TouchableOpacity>
          </RNView>

          {/* Split Details */}
          <Text style={styles.sectionHeader}>Split Details</Text>
          
          {groupMembers.map(member => (
            <RNView key={member.id} style={styles.splitRow}>
              <RNView style={styles.memberInfo}>
                <UserAvatar name={member.name} size={40} />
                <Text style={styles.memberName}>{member.name}</Text>
              </RNView>
              
              <RNView style={styles.splitInputContainer}>
                {splitMethod === 'equal' ? (
                  <Text style={styles.splitAmount}>
                    ${splits.find(s => s.userId === member.id)?.owedAmount.toFixed(2) || '0.00'}
                  </Text>
                ) : (
                  <TextInput
                    value={splitValues[member.id] || '0'}
                    onChangeText={(value) => updateSplitValue(member.id, value)}
                    keyboardType="numeric"
                    containerStyle={styles.splitInput}
                  />
                )}
                
                {splitMethod !== 'equal' && (
                  <Text style={styles.splitUnit}>
                    {splitMethod === 'percentage' ? '%' : 
                     splitMethod === 'share' ? 'shares' : ''}
                  </Text>
                )}
              </RNView>
              
              <Text style={styles.owedAmount}>
                ${splits.find(s => s.userId === member.id)?.owedAmount.toFixed(2) || '0.00'}
              </Text>
            </RNView>
          ))}

          {/* Validation Summary */}
          <RNView style={styles.validationContainer}>
            <RNView style={styles.validationRow}>
              <Text style={styles.validationLabel}>Paid Total:</Text>
              <Text style={styles.validationValue}>${totalValidation.paid.toFixed(2)}</Text>
            </RNView>
            <RNView style={styles.validationRow}>
              <Text style={styles.validationLabel}>Owed Total:</Text>
              <Text style={styles.validationValue}>${totalValidation.owed.toFixed(2)}</Text>
            </RNView>
            <RNView style={styles.validationRow}>
              <Text style={styles.validationLabel}>Expense Amount:</Text>
              <Text style={styles.validationValue}>${amount || '0.00'}</Text>
            </RNView>
          </RNView>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Button
            title="Create Expense"
            onPress={handleCreateExpense}
            isLoading={isLoading}
            style={styles.createButton}
            rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  payerSelector: {
    flex: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  iosPicker: {
    height: 120,
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 48,
    color: '#1E293B',
  },
  payerAmountInput: {
    flex: 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  removePayerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButton: {
    marginTop: 8,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 46,
  },
  addButtonText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  splitMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  methodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 76,
    height: 76,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  methodButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  methodText: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  methodTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 3,
  },
  memberName: {
    marginLeft: 12,
    fontWeight: '500',
    fontSize: 16,
  },
  splitInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  splitInput: {
    width: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginRight: 8,
  },
  splitUnit: {
    color: '#94A3B8',
    fontSize: 14,
    width: 50,
    textAlign: 'right',
  },
  splitAmount: {
    fontWeight: '600',
    color: '#1E293B',
    fontSize: 16,
  },
  owedAmount: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '700',
    color: '#1E293B',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
  },
  createButton: {
    marginTop: 24,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    height: 56,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#64748B',
    fontSize: 18,
  },
  validationContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  validationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  validationLabel: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '500',
  },
  validationValue: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '600',
  },
});