import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Image
            source={{ uri: profile?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' }}
            style={styles.avatar}
          />
          <View style={styles.cameraButton}>
            <Camera size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        
        <Text variant="heading2" style={styles.name}>{profile?.display_name}</Text>
        <Text style={[styles.email, { color: textSecondaryColor }]}>{user?.email}</Text>
      </View>

      <Card style={styles.section}>
        <Text variant="heading3" style={styles.sectionTitle}>Personal Information</Text>
        {editing ? (
          <View>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <View style={styles.buttonGroup}>
              <Button
                title="Cancel"
                onPress={() => setEditing(false)}
                variant="outline"
                style={styles.button}
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
          <TouchableOpacity onPress={() => setEditing(true)}>
            <View style={styles.infoRow}>
              <Text>Full Name</Text>
              <Text bold>{name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text>Phone</Text>
              <Text bold>{phone || 'Not set'}</Text>
            </View>
          </TouchableOpacity>
        )}
      </Card>

      <Card style={styles.section}>
        <Text variant="heading3" style={styles.sectionTitle}>Settings</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuItemBorder
            ]}
            onPress={item.onPress}
          >
            {item.icon}
            <Text style={styles.menuItemText}>{item.title}</Text>
            <ChevronRight size={20} color={textSecondaryColor} />
          </TouchableOpacity>
        ))}
      </Card>

      <Button
        title="Log Out"
        onPress={handleLogout}
        variant="outline"
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2563EB',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    marginTop: 8,
  },
  email: {
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 16,
  },
  logoutButton: {
    marginVertical: 24,
  },
});