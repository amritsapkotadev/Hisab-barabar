import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { Expense, Profile } from '@/types';
import { View } from './View';
import { Text } from './Text';
import { Avatar } from './Avatar';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ShoppingCart, Coffee, Plane, Utensils, Car, Home, Film, Book, Gift, MoreHorizontal } from 'lucide-react-native';

type ExpenseListItemProps = {
  expense: Expense & {
    paidBy: Profile;
  };
  onPress?: () => void;
};

export function ExpenseListItem({ expense, onPress }: ExpenseListItemProps) {
  const primaryColor = useThemeColor('primary');
  const secondaryColor = useThemeColor('secondary');
  const textSecondary = useThemeColor('textSecondary');
  
  const getCategoryIcon = () => {
    const iconProps = { size: 20, color: primaryColor };
    
    switch(expense.category) {
      case 'food': return <Utensils {...iconProps} />;
      case 'transportation': return <Car {...iconProps} />;
      case 'accommodation': return <Home {...iconProps} />;
      case 'entertainment': return <Film {...iconProps} />;
      case 'shopping': return <ShoppingCart {...iconProps} />;
      case 'coffee': return <Coffee {...iconProps} />;
      case 'travel': return <Plane {...iconProps} />;
      case 'education': return <Book {...iconProps} />;
      case 'gift': return <Gift {...iconProps} />;
      default: return <MoreHorizontal {...iconProps} />;
    }
  };

  const formattedDate = format(new Date(expense.date), 'MMM d, yyyy');
  const formattedAmount = expense.amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.container} variant="card">
        <View style={styles.iconContainer}>
          {getCategoryIcon()}
        </View>
        
        <View style={styles.contentContainer}>
          <Text variant="body" bold>{expense.title}</Text>
          <Text variant="bodySmall" style={{ color: textSecondary }}>
            {formattedDate} • Paid by {expense.paidBy.display_name}
          </Text>
        </View>
        
        <View style={styles.amountContainer}>
          <Text variant="body" bold style={{ color: secondaryColor }}>
            {formattedAmount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(15, 157, 88, 0.1)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  amountContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});