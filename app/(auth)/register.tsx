import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, User, ArrowRight } from 'lucide-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import Layout from '@/constants/layout';
import { createProfile } from '@/services/profiles';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ 
    name?: string;
    email?: string; 
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { signUp } = useAuth();
  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');

  const validateForm = () => {
    const newErrors: { 
      name?: string;
      email?: string; 
      password?: string;
      confirmPassword?: string;
    } = {};
    
    if (!name) {
      newErrors.name = 'Name is required';
    }
    
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
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await signUp(email, password);
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile
        await createProfile(data.user.id, name);
      }
      
      router.push({
        pathname: '/verify-otp',
        params: { email }
      });
    } catch (error: any) {
      alert(error.message || 'Failed to sign up');
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
        <Text variant="heading1">Create Account</Text>
        <Text style={{ color: textSecondaryColor, marginTop: 8 }}>
          Sign up to start tracking expenses with friends
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          leftIcon={<User size={20} color={textSecondaryColor} />}
          error={errors.name}
        />

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
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon={<Lock size={20} color={textSecondaryColor} />}
          error={errors.password}
        />

        <TextInput
          label="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          leftIcon={<Lock size={20} color={textSecondaryColor} />}
          error={errors.confirmPassword}
        />

        <Button
          title="Register"
          onPress={handleRegister}
          isLoading={isLoading}
          style={styles.button}
          rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
        />
      </View>

      <View style={styles.footer}>
        <Text style={{ color: textSecondaryColor }}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={{ color: primaryColor, marginLeft: 4 }}>Sign in</Text>
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
    marginTop: Layout.spacing.l,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Layout.spacing.m,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: Layout.spacing.m,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Layout.spacing.l,
  },
});