import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
  Dimensions
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
  DollarSign, 
  Users as UsersIcon, 
  FileText, 
  Download, 
  Share2,
  Trash2,
  Lock,
  CreditCard,
  BarChart2,
  Calendar,
  Heart,
  Award,
  PieChart,
  Edit2,
  Settings,
  Crown,
  TrendingUp,
  Zap,
  Star,
  Activity,
  Target
} from 'lucide-react-native';
import { apiService } from '@/services/api';
import { User as UserType } from '@/types';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Premium Design System
const COLORS = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  secondary: '#EC4899',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: 'rgba(0, 0, 0, 0.08)',
  glass: 'rgba(255, 255, 255, 0.95)',
  gradient1: ['#7C3AED', '#A78BFA'],
  gradient2: ['#EC4899', '#F472B6'],
  gradient3: ['#06B6D4', '#22D3EE'],
  gradient4: ['#10B981', '#34D399'],
  gradient5: ['#F59E0B', '#FBBF24'],
  gradient6: ['#8B5CF6', '#A78BFA'],
};

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalExpenses: 0,
    totalTransactions: 0,
    monthlySpending: 0,
    averageExpense: 0,
    mostActiveGroup: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userProfile, groups, expenses] = await Promise.all([
        apiService.getUserProfile(),
        apiService.getGroups(),
        apiService.getAllExpenses(),
      ]);

      setUser(userProfile);
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.createdAt);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      });
      
      const monthlySpending = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
      
      const groupExpenseCounts = groups.map(group => ({
        name: group.name,
        count: expenses.filter(expense => expense.groupId === group.id).length
      }));
      const mostActiveGroup = groupExpenseCounts.reduce((prev, current) => 
        prev.count > current.count ? prev : current, { name: 'None', count: 0 }
      );

      setStats({
        totalGroups: groups.length,
        totalExpenses,
        totalTransactions: expenses.length,
        monthlySpending,
        averageExpense,
        mostActiveGroup: mostActiveGroup.name,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    apiService.clearAuthToken();
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

  const handleExportData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/export-data');
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/profile/delete-account');
  };

  const handleShareApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: 'Check out SplitSaathi - the best app for splitting expenses with friends!',
        title: 'Share SplitSaathi'
      });
    } catch (error) {
      console.error('Sharing failed', error);
    }
  };

  const renderStatCard = (icon: React.ReactNode, label: string, value: string | number, gradient: string[], color: string) => (
    <Animated.View 
      style={styles.statCard}
      entering={FadeInUp.duration(800).delay(200)}
    >
      <LinearGradient
        colors={gradient}
        style={styles.statCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statIconContainer}>
          {icon}
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );

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
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
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
        {/* Premium Header */}
        <Animated.View 
          style={styles.headerSection}
          entering={FadeIn.duration(600)}
        >
          <LinearGradient
            colors={COLORS.gradient1}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
                  <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={handleEditProfile}
                >
                  <Edit2 size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.headerStats}>
                <View style={styles.headerStatItem}>
                  <UsersIcon size={16} color="#fff" />
                  <Text style={styles.headerStatText}>{stats.totalGroups} Groups</Text>
                </View>
                <View style={styles.headerStatItem}>
                  <DollarSign size={16} color="#fff" />
                  <Text style={styles.headerStatText}>₹{stats.totalExpenses.toFixed(0)} Total</Text>
                </View>
                <View style={styles.headerStatItem}>
                  <Activity size={16} color="#fff" />
                  <Text style={styles.headerStatText}>{stats.totalTransactions} Transactions</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Premium Stats Grid */}
        <Animated.View 
          style={styles.statsContainer}
          entering={FadeInDown.duration(800).delay(300)}
        >
          <View style={styles.statsGrid}>
            {renderStatCard(
              <DollarSign size={20} color="#fff" />,
              'Total Spent',
              `₹${stats.totalExpenses.toFixed(0)}`,
              COLORS.gradient1,
              COLORS.primary
            )}
            
            {renderStatCard(
              <UsersIcon size={20} color="#fff" />,
              'Groups',
              stats.totalGroups,
              COLORS.gradient2,
              COLORS.secondary
            )}
            
            {renderStatCard(
              <FileText size={20} color="#fff" />,
              'Transactions',
              stats.totalTransactions,
              COLORS.gradient3,
              COLORS.accent
            )}
            
            {renderStatCard(
              <Calendar size={20} color="#fff" />,
              'This Month',
              `₹${stats.monthlySpending.toFixed(0)}`,
              COLORS.gradient4,
              COLORS.success
            )}
          </View>
        </Animated.View>

        {/* Premium Insights */}
        <Animated.View 
          style={styles.insightsSection}
          entering={FadeInUp.duration(800).delay(400)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <View style={styles.sectionBadge}>
              <Star size={14} color={COLORS.warning} />
              <Text style={styles.sectionBadgeText}>Premium</Text>
            </View>
          </View>
          
          <View style={styles.insightsCard}>
            <View style={styles.insightItem}>
              <View style={styles.insightIcon}>
                <BarChart2 size={20} color={COLORS.primary} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Average Expense</Text>
                <Text style={styles.insightValue}>₹{stats.averageExpense.toFixed(2)}</Text>
              </View>
              <View style={styles.insightTrend}>
                <TrendingUp size={16} color={COLORS.success} />
              </View>
            </View>
            
            <View style={styles.insightItem}>
              <View style={styles.insightIcon}>
                <Crown size={20} color={COLORS.warning} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Most Active Group</Text>
                <Text style={styles.insightValue}>{stats.mostActiveGroup}</Text>
              </View>
              <View style={styles.insightTrend}>
                <Target size={16} color={COLORS.accent} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Premium Settings */}
        <Animated.View 
          style={styles.settingsSection}
          entering={SlideInRight.duration(800).delay(500)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <View style={styles.settingsCard}>
            {renderSettingItem(
              <User size={20} color={COLORS.primary} />,
              "Edit Profile",
              "Update your personal information",
              handleEditProfile,
              false,
              "New"
            )}
            
            {renderSettingItem(
              <Lock size={20} color={COLORS.primary} />,
              "Change Password",
              "Update your password",
              handleChangePassword
            )}
            
            {renderSettingItem(
              <CreditCard size={20} color={COLORS.primary} />,
              "Payment Methods",
              "Manage your payment options",
              () => router.push('/profile/payment-methods')
            )}
          </View>
        </Animated.View>

        <Animated.View 
          style={styles.settingsSection}
          entering={SlideInRight.duration(800).delay(600)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          <View style={styles.settingsCard}>
            {renderSettingItem(
              <Bell size={20} color={COLORS.primary} />,
              "Notifications",
              "Manage your notifications",
              handleNotificationSettings
            )}
            
            {renderSettingItem(
              <Shield size={20} color={COLORS.primary} />,
              "Privacy",
              "Control your privacy settings",
              handlePrivacySettings
            )}
          </View>
        </Animated.View>

        <Animated.View 
          style={styles.settingsSection}
          entering={SlideInRight.duration(800).delay(700)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support</Text>
          </View>
          <View style={styles.settingsCard}>
            {renderSettingItem(
              <HelpCircle size={20} color={COLORS.primary} />,
              "Help Center",
              "Get help and support",
              handleHelp
            )}
            
            {renderSettingItem(
              <Download size={20} color={COLORS.primary} />,
              "Export Data",
              "Download your data",
              handleExportData
            )}
            
            {renderSettingItem(
              <Share2 size={20} color={COLORS.primary} />,
              "Share App",
              "Share with friends",
              handleShareApp
            )}
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View 
          style={styles.settingsSection}
          entering={SlideInRight.duration(800).delay(800)}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>Account</Text>
          </View>
          <View style={styles.settingsCard}>
            {renderSettingItem(
              <Trash2 size={20} color={COLORS.danger} />,
              "Delete Account",
              "Permanently delete your account",
              handleDeleteAccount,
              true
            )}
            
            {renderSettingItem(
              <LogOut size={20} color={COLORS.danger} />,
              "Logout",
              "Sign out of your account",
              handleLogout,
              true
            )}
          </View>
        </Animated.View>

        {/* Premium App Footer */}
        <Animated.View 
          style={styles.appFooter}
          entering={FadeInUp.duration(800).delay(900)}
        >
          <View style={styles.appLogo}>
            <PieChart size={28} color={COLORS.primary} />
            <Text style={styles.appName}>SplitSaathi</Text>
          </View>
          <Text style={styles.appVersion}>v1.0.0</Text>
          <View style={styles.appFooterContent}>
            <Heart size={14} color="#F87171" />
            <Text style={styles.appFooterText}>Made with love in Nepal</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 24,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 28,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  headerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerStatText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 64) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'flex-start',
    minHeight: 120,
  },
  statIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-Medium',
  },
  insightsSection: {
    paddingHorizontal: 20,
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
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 12,
    color: COLORS.warning,
    fontFamily: 'Inter-SemiBold',
  },
  insightsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  insightTrend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dangerIcon: {
    backgroundColor: '#FEE2E2',
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  appFooter: {
    alignItems: 'center',
    paddingHorizontal: 20,
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
    color: COLORS.primary,
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