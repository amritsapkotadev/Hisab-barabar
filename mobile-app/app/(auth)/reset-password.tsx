import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import { useLocalSearchParams } from 'expo-router';
import ConfirmationModal from '@/components/ConfirmationModal';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function ResetPasswordScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const handleResetPassword = async () => {
        setError('');
        setSuccessMessage('');

        if (!newPassword.trim() || !confirmPassword.trim()) {
            setError('Please fill in both fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!email || !otp) {
            setError('Your reset code is missing or expired. Please request a new one.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiService.resetPassword({
                email: Array.isArray(email) ? email[0] : email,
                otp: Array.isArray(otp) ? otp[0] : otp,
                newPassword: newPassword,
            });
            if (res.success) {
                setShowConfirmationModal(true);
            } else {
                setError(res.message || 'Failed to reset password. Please try again.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.card}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
                        <ArrowLeft size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Reset Password</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Enter new password"
                            placeholderTextColor={COLORS.textTertiary}
                            secureTextEntry
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            placeholderTextColor={COLORS.textTertiary}
                            secureTextEntry
                        />
                    </View>
                    {/* Confirmation Modal */}
                    <ConfirmationModal
                        visible={showConfirmationModal}
                        message="Password reset successfully! You can now log in."
                        onConfirm={() => {
                            setShowConfirmationModal(false);
                            router.replace('/(auth)/login');
                        }}
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.actionText} size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Reset Password</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
                        <Text style={styles.loginLinkText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: COLORS.card,
        marginHorizontal: 24,
        borderRadius: 16,
        padding: 28,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 30,
        textAlign: 'center',
        marginTop: -15,
        fontFamily: 'Inter-Bold',
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginBottom: 18,
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
    inputGroup: {
        width: '100%',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 6,
        fontWeight: '500',
        fontFamily: 'Inter-Medium',
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        color: COLORS.text,
        backgroundColor: COLORS.surfaceSecondary,
        fontFamily: 'Inter-Regular',
    },
    button: {
        backgroundColor: COLORS.action,
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: COLORS.actionText,
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    error: {
        color: COLORS.negative,
        marginBottom: 6,
        textAlign: 'center',
        fontSize: 14,
    },
    success: {
        color: COLORS.positive,
        marginBottom: 6,
        textAlign: 'center',
        fontSize: 14,
    },
    loginLink: {
        marginTop: 18,
    },
    loginLinkText: {
        color: COLORS.text,
        fontWeight: '500',
        fontSize: 15,
        textAlign: 'center',
        fontFamily: 'Inter-Medium',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 2,
        padding: 4,
    },
});
