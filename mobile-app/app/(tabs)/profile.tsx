import React, { useState, useEffect } from 'react';
import { useServerRefresh } from '@/hooks/useServerRefresh';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Users as UsersIcon, 
  Trash2,
  Lock,
  Edit2,
  PieChart,
  Settings,
  Download,
  Heart
} from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType } from '@/types';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function ProfileScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useServerRefresh(async () => { await fetchUserData(); });

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setUser(await apiService.getUserProfile());
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/edit');
  };

  const handleChangePassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/change-password');
  };

  const handleNotificationSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/notifications');
  };

  const handlePrivacySettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/privacy');
  };

  const handleHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/help');
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/profile/delete-account');
  };

  const handleShareApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: t('profile.shareMessage'),
        title: 'Hisab Barabar'
      });
    } catch (error) {
      console.error('Sharing failed', error);
    }
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    danger: boolean = false,
    badge?: string
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <ChevronRight size={20} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.action} />
          <Text style={styles.loadingText}>{t('profile.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Clean Header Section */}
        <Animated.View
          style={styles.headerSection}
          entering={FadeInDown.duration(280).delay(40).easing(Easing.out(Easing.cubic))}
        >
          <View style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={styles.userInfoContainer}>
                <View style={styles.avatarContainer}>
                  {user?.picture ? (
                    <Image
                      source={{ uri: user.picture }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <User size={28} color={COLORS.textSecondary} />
                    </View>
                  )}
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                    {user?.name || t('profile.defaultName')}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">
                    {user?.email || t('profile.defaultEmail')}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditProfile}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.editProfile')}
                >
                  <Edit2 size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Account Settings */}
        <Animated.View 
          style={styles.settingsSection}
          entering={FadeInDown.duration(280).delay(160).easing(Easing.out(Easing.cubic))}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
          </View>
          <View style={styles.settingsCard}>
            {renderSettingItem(
              <User size={20} color={COLORS.textSecondary} />,
              t('profile.editProfile'),
              t('profile.editProfileSubtitle'),
              handleEditProfile
            )}
            
            {renderSettingItem(
              <Lock size={20} color={COLORS.textSecondary} />,
              t('profile.changePassword'),
              t('profile.changePasswordSubtitle'),
              handleChangePassword
            )}
          </View>
        </Animated.View>

        {/* Preferences */}
        <Animated.View 
          style={styles.settingsSection}
          entering={FadeInDown.duration(280).delay(220).easing(Easing.out(Easing.cubic))}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.preferences')}</Text>
          </View>
          <View style={styles.settingsCard}>
            {renderSettingItem(
              <Settings size={20} color={COLORS.textSecondary} />,
              t('settings.title'),
              t('settings.themePrompt'),
              () => router.push('/profile/settings')
            )}
            {renderSettingItem(
              <Download size={20} color={COLORS.textSecondary} />,
              t('profile.offlineSync'),
              t('profile.offlineSyncSubtitle'),
              () => router.push('/profile/offline-sync')
            )}
            {renderSettingItem(
              <Bell size={20} color={COLORS.textSecondary} />,
              t('profile.notifications'),
              t('profile.notificationsSubtitle'),
              handleNotificationSettings
            )}
            
            {renderSettingItem(
              <Shield size={20} color={COLORS.textSecondary} />,
              t('profile.privacy'),
              t('profile.privacySubtitle'),
              handlePrivacySettings
            )}
          </View>
        </Animated.View>

        {/* Support */}
        <Animated.View 
          style={styles.settingsSection}
          entering={FadeInDown.duration(280).delay(280).easing(Easing.out(Easing.cubic))}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.support')}</Text>
          </View>
          <View style={styles.settingsCard}>
            {renderSettingItem(
              <HelpCircle size={20} color={COLORS.textSecondary} />,
              t('profile.helpCenter'),
              t('profile.helpCenterSubtitle'),
              handleHelp
            )}
            
            {renderSettingItem(
              <UsersIcon size={20} color={COLORS.textSecondary} />,
              t('profile.shareApp'),
              t('profile.shareAppSubtitle'),
              handleShareApp
            )}
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View 
          style={styles.settingsSection}
          entering={FadeInDown.duration(280).delay(340).easing(Easing.out(Easing.cubic))}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>{t('profile.account')}</Text>
          </View>
          <View style={styles.settingsCard}>
            {renderSettingItem(
              <Trash2 size={20} color={COLORS.danger} />,
              t('profile.deleteAccount'),
              t('profile.deleteAccountSubtitle'),
              handleDeleteAccount,
              true
            )}
            
            {renderSettingItem(
              <LogOut size={20} color={COLORS.danger} />,
              t('profile.logout'),
              t('profile.logoutSubtitle'),
              handleLogout,
              true
            )}
          </View>
        </Animated.View>

        {/* App Footer */}
        <Animated.View 
          style={styles.appFooter}
          entering={FadeInDown.duration(280).delay(400).easing(Easing.out(Easing.cubic))}
        >
          <View style={styles.appLogo}>
            <PieChart size={28} color={COLORS.text} />
            <Text style={styles.appName}>Hisab Barabar</Text>
          </View>
          <Text style={styles.appVersion}>v1.0.0</Text>
          <View style={styles.appFooterContent}>
            <Heart size={14} color={COLORS.negative} />
            <Text style={styles.appFooterText}>{t('profile.madeWithLove')}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  headerCard: {
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
    overflow: 'hidden',
  },
  headerContent: {
    padding: 20,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsSection: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  settingsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dangerIcon: {
    backgroundColor: `${COLORS.negative}10`,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
  },
  dangerText: {
    color: COLORS.danger,
  },
  badge: {
    backgroundColor: COLORS.action,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.actionText,
    fontFamily: 'Inter-Bold',
  },
  appFooter: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  appLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  appVersion: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  appFooterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appFooterText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Medium',
  },
});