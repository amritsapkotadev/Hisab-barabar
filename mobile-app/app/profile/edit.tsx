import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { ArrowLeft, User, Mail, Save, Camera, Phone } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useToast } from '@/components/Toast';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [picture, setPicture] = useState<string | undefined>();
  const [authProvider, setAuthProvider] = useState<'email' | 'google' | 'both'>('email');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const user = await apiService.getUserProfile();
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone ?? '');
      setPicture(user.picture);
      setAuthProvider(user.authProvider || (user.googleId ? 'google' : 'email'));
    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setSaving(true);
    try {
      await apiService.updateUserProfile({ name, email, phone });
      toast.success('Profile updated successfully!');
      router.back();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadProfilePicture = async (useCamera: boolean) => {
    setUploadingPicture(true);
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.error(useCamera
          ? 'Camera access is needed to take a profile photo.'
          : 'Photo library access is needed to choose a profile photo.');
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };
      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;

      const image = result.assets[0];
      if (!image) {
        toast.error('No profile photo was selected.');
        return;
      }

      const user = await apiService.uploadUserProfilePicture(image);
      setPicture(user.picture);
      toast.success('Profile photo updated successfully.');
    } catch (error) {
      console.error('Profile photo selection or upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile photo.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleChangePicture = () => {
    Alert.alert('Change profile photo', 'Choose how to add your profile photo.', [
      { text: 'Take Photo', onPress: () => { void uploadProfilePicture(true); } },
      { text: 'Choose from Library', onPress: () => { void uploadProfilePicture(false); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.action} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
           accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveButton, (saving || uploadingPicture) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || uploadingPicture}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.actionText} />
            ) : (
              <Save size={20} color={COLORS.actionText} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {picture ? (
                  <Image 
                    source={{ uri: picture }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <User size={40} color={COLORS.textTertiary} />
                )}
              </View>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleChangePicture}
                disabled={uploadingPicture || saving}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                {uploadingPicture
                  ? <ActivityIndicator size="small" color={COLORS.actionText} />
                  : <Camera size={16} color={COLORS.actionText} />}
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarText}>
              {uploadingPicture
                ? 'Uploading photo...'
                : authProvider === 'google'
                  ? 'Tap to set a custom photo'
                  : 'Tap to change photo'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  maxLength={10}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              {authProvider === 'email' ? (
                <View style={styles.inputContainer}>
                  <Mail size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                <View style={[styles.inputContainer, styles.inputReadonly]}>
                  <Mail size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                  <Text style={styles.inputReadonlyText}>{email}</Text>
                </View>
              )}
              {(authProvider === 'google' || authProvider === 'both') && (
                <Text style={styles.helperText}>
                  Email cannot be changed for Google accounts
                </Text>
              )}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Profile Information</Text>
              <Text style={styles.infoText}>
                Your name and email are used to identify you in groups and for notifications.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  saveButton: {
    backgroundColor: COLORS.action,
    width: 40,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.action,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.card,
  },
  avatarText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Inter-Regular',
    paddingVertical: 12,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  inputReadonly: {
    backgroundColor: COLORS.surfaceSecondary,
    borderColor: COLORS.border,
  },
  inputReadonlyText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    paddingVertical: 12,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 8,
  },
});