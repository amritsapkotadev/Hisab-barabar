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

export default function ResetPasswordScreen() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { email } = useLocalSearchParams();
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

        setLoading(true);
        try {
            const res = await apiService.resetPassword({ email: Array.isArray(email) ? email[0] : email, newPassword: newPassword });
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
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={22} color="#4f46e5" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Reset Password</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Enter new password"
                            placeholderTextColor="#94A3B8"
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
                            placeholderTextColor="#94A3B8"
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
                            <ActivityIndicator color="#fff" size="small" />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 24,
        borderRadius: 20,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 30,
        textAlign: 'center',
        marginTop: -15,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 18,
        textAlign: 'center',
    },
    inputGroup: {
        width: '100%',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 4,
        fontWeight: '500',
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 10,
        fontSize: 16,
        color: '#1e293b',
        backgroundColor: '#f1f5f9',
    },
    button: {
        backgroundColor: '#4f46e5',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    error: {
        color: '#ef4444',
        marginBottom: 6,
        textAlign: 'center',
        fontSize: 14,
    },
    success: {
        color: '#22c55e',
        marginBottom: 6,
        textAlign: 'center',
        fontSize: 14,
    },
    loginLink: {
        marginTop: 18,
    },
    loginLinkText: {
        color: '#4f46e5',
        fontWeight: '500',
        fontSize: 15,
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 2,
        padding: 4,
    },
});
