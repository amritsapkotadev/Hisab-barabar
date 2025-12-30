import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { apiService } from '@/services/api';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

    const handleForgotPassword = async () => {
        setError('');
        setMessage('');
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        setLoading(true);
        try {
            const res = await apiService.forgotPassword({ email });
            if(res.success) {
                router.replace({
                    pathname: '/(auth)/otp-verification',
                    params: { email, type: 'forgotPassword' }
                });
            } else {
                setError(res.message || 'Failed to send reset link. Please try again.');
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
                <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(auth)/login')}>
                        <ArrowLeft size={22} color="#4f46e5" />
                    </TouchableOpacity>
                    <View style={styles.logoContainer}>
                        <View style={styles.logo}><Text style={styles.logoText}>💰</Text></View>
                    </View>
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                placeholderTextColor="#94A3B8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {message ? <Text style={styles.success}>{message}</Text> : null}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleForgotPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Send OTP Code</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
                        <Text style={styles.loginLinkText}>Back to Login</Text>
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    logo: {
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
    },
    logoText: {
        fontSize: 36,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
        textAlign: 'center',
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputIcon: {
        marginRight: 6,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: '#1e293b',
        backgroundColor: 'transparent',
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