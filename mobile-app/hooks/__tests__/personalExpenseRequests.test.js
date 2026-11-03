import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import AddPersonalExpense from '../../app/add-personal-expense';
import { apiService } from '@/services/api';
import { loadExpenseDraft } from '@/services/dataClient';

let mockUser;
let mockParams;
const mockRefreshUser = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, refreshUser: mockRefreshUser }),
}));
jest.mock('@/services/api', () => ({
  apiService: {
    getUserProfile: jest.fn(),
    createPersonalExpense: jest.fn(),
    updatePersonalExpense: jest.fn(),
  },
}));
jest.mock('@/services/dataClient', () => ({
  loadExpenseDraft: jest.fn(),
  saveExpenseDraft: jest.fn(async () => {}),
  deleteExpenseDraft: jest.fn(async () => {}),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  router: { back: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/hooks/useTheme', () => ({
  useThemedStyles: () => ({ colors: {}, styles: {} }),
  useTheme: () => ({ isDark: false }),
}));
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ error: jest.fn(), success: jest.fn(), info: jest.fn() }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, MaterialIcons: () => null, FontAwesome5: () => null }));
jest.mock('lucide-react-native', () => ({ ArrowLeft: () => null }));
jest.mock('@react-native-community/datetimepicker', () => () => null);
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
}));

describe('Personal Add Expense request scope', () => {
  let renderer;
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    mockUser = { id: 'user-1', name: 'Test' };
    mockParams = {};
    loadExpenseDraft.mockResolvedValue({
      amount: '25', note: 'Lunch', category: 'Food',
      date: '2026-11-02T00:00:00.000Z', paymentMethod: 'Cash',
    });
    mockRefreshUser.mockResolvedValue(mockUser);
    apiService.createPersonalExpense.mockResolvedValue({ id: 'expense-1' });
    apiService.updatePersonalExpense.mockResolvedValue({ id: 'expense-1', revision: 3 });
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    renderer = null;
  });

  const submit = async (label = 'Add Expense') => {
    const button = renderer.root.findAllByType(TouchableOpacity).find(item =>
      item.findAllByType(Text).some(text => text.props.children === label));
    expect(button).toBeDefined();
    await act(async () => button.props.onPress());
  };

  it('opens and saves using auth identity without fetching the profile', async () => {
    await act(async () => { renderer = create(<AddPersonalExpense />); });
    expect(apiService.getUserProfile).not.toHaveBeenCalled();
    expect(mockRefreshUser).not.toHaveBeenCalled();
    await submit();
    expect(apiService.createPersonalExpense).toHaveBeenCalledWith(expect.objectContaining({
      amount: 25, paidBy: 'Test', participants: ['Test'], createdBy: 'user-1',
    }));
    expect(mockRefreshUser).not.toHaveBeenCalled();
    expect(apiService.getUserProfile).not.toHaveBeenCalled();
  });

  it('only resolves a missing auth identity when saving, not when opening', async () => {
    mockUser = null;
    await act(async () => { renderer = create(<AddPersonalExpense />); });
    expect(mockRefreshUser).not.toHaveBeenCalled();
    await submit();
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    expect(apiService.createPersonalExpense).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 'user-1' }));
  });

  it('edits with the authenticated identity and original revision without a profile read', async () => {
    mockParams = {
      expenseId: 'expense-1', amount: '42', description: 'Edited lunch',
      category: 'Food', paymentMethod: 'Cash', date: '2026-11-02', revision: '2',
    };
    await act(async () => { renderer = create(<AddPersonalExpense />); });
    await submit('Update Expense');
    expect(apiService.updatePersonalExpense).toHaveBeenCalledWith(
      'expense-1', expect.objectContaining({ amount: 42, paidBy: 'Test', participants: ['Test'] }), 2,
    );
    expect(apiService.getUserProfile).not.toHaveBeenCalled();
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });
});
