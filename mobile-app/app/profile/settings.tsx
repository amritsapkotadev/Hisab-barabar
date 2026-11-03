import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/components/Toast';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '@/i18n';
import { router } from 'expo-router';
import { type ThemeColors, type ThemePreference } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useAccountPreference } from '@/hooks/useAccountPreference';
import { DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings, type NotificationSettings } from '@/services/preferences';
import { setPushNotificationsEnabled } from '@/services/notifications';
import ErrorMessage from '@/components/ErrorMessage';
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
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { preference, setPreference } = useTheme();
  const toast = useToast();
  const showAlert = useAppAlert();
  const { t } = useTranslation();
  const {
    value: notificationSettings,
    save: saveNotificationSettings,
    loading: notificationSettingsLoading,
    saving: notificationSettingsSaving,
    error: notificationSettingsError,
    retry: retryNotificationSettings,
  } = useAccountPreference('notifications', DEFAULT_NOTIFICATION_SETTINGS, isNotificationSettings);
  const [settings, setSettings] = useState({
    currency: 'NPR (रु)',
    dateFormat: 'MM/DD/YYYY',
    language: 'en' as 'en' | 'ne',
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePushNotifications = async (enabled: boolean) => {
    const next = { ...notificationSettings, pushNotifications: enabled };
    if (!await saveNotificationSettings(next)) return;
    try {
      await setPushNotificationsEnabled(enabled);
    } catch (error) {
      console.error('Failed to update push notification setting:', error);
      await saveNotificationSettings(notificationSettings);
      toast.error(t('settings.pushNotificationsFailed'));
    }
  };

  const updateWeeklyDigest = (enabled: boolean) => {
    void saveNotificationSettings({ ...notificationSettings, weeklyDigest: enabled });
  };

  const handleCurrencyChange = () => {
    showAlert(
      t('settings.currency'),
      t('settings.currencyPrompt'),
      [
        { text: 'NPR (रु)', onPress: () => updateSetting('currency', 'NPR (रु)') },
        { text: 'USD ($)', onPress: () => updateSetting('currency', 'USD ($)') },
        { text: 'EUR (€)', onPress: () => updateSetting('currency', 'EUR (€)') },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleDateFormatChange = () => {
    showAlert(
      t('settings.dateFormat'),
      t('settings.dateFormatPrompt'),
      [
        { text: 'YYYY-MM-DD', onPress: () => updateSetting('dateFormat', 'YYYY-MM-DD') },
        { text: 'DD/MM/YYYY', onPress: () => updateSetting('dateFormat', 'DD/MM/YYYY') },
        { text: 'MM/DD/YYYY', onPress: () => updateSetting('dateFormat', 'MM/DD/YYYY') },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleLanguageChange = () => {
    showAlert(
      t('settings.language'),
      t('settings.languagePrompt'),
      [
        {
          text: t('settings.english'),
          onPress: () => {
            updateSetting('language', 'en');
            void setLanguage('en');
          },
        },
        {
          text: t('settings.nepali'),
          onPress: () => {
            updateSetting('language', 'ne');
            void setLanguage('ne');
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleExportData = () => {
    showAlert(
      t('settings.exportData'),
      t('settings.exportPrompt'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.export'), onPress: () => toast.success(t('settings.exportSuccess')) },
      ]
    );
  };

  const handleClearCache = () => {
    showAlert(
      t('settings.clearCache'),
      t('settings.clearCachePrompt'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.clear'), onPress: () => toast.success(t('settings.clearSuccess')) },
      ]
    );
  };

  const handleResetSettings = () => {
    showAlert(
      t('settings.resetSettings'),
      t('settings.resetPrompt'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.reset'),
          style: 'destructive',
          onPress: async () => {
            if (!await setPreference('system')) return;
            const resetNotificationSettings: NotificationSettings = {
              ...notificationSettings,
              pushNotifications: true,
              weeklyDigest: DEFAULT_NOTIFICATION_SETTINGS.weeklyDigest,
            };
            if (!await saveNotificationSettings(resetNotificationSettings)) return;
            try {
              await setPushNotificationsEnabled(true);
            } catch (error) {
              console.error('Failed to reset push notification setting:', error);
              await saveNotificationSettings(notificationSettings);
              toast.error(t('settings.pushNotificationsFailed'));
              return;
            }
            setSettings({
              currency: 'NPR (रु)',
              dateFormat: 'YYYY-MM-DD',
              language: 'en',
            });
            void setLanguage('en');
            toast.success(t('settings.resetSuccess'));
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
      {rightElement || <ChevronRight size={20} color={COLORS.textTertiary} />}
    </TouchableOpacity>
  );

  const renderSwitchItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void
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
        value={value}
        onValueChange={onValueChange}
        disabled={notificationSettingsLoading || notificationSettingsSaving}
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
         accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{t('settings.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('settings.about')}</Text>
          <Text style={styles.infoText}>
            {t('settings.aboutText')}
          </Text>
        </View>

        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.displayFormat')}</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <DollarSign size={20} color={COLORS.textTertiary} />,
              t('settings.currency'),
              settings.currency,
              handleCurrencyChange
            )}
            {renderSettingItem(
              <Calendar size={20} color={COLORS.textTertiary} />,
              t('settings.dateFormat'),
              settings.dateFormat,
              handleDateFormatChange
            )}
            {renderSettingItem(
              <Globe size={20} color={COLORS.textTertiary} />,
              t('settings.language'),
              settings.language === 'ne' ? t('settings.nepali') : t('settings.english'),
              handleLanguageChange
            )}
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Palette size={20} color={COLORS.textTertiary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.theme')}</Text>
                <Text style={styles.settingSubtitle}>{t('settings.themePrompt')}</Text>
              </View>
            </View>
            <View style={styles.themeOptions} accessibilityRole="radiogroup">
              {(['system', 'light', 'dark'] as const).map((option: ThemePreference) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.themeOption, preference === option && styles.themeOptionSelected]}
                  onPress={() => { void setPreference(option); }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: preference === option }}
                >
                  <Text style={[styles.themeOptionText, preference === option && styles.themeOptionTextSelected]}>
                    {t(`settings.${option}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* App Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appBehavior')}</Text>
          {notificationSettingsError ? (
            <ErrorMessage message={notificationSettingsError} onRetry={retryNotificationSettings} />
          ) : <View style={styles.settingsGroup}>
            {renderSwitchItem(
              <Bell size={20} color={COLORS.textTertiary} />,
              t('settings.pushNotifications'),
              t('settings.pushNotificationsSubtitle'),
              notificationSettings.pushNotifications,
              updatePushNotifications
            )}
            {renderSwitchItem(
              <Calendar size={20} color={COLORS.textTertiary} />,
              t('settings.weeklyDigest'),
              t('settings.weeklyDigestSubtitle'),
              notificationSettings.weeklyDigest,
              updateWeeklyDigest
            )}
          </View>}
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dataManagement')}</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Download size={20} color={COLORS.textTertiary} />,
              t('settings.exportData'),
              t('settings.exportDataSubtitle'),
              handleExportData
            )}
            {renderSettingItem(
              <RefreshCw size={20} color={COLORS.textTertiary} />,
              t('settings.clearCache'),
              t('settings.clearCacheSubtitle'),
              handleClearCache
            )}
          </View>
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.advanced')}</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Trash2 size={20} color={COLORS.negative} />,
              t('settings.resetSettings'),
              t('settings.resetSettingsSubtitle'),
              handleResetSettings
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  themeOptions: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  themeOption: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  themeOptionSelected: {
    backgroundColor: COLORS.action,
    borderColor: COLORS.action,
  },
  themeOptionText: {
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  themeOptionTextSelected: {
    color: COLORS.actionText,
  },
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
    borderBottomColor: COLORS.surfaceSecondary,
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
  },
});