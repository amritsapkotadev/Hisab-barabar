import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { View } from './View';
import { Text } from './Text';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Profile, SplitMethod } from '@/types';
import { Receipt, DollarSign, Users, Percent } from 'lucide-react-native';

type ExpenseFormProps = {
  groupMembers: Profile[];
  onSubmit: (data: {
    title: string;
    amount: number;
    payers: { userId: string; amount: number }[];
    splitMethod: SplitMethod;
    splitDetails: {
      method: SplitMethod;
      shares: {
        [userId: string]: {
          amount?: number;
          share?: number;
          percentage?: number;
        };
      };
    };
    date: string;
    description?: string;
  }) => void;
  isLoading?: boolean;
};

export function ExpenseForm({ groupMembers, onSubmit, isLoading }: ExpenseFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [payers, setPayers] = useState<{ userId: string; amount: number }[]>([]);
  const [shares, setShares] = useState<{
    [userId: string]: { amount?: number; share?: number; percentage?: number };
  }>({});

  const textSecondaryColor = useThemeColor('textSecondary');
  const primaryColor = useThemeColor('primary');
  const backgroundColor = useThemeColor('backgroundSecondary');

  // Initialize shares for all members
  React.useEffect(() => {
    const initialShares = groupMembers.reduce((acc, member) => {
      acc[member.id] = {};
      return acc;
    }, {} as typeof shares);
    setShares(initialShares);
  }, [groupMembers]);

  const handleAddPayer = (userId: string, payAmount: number) => {
    setPayers([...payers, { userId, amount: payAmount }]);
  };

  const handleRemovePayer = (userId: string) => {
    setPayers(payers.filter(p => p.userId !== userId));
  };

  const handleUpdateShare = (userId: string, value: number) => {
    setShares(prev => ({
      ...prev,
      [userId]: {
        amount: splitMethod === 'unequal' ? value : undefined,
        share: splitMethod === 'share' ? value : undefined,
        percentage: splitMethod === 'percentage' ? value : undefined,
      },
    }));
  };

  const handleSubmit = () => {
    if (!title || !amount || payers.length === 0) return;

    onSubmit({
      title,
      amount: parseFloat(amount),
      payers,
      splitMethod,
      splitDetails: {
        method: splitMethod,
        shares,
      },
      date: new Date().toISOString(),
      description,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="heading2" style={styles.title}>Add New Expense</Text>

      <TextInput
        label="Title"
        placeholder="Enter expense title"
        value={title}
        onChangeText={setTitle}
        leftIcon={<Receipt size={20} color={textSecondaryColor} />}
      />

      <TextInput
        label="Amount"
        placeholder="Enter amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        leftIcon={<DollarSign size={20} color={textSecondaryColor} />}
      />

      <View style={styles.section}>
        <Text variant="heading3">Payers</Text>
        <View style={styles.payersList}>
          {groupMembers.map(member => (
            <View key={member.id} style={styles.payerItem}>
              <Avatar
                uri={member.avatar_url}
                name={member.display_name}
                size={40}
              />
              <View style={styles.payerInfo}>
                <Text variant="body">{member.display_name}</Text>
                <TextInput
                  placeholder="Amount paid"
                  keyboardType="numeric"
                  value={payers.find(p => p.userId === member.id)?.amount.toString()}
                  onChangeText={(value) => {
                    const amount = parseFloat(value) || 0;
                    if (amount > 0) {
                      handleAddPayer(member.id, amount);
                    } else {
                      handleRemovePayer(member.id);
                    }
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="heading3">Split Method</Text>
        <View style={styles.splitMethods}>
          {(['equal', 'unequal', 'share', 'percentage'] as SplitMethod[]).map(method => (
            <Button
              key={method}
              title={method.charAt(0).toUpperCase() + method.slice(1)}
              variant={splitMethod === method ? 'primary' : 'outline'}
              onPress={() => setSplitMethod(method)}
              style={styles.splitMethodButton}
            />
          ))}
        </View>

        <View style={styles.sharesList}>
          {groupMembers.map(member => (
            <View key={member.id} style={styles.shareItem}>
              <Avatar
                uri={member.avatar_url}
                name={member.display_name}
                size={32}
              />
              <Text style={styles.shareName}>{member.display_name}</Text>
              <TextInput
                placeholder={splitMethod === 'percentage' ? 'Percentage' : 'Amount/Share'}
                keyboardType="numeric"
                value={shares[member.id]?.[
                  splitMethod === 'unequal' ? 'amount' :
                  splitMethod === 'share' ? 'share' : 'percentage'
                ]?.toString()}
                onChangeText={(value) => handleUpdateShare(member.id, parseFloat(value) || 0)}
                style={styles.shareInput}
              />
            </View>
          ))}
        </View>
      </View>

      <TextInput
        label="Description (Optional)"
        placeholder="Add notes about this expense"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Button
        title="Add Expense"
        onPress={handleSubmit}
        isLoading={isLoading}
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
  },
  section: {
    marginVertical: 16,
  },
  payersList: {
    marginTop: 8,
  },
  payerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  payerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  splitMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 16,
  },
  splitMethodButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  sharesList: {
    marginTop: 16,
  },
  shareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareName: {
    flex: 1,
    marginLeft: 12,
  },
  shareInput: {
    width: 100,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});