import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { ArrowLeft, AlertTriangle, Trash2, Download, Shield } from 'lucide-react-native';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useAppAlert } from '@/contexts/AppAlertContext';

export default function DeleteAccountScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const showAlert = useAppAlert();
  const { signOut } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exportData, setExportData] = useState(true);
  const [deleteGroups, setDeleteGroups] = useState(false);
  const [reason, setReason] = useState('');

  const handleDeleteAccount = async () => {
    try {
      const res = await apiService.deleteAccount();
      if (res.success) {
        toast.success('Your account has been permanently deleted.');
        router.replace('/(auth)/login');
        await signOut();
      }
    } catch (error) {
      throw new Error('Failed to delete account');
    }
  };

  const handleExportBeforeDelete = () => {
    showAlert(
      'Export Data',
      'Your data will be exported before account deletion. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => setShowDeleteModal(true)
        }
      ]
    );
  };

  const reasons = [
    'I no longer need the app',
    'Privacy concerns',
    'Found a better alternative',
    'Too complicated to use',
    'Technical issues',
    'Other'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
         accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Delete Account</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Section */}
        <View style={styles.warningCard}>
          <AlertTriangle size={32} color={COLORS.negative} />
          <Text style={styles.warningTitle}>Permanent Account Deletion</Text>
          <Text style={styles.warningText}>
            This action cannot be undone. All your data, including groups, expenses,
            and transaction history will be permanently deleted.
          </Text>
        </View>

        {/* What Gets Deleted */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What will be deleted:</Text>
          <View style={styles.deleteList}>
            <Text style={styles.deleteItem}>• Your profile and account information</Text>
            <Text style={styles.deleteItem}>• All transaction and expense history</Text>
            <Text style={styles.deleteItem}>• Group memberships and data</Text>
            <Text style={styles.deleteItem}>• Payment methods and preferences</Text>
            <Text style={styles.deleteItem}>• App settings and customizations</Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Before you delete:</Text>

          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center'}}>
              <Download size={20} color={COLORS.text} />
              <Text style={styles.optionTitle}>Export your data</Text>
              </View>
              <Text style={styles.optionDescription}>
                Download a copy of your data before deletion
              </Text>
            </View>
            <Switch
              value={exportData}
              onValueChange={setExportData}
              trackColor={{ false: COLORS.switchTrackOff, true: COLORS.switchTrackOn }}
              thumbColor={COLORS.switchThumb}
              ios_backgroundColor={COLORS.switchTrackOff}
            />
          </View>

          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center'}}>
              <Trash2 size={20} color={COLORS.negative} />
              <Text style={styles.optionTitle}>Delete groups you created</Text>
              </View>
            <Text style={styles.optionDescription}>
              Also delete groups where you are the only member
            </Text>
            </View>
            <Switch
              value={deleteGroups}
              onValueChange={setDeleteGroups}
              trackColor={{ false: COLORS.switchTrackOff, true: COLORS.negative }}
              thumbColor={COLORS.switchThumb}
              ios_backgroundColor={COLORS.switchTrackOff}
            />
          </View>
        </View>

        {/* Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help us improve (Optional)</Text>
          <Text style={styles.feedbackDescription}>
            Tell us why you're leaving. Your feedback helps us improve Hisab Barabar.
          </Text>

          <View style={styles.reasonsList}>
            {reasons.map((reasonOption, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.reasonOption,
                  reason === reasonOption && styles.reasonOptionSelected
                ]}
                onPress={() => setReason(reason === reasonOption ? '' : reasonOption)}
              >
                <Text style={[
                  styles.reasonText,
                  reason === reasonOption && styles.reasonTextSelected
                ]}>
                  {reasonOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {reason === 'Other' && (
            <TextInput
              style={styles.customReasonInput}
              placeholder="Please tell us more..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          )}
        </View>

        {/* Alternatives */}
        <View style={styles.alternativesCard}>
          <View style={{ flexDirection: 'row', alignContent: 'center' }}>
            <Shield size={21} color={COLORS.positive} />
            <Text style={styles.alternativesTitle}>Consider these alternatives:</Text>
          </View>
          <Text style={styles.alternativesText}>
            • Temporarily deactivate your account{'\n'}
            • Clear your data but keep your account{'\n'}
            • Contact support for help with issues{'\n'}
            • Export your data and take a break
          </Text>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={exportData ? handleExportBeforeDelete : () => setShowDeleteModal(true)}
        >
          <Trash2 size={20} color={COLORS.actionText} />
          <Text style={styles.deleteButtonText}>Delete My Account</Text>
        </TouchableOpacity>

        <Text style={styles.finalWarning}>
          This action is permanent and cannot be undone
        </Text>
      </ScrollView>

      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you absolutely sure you want to delete your account? All your data will be permanently lost."
        confirmText="Delete Account"
        requiresConfirmation={true}
        confirmationText="DELETE"
        isDangerous={true}
      />
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
  warningCard: {
    backgroundColor: `${COLORS.negative}10`,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${COLORS.negative}30`,
  },
  warningTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.negative,
    fontFamily: 'Inter-Bold',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.negative,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
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
  deleteList: {
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
  deleteItem: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 4,
  },
  optionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  optionHeader: {
    alignItems: 'flex-start',
    flex: 1,
    gap: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    flex: 1,
  },
  feedbackDescription: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonsList: {
    gap: 8,
  },
  reasonOption: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reasonOptionSelected: {
    backgroundColor: COLORS.surfaceSecondary,
    borderColor: COLORS.action,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  reasonTextSelected: {
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  customReasonInput: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'Inter-Regular',
    textAlignVertical: 'top',
    marginTop: 12,
  },
  alternativesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
    marginBottom: 8,
    marginTop: 1,
  },
  alternativesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    flex: 1,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: COLORS.negative,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 999,
    marginBottom: 12,
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.actionText,
    fontFamily: 'Inter-SemiBold',
  },
  finalWarning: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 30,
  },
});