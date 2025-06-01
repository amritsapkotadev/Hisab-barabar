import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  View as RNView,
} from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { resetPassword } from '@/services/auth';
import { Mail, ArrowLeft } from 'lucide-react-native';
import Layout from '@/constants/layout';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
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
      const { error } = await resetPassword(email.trim());
      if (error) throw error;
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert('Oops!', err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RNView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={28} color="#fff" />
          </TouchableOpacity>

          <RNView style={styles.card}>
            <Text style={styles.title}>Reset Password</Text>

            <Text style={styles.description}>
              Enter your email below and we’ll send instructions to reset your password.
            </Text>

            {isSuccess ? (
              <RNView style={styles.successContainer}>
                <Text style={styles.successText}>
                  🎉 Reset instructions sent! Please check your email.
                </Text>

                <Button
                  title="Back to Login"
                  onPress={() => router.replace('/login')}
                  style={styles.button}
                />
              </RNView>
            ) : (
              <>
                <TextInput
                  label="Email"
                  placeholder="your.email@example.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={<Mail size={20} color="#999" />}
                  error={error}
                  style={styles.input}
                  returnKeyType="send"
                  onSubmitEditing={handleResetPassword}
                  editable={!isLoading}
                  textColor="#222"         // Make sure input text is dark
                />

                <Button
                  title="Send Reset Instructions"
                  onPress={handleResetPassword}
                  isLoading={isLoading}
                  style={styles.button}
                  disabled={isLoading}
                />
              </>
            )}
          </RNView>
        </ScrollView>
      </KeyboardAvoidingView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e', // Dark navy background
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.l,
    paddingVertical: Layout.spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: Layout.spacing.xl + 10,
    left: Layout.spacing.l,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 16,
    zIndex: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
    color: '#222',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
    color: '#555', // medium gray, highly readable on white
  },
  input: {
    backgroundColor: '#eaeaea',   // Slightly darker gray background
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: Layout.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
    color:'black', // Ensure text is readable
    borderColor: '#ccc', // Light gray border
  },
  button: {
    borderRadius: 24,
    marginTop: Layout.spacing.s,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: Layout.spacing.l,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
    color: '#28a745', // success green
  },
});
