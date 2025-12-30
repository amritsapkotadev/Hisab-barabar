import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import messaging from '@react-native-firebase/messaging';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, Key, CheckCircle, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

// Premium Design System
const COLORS = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  secondary: '#EC4899',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: 'rgba(0, 0, 0, 0.08)',
  glass: 'rgba(255, 255, 255, 0.95)',
  gradient1: ['#7C3AED', '#A78BFA'] as const,
  gradient2: ['#EC4899', '#F472B6'] as const,
};

export default function JoinGroup() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const validateCode = (text: string) => {
    const isValid = text.length >= 8 && /^[A-Z0-9]+$/.test(text);
    setIsValidCode(isValid);
    return text;
  };

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a group code.');
      return;
    }
    setLoading(true);

    try {
      const response = await apiService.joinGroupWithInviteCode(code.trim().toUpperCase());
      if (response) {
        router.replace('/(tabs)/groups');
        Alert.alert('Success', `Joined group with code: ${code}`);
        await messaging().subscribeToTopic(`group_${response.id}`);
        console.log(`Subscribed to topic: group_${response.id}`);
      } else {
        Alert.alert('Error', 'Failed to join group. Please check the code and try again.');
      }
    } catch (error: any) {
      console.error('Join group error:', error);
      Alert.alert('Error', error.message || 'Failed to join group. Please try again.');
    } finally {
      setLoading(false);
      setCode('');
      setIsValidCode(false);
      setIsFocused(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <Animated.View 
          style={styles.header}
          entering={FadeIn.duration(600)}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join Group</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View 
            style={styles.heroSection}
            entering={FadeInDown.duration(800).delay(200)}
          >
            <LinearGradient
              colors={COLORS.gradient1}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroIcon}>
                <Users size={32} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>Join Your Friends</Text>
              <Text style={styles.heroSubtitle}>
                Enter the group code to start splitting expenses together
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Form Section */}
          <Animated.View 
            style={styles.formSection}
            entering={FadeInUp.duration(800).delay(400)}
          >
            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <Key size={18} color={COLORS.primary} />
                  <Text style={styles.inputLabelText}>Group Code</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    isFocused && styles.inputFocused,
                    isValidCode && styles.inputValid,
                    code.length > 0 && !isValidCode && styles.inputInvalid
                  ]}
                  placeholder="Enter 8 digit code"
                  value={code}
                  onChangeText={(text) => setCode(validateCode(text.toUpperCase()))}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={8}
                  editable={!loading}
                  placeholderTextColor={COLORS.textTertiary}
                />

                {code.length > 0 && (
                  <View style={styles.validationIcon}>
                    {isValidCode ? (
                      <CheckCircle size={20} color={COLORS.success} />
                    ) : (
                      <AlertCircle size={20} color={COLORS.danger} />
                    )}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.joinButton,
                  (!isValidCode || loading) && styles.joinButtonDisabled
                ]}
                onPress={handleJoin}
                disabled={!isValidCode || loading}
              >
                <LinearGradient
                  colors={isValidCode ? COLORS.gradient1 : COLORS.gradient2}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Join Group</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>How to get a group code?</Text>
                <Text style={styles.helpText}>
                  Ask your group admin to share the invite code with you. 
                  The code is usually 8 characters long.
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  heroSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  heroGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    flex: 1,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  inputLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  input: {
    width: '100%',
    height: 56,
    borderColor: COLORS.border,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    backgroundColor: COLORS.surfaceSecondary,
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
    letterSpacing: 2,
    textAlign: 'center',
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  inputValid: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  inputInvalid: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  validationIcon: {
    position: 'absolute',
    right: 16,
    top: 52,
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  helpSection: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});