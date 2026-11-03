import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal } from 'react-native'
import React, { useRef, useState } from 'react'
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import { subscribeToGroupTopic } from '@/services/notifications';
import { getGroupIdFromInviteQr, normalizeInviteCode } from '@/utils/invite';
import { useToast } from '@/components/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, Key, CheckCircle, AlertCircle, QrCode } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function JoinGroup() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scanHandled = useRef(false);

  const validateCode = (text: string) => {
    const isValid = text.length >= 8 && /^[A-Z0-9]+$/.test(text);
    setIsValidCode(isValid);
    return text;
  };

  const handleJoin = async () => {
    if (!code.trim()) {
      toast.error('Please enter a group code.');
      return;
    }
    setLoading(true);

    try {
      const response = await apiService.joinGroupWithInviteCode(normalizeInviteCode(code));
      if (response) {
        await subscribeToGroupTopic(response.id);
        toast.success(`You joined ${response.name}`);
        router.replace('/(tabs)/groups');
      } else {
        toast.error('Failed to join group. Please check the code and try again.');
      }
    } catch (error: any) {
      console.error('Join group error:', error);
      toast.error(error.message || 'Failed to join group. Please try again.');
    } finally {
      setLoading(false);
      setCode('');
      setIsValidCode(false);
      setIsFocused(false);
    }
  };

  const handleOpenScanner = async () => {
    try {
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          toast.error('Camera access is needed to scan a group QR code.');
          return;
        }
      }
      scanHandled.current = false;
      setScannerVisible(true);
    } catch (error) {
      console.error('Request camera permission error:', error);
      toast.error('Could not access the camera. You can still enter a group code.');
    }
  };

  const handleQrScanned = ({ data }: { data: string }) => {
    if (scanHandled.current) return;
    scanHandled.current = true;
    setScannerVisible(false);

    const groupId = getGroupIdFromInviteQr(data);
    if (!groupId) {
      toast.error('This QR code is not a valid Hisab Barabar group invite.');
      return;
    }
    router.push(`/join/${groupId}`);
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
           accessibilityRole="button" accessibilityLabel="Go back">
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
            <View style={styles.heroGradient}>
              <View style={styles.heroIcon}>
                <Users size={32} color={COLORS.text} />
              </View>
              <Text style={styles.heroTitle}>Join Your Friends</Text>
              <Text style={styles.heroSubtitle}>
                Enter the group code to start splitting expenses together
              </Text>
            </View>
          </Animated.View>

          {/* Form Section */}
          <Animated.View 
            style={styles.formSection}
            entering={FadeInUp.duration(800).delay(400)}
          >
            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <Key size={18} color={COLORS.action} />
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
                style={styles.scanQrButton}
                onPress={handleOpenScanner}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Scan group QR code"
              >
                <QrCode size={18} color={COLORS.action} />
                <Text style={styles.scanQrText}>Scan QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.joinButton,
                  (!isValidCode || loading) && styles.joinButtonDisabled
                ]}
                onPress={handleJoin}
                disabled={!isValidCode || loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.actionText} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Join Group</Text>
                )}
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
      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <SafeAreaView style={styles.scannerModal}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setScannerVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close QR scanner"
            >
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Group QR Code</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.scannerHint}>Place the group invite QR code inside the frame.</Text>
          <View style={styles.scannerPreview}>
            <CameraView
              style={styles.scannerCamera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleQrScanned}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    flex: 1,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderColor: COLORS.action,
  },
  inputValid: {
    borderColor: COLORS.success,
  },
  inputInvalid: {
    borderColor: COLORS.danger,
  },
  validationIcon: {
    position: 'absolute',
    right: 16,
    top: 52,
  },
  scanQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  scanQrText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  joinButton: {
    borderRadius: 999,
    backgroundColor: COLORS.action,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.actionText,
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
  scannerModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  scannerHint: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  scannerPreview: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  scannerCamera: {
    flex: 1,
  },
});