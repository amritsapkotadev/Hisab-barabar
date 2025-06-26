import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Shield, RefreshCw, CircleCheck as CheckCircle } from 'lucide-react-native';

export default function OTPVerificationScreen() {
  const { email, phone, type } = useLocalSearchParams<{
    email: string;
    phone: string;
    type: string;
  }>();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms'>('email');
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, accept any 6-digit code
      if (codeToVerify === '123456' || codeToVerify.length === 6) {
        Alert.alert('Success', 'Verification successful!', [
          {
            text: 'OK',
            onPress: () => {
              if (type === 'signup') {
                router.replace('/(tabs)');
              } else {
                router.back();
              }
            },
          },
        ]);
      } else {
        shakeInputs();
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        Alert.alert('Error', 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      shakeInputs();
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      Alert.alert(
        'Code Sent', 
        `A new verification code has been sent to your ${verificationMethod === 'email' ? 'email' : 'phone'}.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskedContact = verificationMethod === 'email' 
    ? email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : phone?.replace(/(.{3})(.*)(.{2})/, '$1***$3');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Shield size={40} color="#2563eb" />
          </View>
        </View>

        {/* Title and Description */}
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.description}>
          We've sent a 6-digit verification code to your {verificationMethod === 'email' ? 'email' : 'phone number'}
        </Text>
        <Text style={styles.contact}>{maskedContact}</Text>

        {/* Verification Method Toggle */}
        <View style={styles.methodToggle}>
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
        </View>

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
              ref={(ref) => (inputRefs.current[index] = ref)}
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
        <View style={styles.demoHint}>
          <Text style={styles.demoHintText}>
            💡 Demo: Use code <Text style={styles.demoCode}>123456</Text> for testing
          </Text>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={() => handleVerifyOtp()}
          disabled={loading || otp.some(digit => !digit)}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff\" size="small" />
          ) : (
            <>
              <CheckCircle size={20} color="#ffffff" />
              <Text style={styles.verifyButtonText}>Verify Code</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          {!canResend ? (
            <Text style={styles.timerText}>
              Resend code in {formatTimer(timer)}
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={resendLoading}
            >
              {resendLoading ? (
                <ActivityIndicator color="#2563eb\" size="small" />
              ) : (
                <>
                  <RefreshCw size={16} color="#2563eb" />
                  <Text style={styles.resendButtonText}>Resend Code</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          Didn't receive the code? Check your spam folder or try a different verification method.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  contact: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 32,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  methodButtonTextActive: {
    color: '#2563eb',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  otpInputFilled: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  demoHint: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  demoHintText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
  },
  demoCode: {
    fontWeight: '700',
    color: '#92400e',
  },
  verifyButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 24,
    minWidth: 200,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#2563eb',
    marginLeft: 6,
  },
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 32,
  },
});