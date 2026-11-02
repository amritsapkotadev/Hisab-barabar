import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { ArrowLeft, Lock, Eye, EyeOff, Save } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useToast } from '@/components/Toast';

export default function ChangePasswordScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { strength: 'Weak', color: COLORS.negative };
    if (password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)) {
      return { strength: 'Strong', color: COLORS.positive };
    }
    return { strength: 'Medium', color: COLORS.warning };
  };

  const handleSave = async () => {
    if (!currentPassword.trim()) {
      toast.error('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      toast.error('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const res = await apiService.changePassword(currentPassword, newPassword);
      if (res.success) {
        toast.success('Password changed successfully!');
        router.replace('/(auth)/login');
      }
      else {        
        toast.error(res.message || 'Failed to change password');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
           accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>Change Password</Text>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.actionText} />
            ) : (
              <Save size={18} color={COLORS.actionText} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} color={COLORS.textTertiary} />
                  ) : (
                    <Eye size={20} color={COLORS.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color={COLORS.textTertiary} />
                  ) : (
                    <Eye size={20} color={COLORS.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>
              {newPassword.length > 0 && (
                <Text style={[styles.passwordStrength, { color: passwordStrength.color }]}>
                  Strength: {passwordStrength.strength}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={COLORS.textTertiary} />
                  ) : (
                    <Eye size={20} color={COLORS.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Password Requirements</Text>
              <Text style={styles.infoText}>
                • At least 6 characters long{'\n'}
                • Include uppercase and lowercase letters{'\n'}
                • Include at least one number{'\n'}
                • Avoid common passwords
              </Text>
            </View>

            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Security Notice</Text>
              <Text style={styles.warningText}>
                Changing your password will log you out of all other devices. You'll need to sign in again.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
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
  saveButton: {
    backgroundColor: COLORS.action,
    width: 40,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Inter-Regular',
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  passwordStrength: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  warningCard: {
    backgroundColor: `${COLORS.negative}10`,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.negative}30`,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.negative,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
});