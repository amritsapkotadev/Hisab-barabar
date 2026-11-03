import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, ArrowLeft } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { googleAuthService } from '@/services/googleAuth';
import { useAuth } from '@/contexts/AuthContext';
import { resolvePostAuthRoute } from '@/utils/navigation';
import { useToast } from '@/components/Toast';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

// Email & phone regex patterns
const emailRegex = /^\S+@\S+\.\S+$/;
const phoneRegex = /^\d{7,15}$/;

// Password strength checker
function getPasswordStrength(password: string) {
  if (password.length < 6) return 'Weak';
  if (/[A-Z]/.test(password) && /\d/.test(password) && password.length >= 8) return 'Strong';
  return 'Medium';
}

export default function SignupScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    // Mark that user has seen welcome screen
    AsyncStorage.setItem('hasSeenWelcome', 'true');
  }, []);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' })); // Clear error on change
  };

  const validateForm = () => {
    const { name, email, phone, password, confirmPassword } = formData;
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = t('auth.signup.errors.nameRequired');
    if (!emailRegex.test(email)) newErrors.email = t('auth.signup.errors.emailInvalid');
    if (phone && !phoneRegex.test(phone)) newErrors.phone = t('auth.signup.errors.phoneInvalid');
    if (password.length < 6) newErrors.password = t('auth.signup.errors.passwordMin');
    if (password !== confirmPassword) newErrors.confirmPassword = t('auth.signup.errors.passwordsDontMatch');
    if (!acceptTerms) newErrors.terms = t('auth.signup.errors.termsRequired');

    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      toast.error(Object.values(newErrors)[0]);
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { user, success } = await apiService.register(
        formData.name.trim(),
        formData.email.trim(),
        formData.phone.trim(),
        formData.password
      );

      if (success) {
        toast.success(t('auth.signup.verifyEmailMessage'));
        router.push({
          pathname: '/(auth)/otp-verification',
          params: {
            email: formData.email,
            type: 'signup',
            ...(redirect ? { redirect } : {}),
          },
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error?.message || t('auth.signup.errors.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const result = await googleAuthService.signInWithGoogle();

      if (result.success && result.user) {
        // Backend now handles both login and auto-registration
        const { token, user } = await apiService.loginWithGoogle(result.user);
        await signIn(token, user);
        router.replace(resolvePostAuthRoute(redirect));
      } else {
        if (result.error !== 'User cancelled authentication') {
          toast.error(result.error || t('auth.signup.errors.googleFailed'));
        }
      }
    } catch (error: any) {
      console.error('Google signup error:', error);
      toast.error(error.message || t('auth.signup.errors.googleFailedRetry'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessible accessibilityLabel="Back">
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.logo}>
                <Image
                  source={require('../../assets/images/new_logo.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                  accessible
                  accessibilityLabel="Hisab Barabar logo"
                />
              </View>
              <Text style={styles.title}>{t('auth.signup.title')}</Text>
              <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>
            </View>
          </View>

          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.signup.fullName')}</Text>
              <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                <User size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.signup.fullNamePlaceholder')}
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="words"
                  value={formData.name}
                  onChangeText={val => updateFormData('name', val)}
                  accessibilityLabel="Full name input"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.signup.emailAddress')}</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Mail size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.signup.emailPlaceholder')}
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={val => updateFormData('email', val)}
                  accessibilityLabel="Email input"
                />
              </View>
            </View>

            {/* Phone (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.signup.phoneNumber')}</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <Phone size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.signup.phonePlaceholder')}
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={val => updateFormData('phone', val)}
                  maxLength={10}
                  accessibilityLabel="Phone number input"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.signup.password')}</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Lock size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.signup.createPasswordPlaceholder')}
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={val => updateFormData('password', val)}
                  accessibilityLabel="Password input"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} color={COLORS.textTertiary} /> : <Eye size={20} color={COLORS.textTertiary} />}
                </TouchableOpacity>
              </View>
              {!!formData.password && (
                <Text style={styles.passwordStrength}>
                  {t('auth.signup.strength', {
                    value: t(`auth.signup.${getPasswordStrength(formData.password).toLowerCase()}`),
                  })}
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.signup.confirmPassword')}</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Lock size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={!showConfirmPassword}
                  value={formData.confirmPassword}
                  onChangeText={val => updateFormData('confirmPassword', val)}
                  accessibilityLabel="Confirm password input"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={20} color={COLORS.textTertiary} /> : <Eye size={20} color={COLORS.textTertiary} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms & Conditions */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => {
                setAcceptTerms(!acceptTerms);
                setErrors(prev => ({ ...prev, terms: '' }));
              }}
              accessible
              accessibilityLabel="Accept terms"
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                {t('auth.signup.agreeTo')}{' '}
                <Text style={styles.termsLink}>{t('auth.signup.termsOfService')}</Text> {t('auth.signup.and')}{' '}
                <Text style={styles.termsLink}>{t('auth.signup.privacyPolicy')}</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

            {/* Signup Button */}
            <TouchableOpacity
              style={(loading || !acceptTerms) ? [styles.signupButton, (loading || Object.keys(errors).length > 0) && styles.signupButtonDisabled] : styles.signupButton}
              onPress={handleSignup}
              disabled={loading || !acceptTerms}
              accessible
              accessibilityLabel="Create account"
            >
              {loading ? <ActivityIndicator color={COLORS.actionText} /> : (
                <>
                  <Text style={styles.signupButtonText}>{t('auth.signup.createAccount')}</Text>
                  <ArrowRight size={20} color={COLORS.actionText} />
                </>
              )}
            </TouchableOpacity>

            {/* Google Signup */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.signup.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, googleLoading && styles.googleButtonDisabled]}
              onPress={handleGoogleSignup}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={COLORS.text} size="small" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>{t('auth.signup.googleSignup')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('auth.signup.haveAccount')}{' '}
              <Text
                style={styles.loginLink}
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/login',
                    params: redirect ? { redirect } : {},
                  })
                }
              >
                {t('auth.signup.signIn')}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  header: { paddingTop: 20, paddingBottom: 32 },
  backButton: { padding: 8, marginBottom: 20 },
  headerContent: { alignItems: 'center' },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center', fontFamily: 'Inter-Bold' },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, fontFamily: 'Inter-Regular' },
  form: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8, fontFamily: 'Inter-SemiBold' },
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
  inputError: {
    borderColor: COLORS.negative,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.text, paddingVertical: 12, fontFamily: 'Inter-Regular' },
  eyeIcon: { padding: 4 },
  passwordStrength: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    borderRadius: 5,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.action, borderColor: COLORS.action },
  checkmark: { color: COLORS.actionText, fontSize: 12, fontWeight: '700' },
  termsText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, fontFamily: 'Inter-Regular' },
  termsLink: { color: COLORS.text, fontWeight: '600', fontFamily: 'Inter-SemiBold' },
  signupButton: {
    backgroundColor: COLORS.action,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 999,
    marginBottom: 24,
  },
  signupButtonDisabled: {
    backgroundColor: COLORS.surfaceMuted,
  },
  signupButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.actionText, marginRight: 8, fontFamily: 'Inter-SemiBold' },
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
    marginBottom: 24,
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
  footer: { paddingVertical: 24, alignItems: 'center' },
  footerText: { fontSize: 16, color: COLORS.textSecondary, fontFamily: 'Inter-Regular' },
  loginLink: { color: COLORS.text, fontWeight: '600', fontFamily: 'Inter-SemiBold' },
  errorText: { color: COLORS.negative, fontSize: 12, marginTop: 4 },
});