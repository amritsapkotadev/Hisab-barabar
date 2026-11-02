import React from 'react';
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
import { useToast } from '@/components/Toast';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useAccountPreference } from '@/hooks/useAccountPreference';
import { DEFAULT_PAYMENT_METHODS, isPaymentMethods, type PaymentMethod } from '@/services/preferences';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function PaymentMethodsScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const { value: paymentMethods, save, loading, saving, error, retry } = useAccountPreference(
    'paymentMethods', DEFAULT_PAYMENT_METHODS, isPaymentMethods
  );

  const handleSetDefault = async (id: string) => {
    if (!paymentMethods.find(method => method.id === id)?.isActive) {
      toast.error('Activate this payment method before making it the default.');
      return;
    }
    const saved = await save(
      paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    if (saved) toast.success('Default payment method updated');
  };

  const handleToggleActive = (id: string) => {
    if (paymentMethods.find(method => method.id === id)?.isDefault) {
      toast.error('Set another default payment method before deactivating this one.');
      return;
    }
    void save(
      paymentMethods.map(method =>
        method.id === id 
          ? { ...method, isActive: !method.isActive }
          : method
      )
    );
  };

  const handleRemoveMethod = (id: string) => {
    const method = paymentMethods.find(m => m.id === id);
    if (method?.isDefault) {
      toast.error('Cannot remove default payment method. Set another method as default first.');
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
            void save(paymentMethods.filter(m => m.id !== id));
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
          toast.info('Adding eSewa accounts is not available yet.');
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
          toast.info('Adding bank accounts is not available yet.');
        }}
      ]
    );
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'esewa':
        return <Smartphone size={24} color={COLORS.text} />;
      case 'bank':
        return <CreditCard size={24} color={COLORS.text} />;
      case 'cash':
        return <Wallet size={24} color={COLORS.text} />;
      default:
        return <DollarSign size={24} color={COLORS.textTertiary} />;
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
            disabled={saving}
            value={method.isActive}
            onValueChange={() => handleToggleActive(method.id)}
            trackColor={{ false: COLORS.switchTrackOff, true: COLORS.switchTrackOn }}
            thumbColor={COLORS.switchThumb}
            ios_backgroundColor={COLORS.switchTrackOff}
          />
        </View>
      </View>

      <View style={styles.paymentMethodFooter}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSetDefault(method.id)}
          disabled={method.isDefault || saving || !method.isActive}
        >
          {method.isDefault ? (
            <CheckCircle size={16} color={COLORS.positive} />
          ) : (
            <Circle size={16} color={COLORS.textTertiary} />
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
            disabled={saving}
            onPress={() => handleRemoveMethod(method.id)}
          >
            <Trash2 size={16} color={COLORS.negative} />
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
         accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Payment Methods</Text>
        <View style={styles.backButton} />
      </View>

      {error ? <ErrorMessage message={error} onRetry={retry} /> : loading ? (
        <LoadingSpinner message="Loading saved payment methods..." />
      ) : <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
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
              <Smartphone size={24} color={COLORS.text} />
            </View>
            <View style={styles.addMethodContent}>
              <Text style={styles.addMethodTitle}>Add eSewa Account</Text>
              <Text style={styles.addMethodSubtitle}>
                Link your eSewa mobile wallet for instant payments
              </Text>
            </View>
            <Plus size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.addMethodCard} onPress={handleAddBankAccount}>
            <View style={styles.addMethodIcon}>
              <CreditCard size={24} color={COLORS.text} />
            </View>
            <View style={styles.addMethodContent}>
              <Text style={styles.addMethodTitle}>Add Bank Account</Text>
              <Text style={styles.addMethodSubtitle}>
                Add bank details for direct transfers
              </Text>
            </View>
            <Plus size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* eSewa Information */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Smartphone size={20} color={COLORS.text} />
            <Text style={styles.infoTitle}>About eSewa</Text>
          </View>
          <Text style={styles.infoText}>
            eSewa is Nepal's leading digital wallet. You can send and receive money instantly using just a mobile number. 
            It's secure, fast, and widely accepted across Nepal.
          </Text>
          <View style={styles.infoFeatures}>
            <Text style={styles.infoFeature}>• Instant money transfers</Text>
            <Text style={styles.infoFeature}>• No transaction fees for Hisab Barabar settlements</Text>
            <Text style={styles.infoFeature}>• Secure and encrypted transactions</Text>
            <Text style={styles.infoFeature}>• 24/7 availability</Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityCard}>
          <Text style={styles.securityTitle}>Security & Privacy</Text>
          <Text style={styles.securityText}>
            Payment preferences are saved locally for your account, not synced across devices.
            Never enter an eSewa PIN or bank password here.
          </Text>
        </View>
      </ScrollView>}
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  paymentMethodCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
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
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  paymentMethodSubtext: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  defaultBadge: {
    backgroundColor: `${COLORS.positive}10`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.positive,
    fontFamily: 'Inter-SemiBold',
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
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceSecondary,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    fontFamily: 'Inter-SemiBold',
  },
  actionButtonTextActive: {
    color: COLORS.positive,
  },
  removeButton: {
    backgroundColor: `${COLORS.negative}10`,
  },
  removeButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.negative,
    fontFamily: 'Inter-SemiBold',
  },
  addMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addMethodContent: {
    flex: 1,
  },
  addMethodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  addMethodSubtitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoFeatures: {
    marginTop: 8,
  },
  infoFeature: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginBottom: 2,
  },
  securityCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
});