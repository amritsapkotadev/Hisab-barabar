import React from 'react';
import { StyleSheet } from 'react-native';
import { GroupSummary } from '@/types';
import { Card } from './Card';
import { Text } from './Text';
import { View } from './View';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Users } from 'lucide-react-native';

type GroupCardProps = {
  group: GroupSummary;
  onPress: () => void;
};

export function GroupCard({ group, onPress }: GroupCardProps) {
  const textSecondaryColor = useThemeColor('textSecondary');
  const successColor = useThemeColor('success');
  const errorColor = useThemeColor('error');
  const primaryColor = useThemeColor('primary');
  
  const balanceColor = group.yourBalance > 0 ? successColor : group.yourBalance < 0 ? errorColor : textSecondaryColor;
  
  const formattedBalance = Math.abs(group.yourBalance).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  
  const balanceText = group.yourBalance > 0 
    ? `You are owed ${formattedBalance}` 
    : group.yourBalance < 0 
      ? `You owe ${formattedBalance}`
      : 'All settled up';

  return (
    <Card elevated onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}20` }]}>
          <Users size={24} color={primaryColor} />
        </View>
        <View style={styles.headerContent}>
          <Text variant="heading3">{group.name}</Text>
          <Text variant="bodySmall" style={{ color: textSecondaryColor }}>
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View>
          <Text variant="bodySmall" style={{ color: textSecondaryColor }}>Total Expenses</Text>
          <Text variant="body" bold>
            {group.totalExpenses.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </Text>
        </View>
        
        <View>
          <Text variant="bodySmall" style={{ color: textSecondaryColor }}>Balance</Text>
          <Text variant="body" bold style={{ color: balanceColor }}>
            {balanceText}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});