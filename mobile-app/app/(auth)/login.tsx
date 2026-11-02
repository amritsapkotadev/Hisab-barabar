import React, { useEffect, useState } from 'react';
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
  Image,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { googleAuthService } from '@/services/googleAuth';
import { useAuth } from '@/contexts/AuthContext';
import { resolvePostAuthRoute } from '@/utils/navigation';
import { useToast } from '@/components/Toast';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function LoginScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    AsyncStorage.setItem('hasSeenWelcome', 'true');

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error(t('auth.login.missingFields'));
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await apiService.login(email.trim(), password);
      await signIn(token, user);
      router.replace(resolvePostAuthRoute(redirect));
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'Email not verified') {
        toast.info(t('auth.login.verifyEmail'));
        router.push({ pathname: '/(auth)/otp-verification', params: { email: email, type: 'verifyEmail' } });
        await apiService.resendOtp({ email });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await googleAuthService.signInWithGoogle();

      if (result.success && result.user) {
        // Backend now handles both login and auto-registration
        const { token, user } = await apiService.loginWithGoogle(result.user);
        await signIn(token, user);
        router.replace(resolvePostAuthRoute(redirect));
      } else if (result.error !== 'User cancelled authentication') {
        toast.error(result.error || t('auth.login.googleFailed'));
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || t('auth.login.googleFailedRetry'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ opacity: fadeAnim }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/logo.jpeg')}
                style={styles.logo}
                resizeMode="cover"
                accessible
                accessibilityLabel="Hisab Barabar logo"
              />
            </View>
            <Text style={styles.title}>{t('auth.login.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.login.emailAddress')}</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.login.emailPlaceholder')}
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.login.password')}</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: -5 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.textTertiary} />
                  ) : (
                    <Eye size={20} color={COLORS.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotPasswordText}>{t('auth.login.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.actionText} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>{t('auth.login.signIn')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.login.orContinueWith')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.googleButtonDisabled]}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={COLORS.text} size="small" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>{t('auth.login.googleSignIn')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sign Up */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>{t('auth.login.noAccount')} </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(auth)/signup',
                  params: redirect ? { redirect } : {},
                })
              }
            >
              <Text style={styles.signupLink}>{t('auth.login.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 14,
    fontFamily: 'Inter-Regular',
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  loginButton: {
    backgroundColor: COLORS.action,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 999,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.surfaceMuted,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.actionText,
    fontFamily: 'Inter-SemiBold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.textTertiary,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  googleButton: {
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleButtonDisabled: {
    backgroundColor: COLORS.surfaceSecondary,
    borderColor: COLORS.borderStrong,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285f4',
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  signupText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  signupLink: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});