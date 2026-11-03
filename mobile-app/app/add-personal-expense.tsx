import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';

import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '@/services/api';
import { deleteExpenseDraft, loadExpenseDraft, saveExpenseDraft } from '@/services/dataClient';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

import { type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

const AddExpenseScreen = () => {
  const draftKey = 'personal-expense-create';
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [animation] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  const params = useLocalSearchParams();
  const isEditMode = !!params.expenseId;

  useEffect(() => {
    let active = true;
    if (isEditMode) {
      setDraftReady(true);
      return () => { active = false; };
    }
    void loadExpenseDraft<{
      amount: string;
      note: string;
      category: string;
      date: string;
      paymentMethod: string;
    }>(draftKey).then(draft => {
      if (!active) return;
      if (draft) {
        setAmount(draft.amount);
        setNote(draft.note);
        setCategory(draft.category);
        const restoredDate = new Date(draft.date);
        if (Number.isFinite(restoredDate.getTime())) setDate(restoredDate);
        setPaymentMethod(draft.paymentMethod);
      }
      setDraftReady(true);
    }).catch(error => {
      if (!active) return;
      console.error('Unable to restore personal expense draft:', error);
      setDraftReady(true);
    });
    return () => { active = false; };
  }, [isEditMode]);

  useEffect(() => {
    if (!draftReady || isEditMode) return;
    const timer = setTimeout(() => {
      void saveExpenseDraft(draftKey, {
        amount, note, category, date: date.toISOString(), paymentMethod,
      }).catch(error => console.error('Unable to save personal expense draft:', error));
    }, 300);
    return () => clearTimeout(timer);
  }, [draftReady, isEditMode, amount, note, category, date, paymentMethod]);

  useEffect(() => {
    if (isEditMode) {
      setAmount(Array.isArray(params.amount) ? params.amount[0] : (params.amount || ''));
      setNote(Array.isArray(params.description) ? params.description[0] : (params.description || ''));
      setCategory(Array.isArray(params.category) ? params.category[0] : (params.category || 'Food'));
      setPaymentMethod(Array.isArray(params.paymentMethod) ? params.paymentMethod[0] : (params.paymentMethod || 'Cash'));
      
      setDate(
        params.date
          ? new Date(Array.isArray(params.date) ? params.date[0] : params.date)
          : new Date()
      );
    }
  }, []);

  const categories: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    gradient: readonly [string, string];
  }> = [
    { id: '1', name: 'Food', icon: 'fast-food', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF8E8E'] },
    { id: '2', name: 'Transport', icon: 'car', color: '#4ECDC4', gradient: ['#4ECDC4', '#6EE7DF'] },
    { id: '3', name: 'Shopping', icon: 'cart', color: '#FFA07A', gradient: ['#FFA07A', '#FFB894'] },
    { id: '4', name: 'Entertainment', icon: 'film', color: '#A569BD', gradient: ['#A569BD', '#C085D9'] },
    { id: '5', name: 'Bills', icon: 'receipt', color: '#5DADE2', gradient: ['#5DADE2', '#7BBDE8'] },
    { id: '6', name: 'Health', icon: 'medkit', color: '#F06292', gradient: ['#F06292', '#F48FB1'] },
    { id: '7', name: 'Education', icon: 'book', color: '#4DB6AC', gradient: ['#4DB6AC', '#6ECFC4'] },
    { id: '8', name: 'Travel', icon: 'airplane', color: '#7986CB', gradient: ['#7986CB', '#9FA8DA'] },
    { id: '9', name: 'Gifts', icon: 'gift', color: '#FF8A65', gradient: ['#FF8A65', '#FFAB91'] },
  ];

  const paymentMethods = [
    { name: 'Cash', icon: 'wallet', color: '#2E9E6B' },
    { name: 'Credit Card', icon: 'card', color: '#5B6CE0' },
    { name: 'Debit Card', icon: 'card', color: '#2F9BD6' },
    { name: 'Bank Transfer', icon: 'business', color: '#E0894A' },
    { name: 'Digital Wallet', icon: 'phone-portrait', color: '#A569BD' },
  ];

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    // Android shows a one-shot dialog; the iOS spinner stays open until "Done".
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const triggerAnimation = () => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 150,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 150,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddExpense = async () => {
    if (!amount || isNaN(Number(amount)) || !category || !note) {
      triggerAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Please fill all fields.');
      return;
    }

    setLoading(true);
    try {
      const expenseUser = user ?? await refreshUser();
      if (isEditMode) {
        await apiService.updatePersonalExpense(
          params.expenseId as string,
          {
            description: note,
            amount: Number(amount),
            date: date.toISOString(),
            type: 'personal',
            paidBy: expenseUser.name,
            participants: [expenseUser.name],
            paymentMethod,
            category,
          },
          Number(Array.isArray(params.revision) ? params.revision[0] : params.revision)
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success('Expense updated successfully!');
        router.replace('/(tabs)');
      }
      else {
        await apiService.createPersonalExpense({
          description: note,
          amount: Number(amount),
          date: date.toISOString(),
          type: 'personal',
          paidBy: expenseUser.name,
          participants: [expenseUser.name],
          paymentMethod,
          category,
          createdBy: expenseUser.id,
        });
        void deleteExpenseDraft(draftKey).catch(error =>
          console.error('Unable to clear saved personal expense draft:', error));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success('Expense added successfully!');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Add expense error:', err);
      if (err.code === 'OFFLINE_QUEUED') {
        if (!isEditMode) {
          void deleteExpenseDraft(draftKey).catch(error =>
            console.error('Unable to clear queued personal expense draft:', error));
        }
        toast.info(isEditMode
          ? 'Edit saved locally, pending sync.'
          : 'Expense saved locally, pending sync. It is not included in your balance yet.');
        router.replace('/profile/offline-sync');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(err.message || 'Failed to add expense.');
    } finally {
      setLoading(false);
    }
  };

  const animatedStyle = {
    transform: [
      {
        translateX: animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, -10, 0],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={COLORS.action} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Expense' : 'Add Expense'}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Input Card */}
          <Animated.View style={[styles.card, styles.amountCard, animatedStyle]}>
            <View style={[styles.cardHeader, styles.dateRow]}>
              <Ionicons name="wallet" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Amount</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currency}>रु</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus={!isEditMode}
                  editable={!loading}
                />
              </View>
            </View>
          </Animated.View>

          {/* Category Selection Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => !loading && setShowCategoryModal(true)}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={[styles.cardHeader, styles.dateRow]}>
              <Ionicons name="grid" size={20} color={COLORS.secondary} />
              <Text style={styles.cardTitle}>Category</Text>
              <View style={styles.categoryValue}>
                {category ? (
                  <View style={styles.categoryBadge}>
                    <View
                      style={[
                        styles.categoryGradient,
                        { backgroundColor: categories.find((c) => c.name === category)?.color || COLORS.action },
                      ]}
                    >
                      <Ionicons
                        name={categories.find((c) => c.name === category)?.icon as any || 'help'}
                        size={16}
                        color={COLORS.actionText}
                      />
                      <Text style={styles.categoryText}>{category}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Select category</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </View>
          </TouchableOpacity>

          {/* Note Input Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color={COLORS.accent} />
              <Text style={styles.cardTitle}>Note</Text>
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="What was this expense for?"
              placeholderTextColor={COLORS.textTertiary}
              value={note}
              onChangeText={setNote}
              multiline
              editable={!loading}
            />
          </View>

          {/* Date Selection Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => !loading && setShowDatePicker(true)}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={[styles.cardHeader, styles.dateRow]}>
              <Ionicons name="calendar" size={20} color={COLORS.success} />
              <Text style={styles.cardTitle}>Date</Text>
              <Text style={[styles.dateText, styles.dateValue]}>
                {date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </TouchableOpacity>
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              themeVariant={isDark ? 'dark' : 'light'}
              value={date}
              mode="date"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
          {showDatePicker && Platform.OS === 'ios' && (
            <View style={[styles.card, styles.pickerCard]}>
              <DateTimePicker
                themeVariant={isDark ? 'dark' : 'light'}
                value={date}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
              <TouchableOpacity
                style={styles.pickerDone}
                onPress={() => setShowDatePicker(false)}
                accessibilityRole="button"
                accessibilityLabel="Confirm date"
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Payment Method Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="card" size={20} color={COLORS.warning} />
              <Text style={styles.cardTitle}>Payment Method</Text>
            </View>
            <View style={styles.paymentMethods}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.name}
                  style={[
                    styles.paymentMethod,
                    paymentMethod === method.name && { backgroundColor: method.color, borderColor: method.color },
                  ]}
                  onPress={() => {
                    setPaymentMethod(method.name);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Ionicons 
                    name={method.icon as any} 
                    size={16} 
                    color={paymentMethod === method.name ? COLORS.actionText : method.color}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === method.name && styles.selectedPaymentMethodText,
                    ]}
                  >
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddExpense}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={styles.gradient}>
              <Ionicons
                name={loading ? "hourglass" : (isEditMode ? "checkmark" : "add")}
                size={24}
                color={COLORS.actionText}
              />
              <Text style={styles.addButtonText}>
                {loading ? 'Processing...' : (isEditMode ? 'Update Expense' : 'Add Expense')}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Enhanced Category Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="grid" size={24} color={COLORS.primary} />
                  <Text style={styles.modalTitle}>Select Category</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowCategoryModal(false)} 
                  style={styles.closeButton}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close category picker"
                >
                  <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.categoryGrid}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.categoryItem}
                    onPress={() => {
                      setCategory(item.name);
                      setShowCategoryModal(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryIconContainer, { backgroundColor: item.color }]}>
                      <Ionicons name={item.icon as any} size={24} color={COLORS.actionText} />
                    </View>
                    <Text style={styles.categoryName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
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
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerCard: {
    paddingVertical: 8,
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.action,
  },
  pickerDoneText: {
    fontSize: 14,
    color: COLORS.actionText,
    fontFamily: 'Inter-SemiBold',
  },
  amountCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  amountContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    flex: 1,
    textAlign: 'right',
    paddingVertical: 0,
  },
  categoryValue: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  categoryBadge: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.action,
  },
  categoryText: {
    color: COLORS.actionText,
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  placeholderText: {
    color: COLORS.textTertiary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  noteInput: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Inter-Regular',
    paddingVertical: 4,
    minHeight: 32,
    lineHeight: 22,
  },
  dateRow: {
    marginBottom: 0,
  },
  dateValue: {
    flex: 1,
    textAlign: 'right',
  },
  dateText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 0,
    gap: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: COLORS.card,
  },
  paymentMethodText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  selectedPaymentMethodText: {
    color: COLORS.actionText,
  },
  addButton: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.action,
  },
  addButtonText: {
    color: COLORS.actionText,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  categoryGrid: {
    paddingBottom: 20,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    margin: 8,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: COLORS.action,
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default AddExpenseScreen;
