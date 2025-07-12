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
  Alert,
  StatusBar,
} from 'react-native';

import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Premium Design System
const COLORS = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  secondary: '#EC4899',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: 'rgba(0, 0, 0, 0.08)',
  glass: 'rgba(255, 255, 255, 0.95)',
  gradient1: ['#7C3AED', '#A78BFA'] as any,
  gradient2: ['#EC4899', '#F472B6'] as any,
  gradient3: ['#06B6D4', '#22D3EE'] as any,
  gradient4: ['#10B981', '#34D399'] as any,
  gradient5: ['#F59E0B', '#FBBF24'] as any,
  gradient6: ['#8B5CF6', '#A78BFA'] as any,
};

const AddExpenseScreen = () => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [animation] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  const params = useLocalSearchParams();
  const isEditMode = !!params.expenseId;

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

  const categories = [
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
    { name: 'Cash', icon: 'wallet' },
    { name: 'Credit Card', icon: 'card' },
    { name: 'Debit Card', icon: 'card' },
    { name: 'Bank Transfer', icon: 'business' },
    { name: 'Digital Wallet', icon: 'phone-portrait' },
  ];

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
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
    if (!amount || isNaN(Number(amount)) || !category || !note || !user) {
      triggerAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Field', 'Please fill all fields.');
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await apiService.updatePersonalExpense(
          params.expenseId as string,
          {
            description: note,
            amount: Number(amount),
            date: date.toISOString(),
            type: 'personal',
            paidBy: user.name,
            participants: [user.name],
            paymentMethod,
            category,
          }
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Expense updated successfully!');
        router.replace('/(tabs)');
      }
      else {
        await apiService.createPersonalExpense({
          description: note,
          amount: Number(amount),
          date: date.toISOString(),
          type: 'personal',
          paidBy: user.name,
          participants: [user.name],
          paymentMethod,
          category,
          createdBy: user.id,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Expense added successfully!');
        router.replace('/(tabs)');
      }
      setAmount('');
      setNote('');
      setCategory('');
    } catch (err: any) {
      console.error('Add expense error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.message || 'Failed to add expense.');
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

  useEffect(() => {
    apiService.getUserProfile().then(setUser);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Premium Header */}
      <LinearGradient
        colors={COLORS.gradient1}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>
              {isEditMode ? 'Edit Expense' : 'Add Expense'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditMode ? 'Update your expense details' : 'Track your personal spending'}
            </Text>
          </View>
          
          <View style={styles.headerIcon}>
            <Ionicons name="add-circle" size={24} color="#fff" />
          </View>
        </View>
      </LinearGradient>

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
            <View style={styles.cardHeader}>
              <Ionicons name="wallet" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Amount</Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
                editable={!loading}
              />
            </View>
          </Animated.View>

          {/* Category Selection Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => !loading && setShowCategoryModal(true)}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="grid" size={20} color={COLORS.secondary} />
              <Text style={styles.cardTitle}>Category</Text>
            </View>
            <View style={styles.categoryPreview}>
              {category ? (
                <View style={styles.categoryBadge}>
                  <LinearGradient
                    colors={categories.find((c) => c.name === category)?.gradient || COLORS.gradient1}
                    style={styles.categoryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons
                      name={categories.find((c) => c.name === category)?.icon as any || 'help'}
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.categoryText}>{category}</Text>
                  </LinearGradient>
                </View>
              ) : (
                <Text style={styles.placeholderText}>Select category</Text>
              )}
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
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={20} color={COLORS.success} />
              <Text style={styles.cardTitle}>Date</Text>
            </View>
            <View style={styles.datePreview}>
              <View style={styles.dateIcon}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.dateText}>
                {date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </TouchableOpacity>

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
                    paymentMethod === method.name && styles.selectedPaymentMethod
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
                    color={paymentMethod === method.name ? '#fff' : COLORS.textSecondary} 
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
            <LinearGradient
              colors={COLORS.gradient1}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons 
                name={loading ? "hourglass" : (isEditMode ? "checkmark" : "add")} 
                size={24} 
                color="white" 
              />
              <Text style={styles.addButtonText}>
                {loading ? 'Processing...' : (isEditMode ? 'Update Expense' : 'Add Expense')}
              </Text>
            </LinearGradient>
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
                                         <LinearGradient
                       colors={item.gradient as any}
                       style={styles.categoryIconContainer}
                       start={{ x: 0, y: 0 }}
                       end={{ x: 1, y: 1 }}
                     >
                      <Ionicons name={item.icon as any} size={24} color="#fff" />
                    </LinearGradient>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  amountCard: {
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    flex: 1,
    paddingVertical: 0,
  },
  categoryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  categoryBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryText: {
    color: '#fff',
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
    paddingVertical: 8,
    minHeight: 40,
    lineHeight: 22,
  },
  datePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: COLORS.surface,
  },
  selectedPaymentMethod: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paymentMethodText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  selectedPaymentMethodText: {
    color: '#fff',
  },
  addButton: {
    borderRadius: 20,
    marginTop: 24,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default AddExpenseScreen;
