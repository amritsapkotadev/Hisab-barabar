import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import Layout from '@/constants/layout';

export default function VerifyOTPScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  
  const inputRefs = useRef<RNTextInput[]>([]);
  
  const { verifyOTP, sendOTP } = useAuth();
  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');
  const borderColor = useThemeColor('border');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (countdown > 0) {
        setCountdown(countdown - 1);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);
  
  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[0];
    }
    
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    // Auto focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleVerify = async () => {
    if (!email) return;
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      alert('Please enter a valid OTP');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await verifyOTP(email, otpString);
      
      if (error) throw error;
      
      router.replace('/(app)/(tabs)');
    } catch (error: any) {
      alert(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (!email || countdown > 0) return;
    
    try {
      const { error } = await sendOTP(email);
      
      if (error) throw error;
      
      setCountdown(30);
      alert('OTP resent successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to resend OTP');
    }
  };
  
  return (
    <View style={styles.container} variant="screen">
      <View style={styles.header}>
        <Text variant="heading1">Verify OTP</Text>
        <Text style={{ color: textSecondaryColor, marginTop: 8, textAlign: 'center' }}>
          We've sent a verification code to{'\n'}{email}
        </Text>
      </View>
      
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <RNTextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpInput,
              { borderColor }
            ]}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            selectionColor={primaryColor}
          />
        ))}
      </View>
      
      <Button
        title="Verify"
        onPress={handleVerify}
        isLoading={isLoading}
        style={styles.button}
      />
      
      <View style={styles.footer}>
        <Text style={{ color: textSecondaryColor }}>Didn't receive the code?</Text>
        <TouchableOpacity 
          onPress={handleResendOTP} 
          disabled={countdown > 0}
        >
          <Text 
            style={{ 
              color: countdown > 0 ? textSecondaryColor : primaryColor, 
              marginLeft: 4 
            }}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.l,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Layout.spacing.xl,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  button: {
    width: '100%',
    marginBottom: Layout.spacing.l,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Layout.spacing.m,
  },
});