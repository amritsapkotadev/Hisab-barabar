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

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');
  const backgroundColor = useThemeColor('background');
  const cardBackground = useThemeColor('cardBackground') || '#fff';

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
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.avatarContainer, { shadowColor: primaryColor }]}
          activeOpacity={0.8}
          accessibilityLabel="Change profile picture"
        >
          <Image
            source={{ uri: profile?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' }}
            style={styles.avatar}
          />
          <View style={[styles.cameraButton, { backgroundColor: primaryColor }]}>
            <Camera size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text variant="heading2" style={[styles.name, { color: primaryColor }]}>
          {profile?.display_name || 'Your Name'}
        </Text>
        <Text style={[styles.email, { color: textSecondaryColor }]}>{user?.email}</Text>
      </View>

      <Card style={[styles.section, { backgroundColor: cardBackground, shadowColor: primaryColor }]}>
        <View style={styles.sectionHeader}>
          <Text variant="heading3" style={[styles.sectionTitle, { color: primaryColor }]}>
            Personal Information
          </Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.editText, { color: primaryColor }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        {editing ? (
          <View>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Enter your full name"
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="Enter your phone number"
            />
            <View style={styles.buttonGroup}>
              <Button
                title="Cancel"
                onPress={() => setEditing(false)}
                variant="outline"
                style={[styles.button, { marginRight: 12 }]}
              />
              <Button
                title="Save"
                onPress={handleUpdateProfile}
                isLoading={loading}
                style={styles.button}
              />
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text bold style={styles.infoValue}>{name || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text bold style={styles.infoValue}>{phone || 'Not set'}</Text>
            </View>
          </View>
        )}
      </Card>

      <Card style={[styles.section, { backgroundColor: cardBackground, shadowColor: primaryColor }]}>
        <Text variant="heading3" style={[styles.sectionTitle, { color: primaryColor, marginBottom: 8 }]}>
          Settings
        </Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            {item.icon}
            <Text style={[styles.menuItemText, { color: primaryColor }]}>{item.title}</Text>
            <ChevronRight size={20} color={textSecondaryColor} />
          </TouchableOpacity>
        ))}
      </Card>

      <Button
        title="Log Out"
        onPress={handleLogout}
        variant="outline"
        icon={<LogOut color={primaryColor} size={20} />}
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 60,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  name: {
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: 0.3,
  },
  email: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    // iOS shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // Android shadow
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
  },
  editText: {
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    minWidth: 100,
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
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    borderColor: '#EF4444',
  },
});
