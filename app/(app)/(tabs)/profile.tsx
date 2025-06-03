import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, updateProfile } from '@/services/profiles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Camera, LogOut, Moon, Sun, Settings, ChevronRight, Bell, Shield, CircleHelp as HelpCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

// Updated color scheme
const COLORS = {
  primary: '#6366F1',
  secondary: '#818CF8',
  background: '#F9FAFB',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  accent: '#8B5CF6',
  error: '#EF4444',
  success: '#10B981',
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const primaryColor = darkMode ? '#A5B4FC' : COLORS.primary;
  const textSecondaryColor = darkMode ? '#9CA3AF' : COLORS.textSecondary;
  const backgroundColor = darkMode ? '#111827' : COLORS.background;
  const cardBackground = darkMode ? '#1F2937' : COLORS.card;
  const textColor = darkMode ? '#F3F4F6' : COLORS.textPrimary;
  const borderColor = darkMode ? '#374151' : COLORS.border;

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await getProfile(user.id);
      setProfile(data);
      setName(data.display_name);
      setPhone(data.phone || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await updateProfile(user.id, {
        display_name: name,
        phone,
      });
      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      // Handle image upload
      console.log(result.assets[0].uri);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const menuItems = [
    {
      icon: <Bell size={24} color={primaryColor} />,
      title: 'Notifications',
      onPress: () => console.log('Notifications'),
    },
    {
      icon: <Shield size={24} color={primaryColor} />,
      title: 'Privacy & Security',
      onPress: () => console.log('Privacy'),
    },
    {
      icon: <Settings size={24} color={primaryColor} />,
      title: 'Settings',
      onPress: () => console.log('Settings'),
    },
    {
      icon: <HelpCircle size={24} color={primaryColor} />,
      title: 'Help & Support',
      onPress: () => console.log('Help'),
    },
    {
      icon: darkMode ? 
        <Moon size={24} color={primaryColor} /> : 
        <Sun size={24} color={primaryColor} />,
      title: darkMode ? 'Light Mode' : 'Dark Mode',
      onPress: toggleDarkMode,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header with Gradient Background */}
      <Animated.View 
        style={[styles.headerContainer, { backgroundColor: primaryColor }]}
        entering={FadeIn.duration(600)}
      >
        <Animated.View 
          style={styles.headerContent}
          entering={FadeInDown.delay(200).duration(600)}
        >
          <TouchableOpacity
            onPress={pickImage}
            style={styles.avatarContainer}
            activeOpacity={0.8}
            accessibilityLabel="Change profile picture"
          >
            <Image
              source={{ uri: profile?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' }}
              style={styles.avatar}
            />
            <View style={[styles.cameraButton, { backgroundColor: COLORS.card }]}>
              <Camera size={18} color={primaryColor} />
            </View>
          </TouchableOpacity>

          <Text variant="heading2" style={[styles.name, { color: COLORS.card }]}>
            {profile?.display_name || 'Your Name'}
          </Text>
          <Text style={[styles.email, { color: 'rgba(255,255,255,0.8)' }]}>{user?.email}</Text>
        </Animated.View>
      </Animated.View>

      {/* Personal Information Card */}
      <Animated.View 
        entering={FadeInUp.delay(300).duration(600)}
        style={{ paddingHorizontal: 16 }}
      >
        <Card style={[styles.section, { backgroundColor: cardBackground, borderColor }]}>
          <View style={styles.sectionHeader}>
            <Text variant="heading3" style={[styles.sectionTitle, { color: textColor }]}>
              Personal Information
            </Text>
            {!editing ? (
              <TouchableOpacity 
                onPress={() => setEditing(true)} 
                style={styles.editButton}
              >
                <Text style={[styles.editText, { color: primaryColor }]}>Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          
          {editing ? (
            <Animated.View entering={FadeIn.duration(400)}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={[styles.input, { borderColor, color: textColor }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={textSecondaryColor}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Phone</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={[styles.input, { borderColor, color: textColor }]}
                  placeholder="Enter your phone number"
                  placeholderTextColor={textSecondaryColor}
                />
              </View>
              
              <View style={styles.buttonGroup}>
                <Button
                  title="Cancel"
                  onPress={() => setEditing(false)}
                  variant="outline"
                  style={[styles.button, { borderColor: primaryColor }]}
                  textStyle={{ color: primaryColor }}
                />
                <Button
                  title="Save"
                  onPress={handleUpdateProfile}
                  isLoading={loading}
                  style={[styles.button, { backgroundColor: primaryColor }]}
                />
              </View>
            </Animated.View>
          ) : (
            <View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: textSecondaryColor }]}>Full Name</Text>
                <Text bold style={[styles.infoValue, { color: textColor }]}>{name || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: textSecondaryColor }]}>Phone</Text>
                <Text bold style={[styles.infoValue, { color: textColor }]}>{phone || 'Not set'}</Text>
              </View>
            </View>
          )}
        </Card>
      </Animated.View>

      {/* Settings Card */}
      <Animated.View 
        entering={FadeInUp.delay(400).duration(600)}
        style={{ paddingHorizontal: 16, marginTop: 16 }}
      >
        <Card style={[styles.section, { backgroundColor: cardBackground, borderColor }]}>
          <Text variant="heading3" style={[styles.sectionTitle, { color: textColor, marginBottom: 8 }]}>
            Settings
          </Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
                { borderBottomColor: borderColor }
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={styles.iconContainer}>
                {item.icon}
              </View>
              <Text style={[styles.menuItemText, { color: textColor }]}>{item.title}</Text>
              <ChevronRight size={20} color={textSecondaryColor} />
            </TouchableOpacity>
          ))}
        </Card>
      </Animated.View>

      {/* Logout Button */}
      <Animated.View 
        entering={FadeInUp.delay(500).duration(600)}
        style={{ paddingHorizontal: 16, marginTop: 24 }}
      >
        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="outline"
          icon={<LogOut color={COLORS.error} size={20} />}
          style={[styles.logoutButton, { borderColor: COLORS.error }]}
          textStyle={{ color: COLORS.error }}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cameraButton: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  name: {
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: 0.3,
    marginTop: 16,
  },
  email: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    // Android shadow
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  editText: {
    fontWeight: '600',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 16,
    borderWidth: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  button: {
    minWidth: 100,
    borderRadius: 12,
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
    marginBottom: 24,
    flexDirection: 'row',
  },
});