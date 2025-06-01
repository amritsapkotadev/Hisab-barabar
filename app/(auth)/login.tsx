import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
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
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
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
      
      router.push({
        pathname: '/verify-otp',
        params: { email }
      });
    } catch (error: any) {
      alert(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container} variant="screen">
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://i.imgur.com/REr2PJo.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="heading1">Welcome back</Text>
        <Text style={{ color: textSecondaryColor, marginTop: 8 }}>
          Sign in to continue tracking your expenses
        </Text>
      </View>

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
          rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
        />

        <Button
          title="Login with OTP"
          variant="outline"
          onPress={handleOTP}
          style={styles.button}
          isLoading={isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={{ color: textSecondaryColor }}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={{ color: primaryColor, marginLeft: 4 }}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.l,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Layout.spacing.m,
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Layout.spacing.l,
  },
  button: {
    marginVertical: Layout.spacing.s,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Layout.spacing.l,
  },
});