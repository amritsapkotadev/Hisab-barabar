import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, CreditCard, Smartphone, Trash2, CircleCheck as CheckCircle, Circle, Wallet, DollarSign } from 'lucide-react-native';

interface PaymentMethod {
  id: string;
  type: 'esewa' | 'bank' | 'cash';
  name: string;
  details: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function PaymentMethodsScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'esewa',
      name: 'eSewa',
      details: '98********01',
      isDefault: true,
      isActive: true,
    },
    {
      id: '2',
      type: 'bank',
      name: 'Bank Transfer',
      details: 'Nepal Investment Bank',
      isDefault: false,
      isActive: true,
    },
    {
      id: '3',
      type: 'cash',
      name: 'Cash Settlement',
      details: 'In-person payment',
      isDefault: false,
      isActive: true,
    },
  ]);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    Alert.alert('Success', 'Default payment method updated');
  };

  const handleToggleActive = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === id 
          ? { ...method, isActive: !method.isActive }
          : method
      )
    );
  };

  const handleRemoveMethod = (id: string) => {
    const method = paymentMethods.find(m => m.id === id);
    if (method?.isDefault) {
      Alert.alert('Error', 'Cannot remove default payment method. Set another method as default first.');
      return;
    }

    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(m => m.id !== id));
          }
        }
      ]
    );
  };

  const handleAddESewa = () => {
    Alert.alert(
      'Add eSewa Account',
      'Enter your eSewa mobile number to add it as a payment method.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => {
          // In a real app, this would open a form to add eSewa details
          Alert.alert('Success', 'eSewa account would be added here');
        }}
      ]
    );
  };

  const handleAddBankAccount = () => {
    Alert.alert(
      'Add Bank Account',
      'Add your bank account details for bank transfers.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => {
          // In a real app, this would open a form to add bank details
          Alert.alert('Success', 'Bank account would be added here');
        }}
      ]
    );
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'esewa':
        return <Smartphone size={24} color="#2563eb" />;
      case 'bank':
        return <CreditCard size={24} color="#059669" />;
      case 'cash':
        return <Wallet size={24} color="#ea580c" />;
      default:
        return <DollarSign size={24} color="#6b7280" />;
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.paymentMethodCard}>
      <View style={styles.paymentMethodHeader}>
        <View style={styles.paymentMethodInfo}>
          <View style={styles.paymentMethodIcon}>
            {getPaymentIcon(method.type)}
          </View>
          <View style={styles.paymentMethodDetails}>
            <Text style={styles.paymentMethodName}>{method.name}</Text>
            <Text style={styles.paymentMethodSubtext}>{method.details}</Text>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.paymentMethodActions}>
          <Switch
            value={method.isActive}
            onValueChange={() => handleToggleActive(method.id)}
            trackColor={{ false: '#f3f4f6', true: '#bfdbfe' }}
            thumbColor={method.isActive ? '#2563eb' : '#9ca3af'}
          />
        </View>
      </View>

      <View style={styles.paymentMethodFooter}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSetDefault(method.id)}
          disabled={method.isDefault}
        >
          {method.isDefault ? (
            <CheckCircle size={16} color="#059669" />
          ) : (
            <Circle size={16} color="#6b7280" />
          )}
          <Text style={[
            styles.actionButtonText,
            method.isDefault && styles.actionButtonTextActive
          ]}>
            {method.isDefault ? 'Default' : 'Set as Default'}
          </Text>
        </TouchableOpacity>

        {!method.isDefault && (
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => handleRemoveMethod(method.id)}
          >
            <Trash2 size={16} color="#dc2626" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Payment Methods</Text>
          {paymentMethods.map(renderPaymentMethod)}
        </View>

        {/* Add New Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Payment Method</Text>
          
          <TouchableOpacity style={styles.addMethodCard} onPress={handleAddESewa}>
            <View style={styles.addMethodIcon}>
              <Smartphone size={24} color="#2563eb" />
            </View>
            <View style={styles.addMethodContent}>
              <Text style={styles.addMethodTitle}>Add eSewa Account</Text>
              <Text style={styles.addMethodSubtitle}>
                Link your eSewa mobile wallet for instant payments
              </Text>
            </View>
            <Plus size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.addMethodCard} onPress={handleAddBankAccount}>
            <View style={styles.addMethodIcon}>
              <CreditCard size={24} color="#059669" />
            </View>
            <View style={styles.addMethodContent}>
              <Text style={styles.addMethodTitle}>Add Bank Account</Text>
              <Text style={styles.addMethodSubtitle}>
                Add bank details for direct transfers
              </Text>
            </View>
            <Plus size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* eSewa Information */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Smartphone size={20} color="#2563eb" />
            <Text style={styles.infoTitle}>About eSewa</Text>
          </View>
          <Text style={styles.infoText}>
            eSewa is Nepal's leading digital wallet. You can send and receive money instantly using just a mobile number. 
            It's secure, fast, and widely accepted across Nepal.
          </Text>
          <View style={styles.infoFeatures}>
            <Text style={styles.infoFeature}>• Instant money transfers</Text>
            <Text style={styles.infoFeature}>• No transaction fees for Hisab Kitab settlements</Text>
            <Text style={styles.infoFeature}>• Secure and encrypted transactions</Text>
            <Text style={styles.infoFeature}>• 24/7 availability</Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityCard}>
          <Text style={styles.securityTitle}>Security & Privacy</Text>
          <Text style={styles.securityText}>
            Your payment information is encrypted and stored securely. Hisab Kitab never stores your eSewa PIN or bank passwords. 
            We only store necessary details to facilitate settlements between group members.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  paymentMethodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  paymentMethodSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  defaultBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  paymentMethodActions: {
    marginLeft: 12,
  },
  paymentMethodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  actionButtonTextActive: {
    color: '#059669',
  },
  removeButton: {
    backgroundColor: '#fef2f2',
  },
  removeButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  addMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    borderStyle: 'dashed',
  },
  addMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addMethodContent: {
    flex: 1,
  },
  addMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  addMethodSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoFeatures: {
    marginTop: 8,
  },
  infoFeature: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
    marginBottom: 2,
  },
  securityCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
});