import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import Layout from '@/constants/layout';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, sendOTP } = useAuth();
  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      router.replace('/(app)/(tabs)');
    } catch (error: any) {
      alert(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTP = async () => {
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await sendOTP(email);
      if (error) throw error;

      router.push({ pathname: '/verify-otp', params: { email } });
    } catch (error: any) {
      alert(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container} variant="screen">

          {/* Header */}
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://i.imgur.com/REr2PJo.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text variant="heading1">Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue tracking your expenses
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={textSecondaryColor} />}
              error={errors.email}
            />

            <TextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={20} color={textSecondaryColor} />}
              error={errors.password}
            />

            <TouchableOpacity 
              onPress={() => router.push('/forgot-password')}
              style={styles.forgotPassword}
            >
              <Text style={{ color: primaryColor }}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="Login"
              onPress={handleLogin}
              isLoading={isLoading}
              style={styles.button}
              rightIcon={<ArrowRight size={20} color="#fff" />}
            />

            <Button
              title="Login with OTP"
              variant="outline"
              onPress={handleOTP}
              isLoading={isLoading}
              style={[styles.button, { marginTop: 8 }]}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={{ color: textSecondaryColor }}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={[styles.signup, { color: primaryColor }]}> Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Layout.spacing.l,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.l,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Layout.spacing.m,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    marginVertical: Layout.spacing.m,
    gap: Layout.spacing.m,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: Layout.spacing.m,
  },
  button: {
    marginVertical: Layout.spacing.s,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.l,
  },
  signup: {
    fontWeight: '600',
    marginLeft: 4,
  },
});
