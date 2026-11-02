import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Shield, RefreshCw, CircleCheck as CheckCircle } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { resolvePostAuthRoute } from '@/utils/navigation';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useToast } from '@/components/Toast';
import { useTranslation } from 'react-i18next';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function OTPVerificationScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { email, type, redirect } = useLocalSearchParams<{ email: string, type: 'signup' | 'login' | 'verifyEmail' | 'forgotPassword', redirect?: string }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms'>('email');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }

    setCanResend(false);
    const timeout = setTimeout(() => setTimer((prev) => prev - 1), 1000);

    return () => clearTimeout(timeout);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp.join('');

    if (codeToVerify.length !== 6) {
      toast.error(t('auth.otp.errors.incomplete'));
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.verifyOtp({
        otp: codeToVerify,
        email: email,
        purpose: type === 'forgotPassword' ? 'reset' : undefined,
      });

      // if (res.success) {
      //   Alert.alert('Success', 'Verification successful!', [
      //     {
      //       text: 'OK',
      //       onPress: () => {
      //         switch (type) {
      //           case 'signup':
      //           case 'verifyEmail':
      //             router.replace('/(tabs)');
      //             break;
      //           case 'forgotPassword':
      //             router.replace({ pathname: '/(auth)/reset-password', params: { email } });
      //             break;
      //           default:
      //             router.replace('/(auth)/login');
      //             break;
      //         }
      //       },
      //     },
      //   ]);
      if (res.success) {
        if (type !== 'forgotPassword' && res.token) {
          await signIn(res.token);
        }
        setShowConfirmationModal(true);
      } else {
        shakeInputs();
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        toast.error(res.message || t('auth.otp.errors.verifyFailed'));
      }
    } catch (error: any) {
      shakeInputs();
      toast.error(error.message || t('auth.otp.errors.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      const res = await apiService.resendOtp({
        email: email,
      });

      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      toast.info(t('auth.otp.resendSent', { method: verificationMethod === 'email' ? t('auth.otp.email') : t('auth.otp.phone') }));
    } catch (error) {
      toast.error(t('auth.otp.errors.resendFailed'));
    } finally {
      setResendLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // const maskedContact = verificationMethod === 'email'
  //   ? email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')
  //   : phone?.replace(/(.{3})(.*)(.{2})/, '$1***$3');

  const maskedContact = email?.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
         accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Shield size={40} color={COLORS.text} />
          </View>
        </View>

        {/* Title and Description */}
        <Text style={styles.title}>{t('auth.otp.title')}</Text>
        <Text style={styles.description}>
          {t('auth.otp.sentTo', { contact: maskedContact })}
        </Text>


        {/* Verification Method Toggle */}
        {/* <View style={styles.methodToggle}>
          <TouchableOpacity
            style={[
              styles.methodButton,
              verificationMethod === 'email' && styles.methodButtonActive,
            ]}
            onPress={() => setVerificationMethod('email')}
          >
            <Text style={[
              styles.methodButtonText,
              verificationMethod === 'email' && styles.methodButtonTextActive,
            ]}>
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.methodButton,
              verificationMethod === 'sms' && styles.methodButtonActive,
            ]}
            onPress={() => setVerificationMethod('sms')}
          >
            <Text style={[
              styles.methodButtonText,
              verificationMethod === 'sms' && styles.methodButtonTextActive,
            ]}>
              SMS
            </Text>
          </TouchableOpacity>
        </View> */}

        {/* OTP Input */}
        <Animated.View
          style={[
            styles.otpContainer,
            { transform: [{ translateX: shakeAnimation }] }
          ]}
        >
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </Animated.View>

        {/* Demo Code Hint */}
        {/* <View style={styles.demoHint}>
          <Text style={styles.demoHintText}>
            💡 Demo: Use code <Text style={styles.demoCode}>123456</Text> for testing
          </Text>
        </View> */}

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={() => handleVerifyOtp()}
          disabled={loading || otp.some(digit => !digit)}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.actionText} size="small" />
          ) : (
            <>
              <CheckCircle size={20} color={COLORS.actionText} />
              <Text style={styles.verifyButtonText}>{t('auth.otp.verifyCode')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          {!canResend ? (
            <Text style={styles.timerText}>
              {t('auth.otp.resendIn', { time: formatTimer(timer) })}
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={resendLoading}
            >
              {resendLoading ? (
                <ActivityIndicator color={COLORS.text} size="small" />
              ) : (
                <>
                  <RefreshCw size={16} color={COLORS.text} />
                  <Text style={styles.resendButtonText}>{t('auth.otp.resendCode')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Confirmation Modal */}
        <ConfirmationModal
          visible={showConfirmationModal}
          message={t('auth.otp.success')}
          onConfirm={() => {
            setShowConfirmationModal(false);
            switch (type) {
              case 'signup':
              case 'login':
              case 'verifyEmail':
                router.replace(resolvePostAuthRoute(redirect));
                break;
              case 'forgotPassword':
                router.replace({ pathname: '/(auth)/reset-password', params: { email, otp: otp.join('') } });
                break;
              default:
                router.replace('/(auth)/login');
                break;
            }
          }}
        />

        {/* Help Text */}
        <Text style={styles.helpText}>
          {t('auth.otp.help')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
    fontFamily: 'Inter-Regular',
  },
  contact: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 32,
    fontFamily: 'Inter-SemiBold',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  methodButtonTextActive: {
    color: COLORS.text,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    marginTop: 30,
    gap: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.card,
    fontFamily: 'Inter-SemiBold',
  },
  otpInputFilled: {
    borderColor: COLORS.action,
    backgroundColor: COLORS.surfaceSecondary,
  },
  demoHint: {
    backgroundColor: `${COLORS.warning}18`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  demoHintText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  demoCode: {
    fontWeight: '700',
    color: COLORS.text,
  },
  verifyButton: {
    backgroundColor: COLORS.action,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    marginBottom: 24,
    minWidth: 200,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.surfaceMuted,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.actionText,
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 6,
    fontFamily: 'Inter-SemiBold',
  },
  helpText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 32,
    fontFamily: 'Inter-Regular',
  },
});