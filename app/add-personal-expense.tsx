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
} from 'react-native';

import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { router } from 'expo-router';

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
  const [user, setUser] = useState(null);

  const categories = [
    { id: '1', name: 'Food', icon: 'fast-food', color: '#FF6B6B' },
    { id: '2', name: 'Transport', icon: 'car', color: '#4ECDC4' },
    { id: '3', name: 'Shopping', icon: 'cart', color: '#FFA07A' },
    { id: '4', name: 'Entertainment', icon: 'film', color: '#A569BD' },
    { id: '5', name: 'Bills', icon: 'receipt', color: '#5DADE2' },
    { id: '6', name: 'Health', icon: 'medkit', color: '#F06292' },
    { id: '7', name: 'Education', icon: 'book', color: '#4DB6AC' },
    { id: '8', name: 'Travel', icon: 'airplane', color: '#7986CB' },
    { id: '9', name: 'Gifts', icon: 'gift', color: '#FF8A65' },
  ];

  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet'];

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
      Alert.alert('Missing Field', 'Please fill all fields.');
      return;
    }

    setLoading(true);
    try {
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
      setAmount('');
      setNote('');
      setCategory('');
      Alert.alert('Success', 'Expense added successfully!');
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Add expense error:', err);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Track Your Expense</Text>

        {/* Amount Input */}
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
              editable={!loading}
            />
          </View>
        </Animated.View>

        {/* Category Selection */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => !loading && setShowCategoryModal(true)}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryPreview}>
            {category ? (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categories.find((c) => c.name === category)?.color || '#2563EB' },
                ]}
              >
                <Ionicons
                  name={categories.find((c) => c.name === category)?.icon as any || 'help'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ) : (
              <Text style={styles.placeholderText}>Select category</Text>
            )}
            <MaterialIcons name="keyboard-arrow-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>

        {/* Note Input */}
        <View style={styles.card}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="What was this expense for?"
            placeholderTextColor="#999"
            value={note}
            onChangeText={setNote}
            multiline
            editable={!loading}
          />
        </View>

        {/* Date Selection */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => !loading && setShowDatePicker(true)}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.label}>Date</Text>
          <View style={styles.datePreview}>
            <FontAwesome5 name="calendar-alt" size={18} color="#666" />
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

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.paymentMethod, paymentMethod === method && styles.selectedPaymentMethod]}
                onPress={() => setPaymentMethod(method)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === method && styles.selectedPaymentMethodText,
                  ]}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.addButton, loading && { opacity: 0.6 }]}
          onPress={handleAddExpense}
          activeOpacity={0.8}
          disabled={loading}
        >
          <LinearGradient
            colors={['#2563EB', '#1E40AF']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>{loading ? 'Adding...' : 'Add Expense'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.categoryGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => {
                    setCategory(item.name);
                    setShowCategoryModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIconContainer, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={24} color="#fff" />
                  </View>
                  <Text style={styles.categoryName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    color: '#1E293B',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  noteInput: {
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 8,
    minHeight: 40,
  },
  datePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateText: {
    color: '#1E293B',
    marginLeft: 12,
    fontSize: 16,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  paymentMethod: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPaymentMethod: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  paymentMethodText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedPaymentMethodText: {
    color: '#fff',
  },
  addButton: {
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default AddExpenseScreen;
