import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
  ActivityIndicator,
  Share,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Mail, 
  Edit2,
  DollarSign, 
  Users as UsersIcon, 
  FileText, 
  Star, 
  Moon, 
  Download, 
  Share2,
  Trash2,
  Lock,
  CreditCard,
  BarChart2,
  Calendar,
  Smartphone,
  Heart,
  Award,
  PieChart
} from 'lucide-react-native';
import { apiService } from '@/services/api';
import { User as UserType } from '@/types';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Modern color palette
const COLORS = {
  primary: '#6366f1',
  secondary: '#818cf8',
  background: '#F5F7FB',
  card: '#FFFFFF',
  text: '#1E293B',
  subtext: '#64748B',
  positive: '#10B981',
  negative: '#EF4444',
  border: '#E2E8F0',
  gradientStart: '#F0F9FF',
  gradientEnd: '#E0F2FE',
  stats1: '#4f46e5',
  stats2: '#8b5cf6',
  stats3: '#ec4899',
  stats4: '#f59e0b',
};

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
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
      
      // Find most active group
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

  const handleAbout = () => {
    router.push('/profile/about');
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

  const renderStatCard = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
    <Animated.View 
      style={[styles.statCard]}
      entering={FadeInDown.duration(600)}
    >
      <LinearGradient
        colors={[color, `${color}80`]}
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
    onPress?: () => void,
    isSwitch: boolean = false,
    switchValue: boolean = false,
    danger: boolean = false
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
        {icon}
      </View>
      <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
      
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={isSwitch ? onPress : undefined}
          trackColor={{ false: '#e2e8f0', true: COLORS.primary }}
          thumbColor="#ffffff"
          style={styles.switch}
        />
      ) : (
        <ChevronRight size={20} color={COLORS.subtext} />
      )}
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
        {/* Profile Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.profileHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileHeaderContent}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Edit2 size={18} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: user?.picture || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.avatar}
              />
            </View>
            
            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            
            <View style={styles.statsSummary}>
              <View style={styles.statSummaryItem}>
                <UsersIcon size={18} color="#fff" />
                <Text style={styles.statSummaryText}>{stats.totalGroups} groups</Text>
              </View>
              <View style={styles.statSummaryItem}>
                <DollarSign size={18} color="#fff" />
                <Text style={styles.statSummaryText}>₹{stats.totalExpenses.toFixed(0)} spent</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <Animated.View 
          style={styles.statsContainer}
          entering={FadeIn.duration(500)}
        >
          <Text style={styles.statsTitle}>Your Spending Insights</Text>
          
          <View style={styles.statsGrid}>
            {renderStatCard(
              <DollarSign size={20} color="#fff" />,
              'Total Spent',
              `₹${stats.totalExpenses.toFixed(0)}`,
              COLORS.stats1
            )}
            
            {renderStatCard(
              <UsersIcon size={20} color="#fff" />,
              'Groups',
              stats.totalGroups,
              COLORS.stats2
            )}
            
            {renderStatCard(
              <FileText size={20} color="#fff" />,
              'Transactions',
              stats.totalTransactions,
              COLORS.stats3
            )}
            
            {renderStatCard(
              <Calendar size={20} color="#fff" />,
              'This Month',
              `₹${stats.monthlySpending.toFixed(0)}`,
              COLORS.stats4
            )}
          </View>
          
          <View style={styles.statsFooter}>
            <View style={styles.statsFooterItem}>
              <BarChart2 size={16} color={COLORS.subtext} />
              <Text style={styles.statsFooterText}>
                Avg: ₹{stats.averageExpense.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statsFooterItem}>
              <Award size={16} color={COLORS.subtext} />
              <Text style={styles.statsFooterText}>
                Most Active: {stats.mostActiveGroup}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <BlurView intensity={30} tint="light" style={styles.settingsCard}>
            {renderSettingItem(
              <User size={20} color={COLORS.primary} />,
              "Edit Profile",
              handleEditProfile
            )}
            
            {renderSettingItem(
              <Lock size={20} color={COLORS.primary} />,
              "Change Password",
              handleChangePassword
            )}
            
            {renderSettingItem(
              <CreditCard size={20} color={COLORS.primary} />,
              "Payment Methods",
              () => router.push('/profile/payment-methods')
            )}
          </BlurView>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <BlurView intensity={30} tint="light" style={styles.settingsCard}>
            {renderSettingItem(
              <Bell size={20} color={COLORS.primary} />,
              "Notifications",
              handleNotificationSettings
            )}
            
            {renderSettingItem(
              <Moon size={20} color={COLORS.primary} />,
              "Dark Mode",
              () => setDarkModeEnabled(!darkModeEnabled),
              true,
              darkModeEnabled
            )}
            
            {renderSettingItem(
              <Shield size={20} color={COLORS.primary} />,
              "Privacy",
              handlePrivacySettings
            )}
          </BlurView>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <BlurView intensity={30} tint="light" style={styles.settingsCard}>
            {renderSettingItem(
              <HelpCircle size={20} color={COLORS.primary} />,
              "Help Center",
              handleHelp
            )}
            
            {renderSettingItem(
              <Download size={20} color={COLORS.primary} />,
              "Export Data",
              handleExportData
            )}
            
            {renderSettingItem(
              <Share2 size={20} color={COLORS.primary} />,
              "Share App",
              handleShareApp
            )}
          </BlurView>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.negative }]}>Account</Text>
          
          <BlurView intensity={30} tint="light" style={styles.settingsCard}>
            {renderSettingItem(
              <Trash2 size={20} color={COLORS.negative} />,
              "Delete Account",
              handleDeleteAccount,
              false,
              false,
              true
            )}
            
            {renderSettingItem(
              <LogOut size={20} color={COLORS.negative} />,
              "Logout",
              handleLogout,
              false,
              false,
              true
            )}
          </BlurView>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={styles.appLogo}>
            <PieChart size={32} color={COLORS.primary} />
            <Text style={styles.appName}>SplitSaathi</Text>
          </View>
          <Text style={styles.appVersion}>v1.0.0</Text>
          <View style={styles.appFooter}>
            <Heart size={16} color="#f87171" />
            <Text style={styles.appFooterText}>Made with passion in Nepal</Text>
          </View>
        </View>
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
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
  },
  profileHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileHeaderContent: {
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#e0e7ff',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  statsSummary: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
  },
  statSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statSummaryText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  statsContainer: {
    marginTop: -24,
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 80) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardGradient: {
    padding: 16,
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
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  statsFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsFooterText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
    paddingLeft: 8,
  },
  settingsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dangerIcon: {
    backgroundColor: '#fee2e2',
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
  },
  dangerText: {
    color: COLORS.negative,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
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
    color: COLORS.subtext,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  appFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appFooterText: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
  },
});