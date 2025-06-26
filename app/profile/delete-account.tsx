import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, AlertTriangle, Trash2, Download, Shield } from 'lucide-react-native';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { apiService } from '@/services/api';

export default function DeleteAccountScreen() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exportData, setExportData] = useState(true);
  const [deleteGroups, setDeleteGroups] = useState(false);
  const [reason, setReason] = useState('');

  const handleDeleteAccount = async () => {
    try {
      // In a real app, this would call the API to delete the account
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear auth token
      apiService.clearAuthToken();
      
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error) {
      throw new Error('Failed to delete account');
    }
  };

  const handleExportBeforeDelete = () => {
    Alert.alert(
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
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Delete Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Section */}
        <View style={styles.warningCard}>
          <AlertTriangle size={32} color="#dc2626" />
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
              <Download size={20} color="#2563eb" />
              <Text style={styles.optionTitle}>Export your data</Text>
            </View>
            <Text style={styles.optionDescription}>
              Download a copy of your data before deletion
            </Text>
            <Switch
              value={exportData}
              onValueChange={setExportData}
              trackColor={{ false: '#f3f4f6', true: '#bfdbfe' }}
              thumbColor={exportData ? '#2563eb' : '#9ca3af'}
            />
          </View>

          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Trash2 size={20} color="#dc2626" />
              <Text style={styles.optionTitle}>Delete groups you created</Text>
            </View>
            <Text style={styles.optionDescription}>
              Also delete groups where you are the only member
            </Text>
            <Switch
              value={deleteGroups}
              onValueChange={setDeleteGroups}
              trackColor={{ false: '#f3f4f6', true: '#fecaca' }}
              thumbColor={deleteGroups ? '#dc2626' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help us improve (Optional)</Text>
          <Text style={styles.feedbackDescription}>
            Tell us why you're leaving. Your feedback helps us improve Hisab Kitab.
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
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          )}
        </View>

        {/* Alternatives */}
        <View style={styles.alternativesCard}>
          <Shield size={24} color="#059669" />
          <Text style={styles.alternativesTitle}>Consider these alternatives:</Text>
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
          <Trash2 size={20} color="#ffffff" />
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
        message="Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."
        confirmText="Delete Account"
        requiresConfirmation={true}
        confirmationText="DELETE"
        isDangerous={true}
      />
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
  warningCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  deleteList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  deleteItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  optionDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    flex: 1,
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonsList: {
    gap: 8,
  },
  reasonOption: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reasonOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
  },
  reasonTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  customReasonInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    marginTop: 12,
  },
  alternativesCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginLeft: 8,
    marginBottom: 8,
  },
  alternativesText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
    flex: 1,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  finalWarning: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
});