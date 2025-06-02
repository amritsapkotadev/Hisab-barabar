import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View as RNView,
} from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { View } from '@/components/View';
import { signUp } from '@/services/auth';
import { Mail, Lock, User, ArrowLeft, ArrowRight } from 'lucide-react-native';
import Layout from '@/constants/layout';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { user, error: signUpError } = await signUp(email.trim(), password, name.trim());
      
      if (signUpError) throw signUpError;
      
      if (user) {
        router.replace('/(app)/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
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
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text variant="heading1" style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <View style={styles.card}>
            <TextInput
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              leftIcon={<User size={20} color="#6B7280" />}
              error={error}
            />

            <TextInput
              label="Email"
              placeholder="your.email@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={<Mail size={20} color="#6B7280" />}
              error={error}
            />

            <TextInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry
              leftIcon={<Lock size={20} color="#6B7280" />}
              error={error}
            />

            <TextInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
              secureTextEntry
              leftIcon={<Lock size={20} color="#6B7280" />}
              error={error}
            />

            <Button
              title="Sign Up"
              onPress={handleSignUp}
              isLoading={isLoading}
              style={styles.button}
              rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
            />

            <RNView style={styles.loginContainer}>
              <Text>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginText}>Sign In</Text>
              </TouchableOpacity>
            </RNView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.l,
    paddingVertical: Layout.spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: Layout.spacing.xl,
    left: Layout.spacing.l,
    padding: Layout.spacing.s,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1,
  },
  header: {
    marginTop: Layout.spacing.xxl * 2,
    marginBottom: Layout.spacing.xl,
  },
  title: {
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Layout.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    marginTop: Layout.spacing.l,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Layout.spacing.l,
  },
  loginText: {
    color: '#2563EB',
    fontWeight: '600',
  },
});