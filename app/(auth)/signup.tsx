import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  View as RNView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { View } from '@/components/View';
import { signUp } from '@/services/auth';
import { useAuth, useOAuth } from '@clerk/clerk-expo';
import { Mail, Lock, User, ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import Layout from '@/constants/layout';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { isSignedIn, signOut } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(app)/(tabs)');
    }
  }, [isSignedIn]);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions');
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

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      
      if (isSignedIn) {
        await signOut();
      }

      const { createdSessionId, setActive } = await startOAuthFlow();
 
      if (createdSessionId) {
        setActive({ session: createdSessionId });
        router.replace('/(app)/(tabs)');
      }
    } catch (err: any) {
      if (err.message === "You're already signed in.") {
        Alert.alert(
          'Already Signed In',
          'You are already signed in. Please sign out first to switch accounts.',
          [{ text: 'OK' }]
        );
      } else {
        setError('Failed to sign up with Google');
        console.error("OAuth error:", err);
      }
    } finally {
      setIsGoogleLoading(false);
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
            <Text style={styles.subtitle}>Join us today</Text>
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

            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Check size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.termsText}>
                I accept the Terms & Conditions and Privacy Policy
              </Text>
            </TouchableOpacity>

            <Button
              title="Sign Up"
              onPress={handleSignUp}
              isLoading={isLoading}
              style={styles.button}
              rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Continue with Google"
              onPress={handleGoogleSignUp}
              isLoading={isGoogleLoading}
              variant="outline"
              style={styles.googleButton}
              leftIcon={
                <Image
                  source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                  style={styles.googleIcon}
                />
              }
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.spacing.m,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: Layout.spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  button: {
    marginTop: Layout.spacing.l,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.spacing.l,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: Layout.spacing.m,
    color: '#6B7280',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: Layout.spacing.s,
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