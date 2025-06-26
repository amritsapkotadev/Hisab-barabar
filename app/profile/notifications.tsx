import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, DollarSign, Users, Calendar, Mail, Smartphone } from 'lucide-react-native';

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    expenseAdded: true,
    expenseUpdated: true,
    groupInvites: true,
    balanceReminders: true,
    weeklyDigest: false,
    monthlyReport: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    settingKey: string,
    disabled: boolean = false
  ) => (
    <View style={[styles.settingItem, disabled && styles.disabledItem]}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>{title}</Text>
        <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>{subtitle}</Text>
      </View>
      <Switch
        value={settings[settingKey as keyof typeof settings] as boolean}
        onValueChange={(value) => updateSetting(settingKey, value)}
        disabled={disabled}
        trackColor={{ false: '#f3f4f6', true: '#bfdbfe' }}
        thumbColor={settings[settingKey as keyof typeof settings] ? '#2563eb' : '#9ca3af'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Smartphone size={20} color="#6b7280" />,
              'Push Notifications',
              'Receive notifications on this device',
              'pushNotifications'
            )}
            {renderSettingItem(
              <Mail size={20} color="#6b7280" />,
              'Email Notifications',
              'Receive notifications via email',
              'emailNotifications'
            )}
          </View>
        </View>

        {/* Expense Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Activity</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <DollarSign size={20} color="#6b7280" />,
              'New Expenses',
              'When someone adds a new expense',
              'expenseAdded',
              !settings.pushNotifications && !settings.emailNotifications
            )}
            {renderSettingItem(
              <DollarSign size={20} color="#6b7280" />,
              'Expense Updates',
              'When expenses are edited or deleted',
              'expenseUpdated',
              !settings.pushNotifications && !settings.emailNotifications
            )}
            {renderSettingItem(
              <Users size={20} color="#6b7280" />,
              'Group Invites',
              'When you\'re invited to a group',
              'groupInvites',
              !settings.pushNotifications && !settings.emailNotifications
            )}
          </View>
        </View>

        {/* Balance & Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance & Reports</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Bell size={20} color="#6b7280" />,
              'Balance Reminders',
              'Reminders to settle outstanding balances',
              'balanceReminders',
              !settings.pushNotifications && !settings.emailNotifications
            )}
            {renderSettingItem(
              <Calendar size={20} color="#6b7280" />,
              'Weekly Digest',
              'Summary of your weekly activity',
              'weeklyDigest',
              !settings.emailNotifications
            )}
            {renderSettingItem(
              <Calendar size={20} color="#6b7280" />,
              'Monthly Report',
              'Detailed monthly expense report',
              'monthlyReport',
              !settings.emailNotifications
            )}
          </View>
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Vibration</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Bell size={20} color="#6b7280" />,
              'Sound',
              'Play sound for notifications',
              'soundEnabled',
              !settings.pushNotifications
            )}
            {renderSettingItem(
              <Smartphone size={20} color="#6b7280" />,
              'Vibration',
              'Vibrate for notifications',
              'vibrationEnabled',
              !settings.pushNotifications
            )}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Notification Permissions</Text>
          <Text style={styles.infoText}>
            To receive push notifications, make sure notifications are enabled for SplitWise in your device settings.
          </Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => Alert.alert('Settings', 'This would open device notification settings')}
          >
            <Text style={styles.settingsButtonText}>Open Device Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  settingsGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  disabledItem: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  disabledText: {
    color: '#9ca3af',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
    marginBottom: 12,
  },
  settingsButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});