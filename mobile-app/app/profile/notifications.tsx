import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, DollarSign, Users, Calendar, Mail, Smartphone } from 'lucide-react-native';
import { useToast } from '@/components/Toast';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useAccountPreference } from '@/hooks/useAccountPreference';
import { DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings, type NotificationSettings } from '@/services/preferences';
import { setPushNotificationsEnabled } from '@/services/notifications';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function NotificationSettingsScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const { value: settings, save, loading, saving, error, retry } = useAccountPreference(
    'notifications', DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings
  );

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    if (key !== 'pushNotifications') {
      void save(next);
      return;
    }
    void (async () => {
      if (!await save(next)) return;
      try {
        await setPushNotificationsEnabled(value);
      } catch (error) {
        console.error('Failed to update push notification setting:', error);
        await save(settings);
        toast.error('Could not update push notifications. Your previous setting was kept.');
      }
    })();
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    settingKey: keyof NotificationSettings,
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
        value={settings[settingKey]}
        onValueChange={(value) => updateSetting(settingKey, value)}
        disabled={disabled || saving}
        trackColor={{ false: COLORS.switchTrackOff, true: COLORS.switchTrackOn }}
        thumbColor={COLORS.switchThumb}
        ios_backgroundColor={COLORS.switchTrackOff}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
         accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {error ? <ErrorMessage message={error} onRetry={retry} /> : loading ? (
        <LoadingSpinner message="Loading saved settings..." />
      ) : <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Notification Permissions</Text>
          <Text style={styles.infoText}>
            To receive push notifications, make sure notifications are enabled for Hisab Barabar in your device settings.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              Linking.openSettings().catch(error => {
                console.error('Failed to open device settings:', error);
                toast.error('Could not open device settings.');
              });
            }}
          >
            <Text style={styles.settingsButtonText}>Open Device Settings</Text>
          </TouchableOpacity>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Smartphone size={20} color={COLORS.textTertiary} />,
              'Push Notifications',
              'Receive notifications on this device',
              'pushNotifications'
            )}
            {renderSettingItem(
              <Mail size={20} color={COLORS.textTertiary} />,
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
              <DollarSign size={20} color={COLORS.textTertiary} />,
              'New Expenses',
              'When someone adds a new expense',
              'expenseAdded',
              !settings.pushNotifications && !settings.emailNotifications
            )}
            {renderSettingItem(
              <DollarSign size={20} color={COLORS.textTertiary} />,
              'Expense Updates',
              'When expenses are edited or deleted',
              'expenseUpdated',
              !settings.pushNotifications && !settings.emailNotifications
            )}
            {renderSettingItem(
              <Users size={20} color={COLORS.textTertiary} />,
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
              <Bell size={20} color={COLORS.textTertiary} />,
              'Balance Reminders',
              'Reminders to settle outstanding balances',
              'balanceReminders',
              !settings.pushNotifications && !settings.emailNotifications
            )}
            {renderSettingItem(
              <Calendar size={20} color={COLORS.textTertiary} />,
              'Weekly Digest',
              'Summary of your weekly activity',
              'weeklyDigest',
              !settings.emailNotifications
            )}
            {renderSettingItem(
              <Calendar size={20} color={COLORS.textTertiary} />,
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
              <Bell size={20} color={COLORS.textTertiary} />,
              'Sound',
              'Play sound for notifications',
              'soundEnabled',
              !settings.pushNotifications
            )}
            {renderSettingItem(
              <Smartphone size={20} color={COLORS.textTertiary} />,
              'Vibration',
              'Vibrate for notifications',
              'vibrationEnabled',
              !settings.pushNotifications
            )}
          </View>
        </View>

      </ScrollView>}
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  settingsGroup: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  disabledItem: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
  },
  disabledText: {
    color: COLORS.textTertiary,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
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
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
    marginBottom: 12,
  },
  settingsButton: {
    backgroundColor: COLORS.action,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  settingsButtonText: {
    color: COLORS.actionText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});