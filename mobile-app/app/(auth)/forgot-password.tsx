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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function ForgotPasswordScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
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
                    <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(auth)/login')} accessibilityRole="button" accessibilityLabel="Go back">
                        <ArrowLeft size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={styles.logoContainer}>
                        <View style={styles.logo}>
                            <Image
                                source={require('../../assets/images/new_logo.png')}
                                style={styles.logoImage}
                                resizeMode="cover"
                                accessible
                                accessibilityLabel="Hisab Barabar logo"
                            />
                        </View>
                    </View>
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Mail size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                placeholderTextColor={COLORS.textTertiary}
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
                            <ActivityIndicator color={COLORS.actionText} size="small" />
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: 8,
    },
    logoImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
        textAlign: 'center',
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceSecondary,
        borderRadius: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputIcon: {
        marginRight: 6,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: COLORS.text,
        backgroundColor: 'transparent',
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