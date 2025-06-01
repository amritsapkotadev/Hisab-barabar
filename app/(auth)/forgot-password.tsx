import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { resetPassword } from '@/services/auth';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import Layout from '@/constants/layout';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const textSecondaryColor = useThemeColor('textSecondary');
  const successColor = useThemeColor('success');

  const validateEmail = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) throw error;
      
      setIsSuccess(true);
    } catch (error: any) {
      alert(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container} variant="screen">
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color={textSecondaryColor} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text variant="heading1">Reset Password</Text>
        <Text style={{ color: textSecondaryColor, marginTop: 8, marginBottom: Layout.spacing.xl }}>
          Enter your email and we'll send you instructions to reset your password
        </Text>

        {isSuccess ? (
          <View style={styles.successContainer}>
            <Text style={{ color: successColor, textAlign: 'center', marginBottom: 16 }}>
              Reset instructions sent! Check your email.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => router.replace('/login')}
              style={styles.button}
            />
          </View>
        ) : (
          <>
            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={textSecondaryColor} />}
              error={error}
            />

            <Button
              title="Send Reset Instructions"
              onPress={handleResetPassword}
              isLoading={isLoading}
              style={styles.button}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.l,
  },
  backButton: {
    marginTop: Layout.spacing.l,
    marginBottom: Layout.spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.xl,
  },
  button: {
    marginTop: Layout.spacing.l,
  },
});