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
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Globe, 
  Palette, 
  Bell,
  Download,
  Trash2,
  RefreshCw,
  ChevronRight
} from 'lucide-react-native';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    language: 'English',
    theme: 'System',
    autoBackup: true,
    offlineMode: false,
    smartNotifications: true,
    weeklyDigest: true,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleCurrencyChange = () => {
    Alert.alert(
      'Currency',
      'Choose your preferred currency',
      [
        { text: 'USD ($)', onPress: () => updateSetting('currency', 'USD') },
        { text: 'EUR (€)', onPress: () => updateSetting('currency', 'EUR') },
        { text: 'GBP (£)', onPress: () => updateSetting('currency', 'GBP') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDateFormatChange = () => {
    Alert.alert(
      'Date Format',
      'Choose your preferred date format',
      [
        { text: 'MM/DD/YYYY', onPress: () => updateSetting('dateFormat', 'MM/DD/YYYY') },
        { text: 'DD/MM/YYYY', onPress: () => updateSetting('dateFormat', 'DD/MM/YYYY') },
        { text: 'YYYY-MM-DD', onPress: () => updateSetting('dateFormat', 'YYYY-MM-DD') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Language',
      'Choose your preferred language',
      [
        { text: 'English', onPress: () => updateSetting('language', 'English') },
        { text: 'Spanish', onPress: () => updateSetting('language', 'Spanish') },
        { text: 'French', onPress: () => updateSetting('language', 'French') },
        { text: 'German', onPress: () => updateSetting('language', 'German') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Theme',
      'Choose your preferred theme',
      [
        { text: 'Light', onPress: () => updateSetting('theme', 'Light') },
        { text: 'Dark', onPress: () => updateSetting('theme', 'Dark') },
        { text: 'System', onPress: () => updateSetting('theme', 'System') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This will create a CSV file with all your expense data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Success', 'Data exported successfully!') },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and may improve app performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: () => Alert.alert('Success', 'Cache cleared successfully!') },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all app settings to their default values. Your data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            setSettings({
              currency: 'USD',
              dateFormat: 'MM/DD/YYYY',
              language: 'English',
              theme: 'System',
              autoBackup: true,
              offlineMode: false,
              smartNotifications: true,
              weeklyDigest: true,
            });
            Alert.alert('Success', 'Settings reset to defaults!');
          }
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onPress: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {rightElement || <ChevronRight size={20} color="#9ca3af" />}
    </TouchableOpacity>
  );

  const renderSwitchItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    settingKey: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={settings[settingKey as keyof typeof settings] as boolean}
        onValueChange={(value) => updateSetting(settingKey, value)}
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
        <Text style={styles.title}>App Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display & Format</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <DollarSign size={20} color="#6b7280" />,
              'Currency',
              settings.currency,
              handleCurrencyChange
            )}
            {renderSettingItem(
              <Calendar size={20} color="#6b7280" />,
              'Date Format',
              settings.dateFormat,
              handleDateFormatChange
            )}
            {renderSettingItem(
              <Globe size={20} color="#6b7280" />,
              'Language',
              settings.language,
              handleLanguageChange
            )}
            {renderSettingItem(
              <Palette size={20} color="#6b7280" />,
              'Theme',
              settings.theme,
              handleThemeChange
            )}
          </View>
        </View>

        {/* App Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Behavior</Text>
          <View style={styles.settingsGroup}>
            {renderSwitchItem(
              <Download size={20} color="#6b7280" />,
              'Auto Backup',
              'Automatically backup your data to cloud',
              'autoBackup'
            )}
            {renderSwitchItem(
              <Globe size={20} color="#6b7280" />,
              'Offline Mode',
              'Allow app to work without internet',
              'offlineMode'
            )}
            {renderSwitchItem(
              <Bell size={20} color="#6b7280" />,
              'Smart Notifications',
              'Intelligent notification timing',
              'smartNotifications'
            )}
            {renderSwitchItem(
              <Calendar size={20} color="#6b7280" />,
              'Weekly Digest',
              'Receive weekly expense summaries',
              'weeklyDigest'
            )}
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Download size={20} color="#6b7280" />,
              'Export Data',
              'Download your data as CSV',
              handleExportData
            )}
            {renderSettingItem(
              <RefreshCw size={20} color="#6b7280" />,
              'Clear Cache',
              'Free up storage space',
              handleClearCache
            )}
          </View>
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Trash2 size={20} color="#dc2626" />,
              'Reset Settings',
              'Reset all settings to defaults',
              handleResetSettings
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Settings</Text>
          <Text style={styles.infoText}>
            These settings are synced across all your devices. Changes may take a few moments to apply.
          </Text>
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
  },
});