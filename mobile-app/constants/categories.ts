import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Display colours and icons for personal expense categories (matches the picker on the add/edit screen).
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF6B6B',
  Transport: '#4ECDC4',
  Shopping: '#FFA07A',
  Entertainment: '#A569BD',
  Bills: '#5DADE2',
  Health: '#F06292',
  Education: '#4DB6AC',
  Travel: '#7986CB',
  Gifts: '#FF8A65',
};

export const CATEGORY_ICONS: Record<string, IconName> = {
  Food: 'fast-food',
  Transport: 'car',
  Shopping: 'cart',
  Entertainment: 'film',
  Bills: 'receipt',
  Health: 'medkit',
  Education: 'book',
  Travel: 'airplane',
  Gifts: 'gift',
};

export const PAYMENT_COLORS: Record<string, string> = {
  Cash: '#2E9E6B',
  'Credit Card': '#5B6CE0',
  'Debit Card': '#2F9BD6',
  'Bank Transfer': '#E0894A',
  'Digital Wallet': '#A569BD',
};

export const PAYMENT_ICONS: Record<string, IconName> = {
  Cash: 'wallet',
  'Credit Card': 'card',
  'Debit Card': 'card',
  'Bank Transfer': 'business',
  'Digital Wallet': 'phone-portrait',
};
