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
  Heart
} from 'lucide-react-native';
import { apiService } from '@/services/api';
import { User as UserType } from '@/types';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

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
      style={[styles.statCard, { backgroundColor: color }]}
      entering={FadeInDown.duration(600)}
    >
      <View style={styles.statIconContainer}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
          trackColor={{ false: '#e2e8f0', true: '#4f46e5' }}
          thumbColor="#ffffff"
          style={styles.switch}
        />
      ) : (
        <ChevronRight size={20} color="#94a3b8" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
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
          colors={['#818cf8', '#6366f1']}
          style={styles.profileHeader}
        >
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
        </LinearGradient>

        {/* Stats Section */}
        <Animated.View 
          style={styles.statsContainer}
          entering={FadeIn.duration(500)}
        >
          <View style={styles.statsGrid}>
            {renderStatCard(
              <DollarSign size={20} color="#fff" />,
              'Total Spent',
              `$${stats.totalExpenses.toFixed(0)}`,
              '#4f46e5'
            )}
            
            {renderStatCard(
              <UsersIcon size={20} color="#fff" />,
              'Groups',
              stats.totalGroups,
              '#8b5cf6'
            )}
            
            {renderStatCard(
              <FileText size={20} color="#fff" />,
              'Transactions',
              stats.totalTransactions,
              '#ec4899'
            )}
            
            {renderStatCard(
              <Calendar size={20} color="#fff" />,
              'This Month',
              `$${stats.monthlySpending.toFixed(0)}`,
              '#f59e0b'
            )}
          </View>
          
          <View style={styles.statsFooter}>
            <View style={styles.statsFooterItem}>
              <BarChart2 size={16} color="#94a3b8" />
              <Text style={styles.statsFooterText}>
                Avg: ${stats.averageExpense.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statsFooterItem}>
              <Star size={16} color="#94a3b8" />
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
              <User size={20} color="#6366f1" />,
              "Edit Profile",
              handleEditProfile
            )}
            
            {renderSettingItem(
              <Lock size={20} color="#6366f1" />,
              "Change Password",
              handleChangePassword
            )}
            
            {renderSettingItem(
              <CreditCard size={20} color="#6366f1" />,
              "Payment Methods"
            )}
          </BlurView>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <BlurView intensity={30} tint="light" style={styles.settingsCard}>
            {renderSettingItem(
              <Bell size={20} color="#6366f1" />,
              "Notifications",
              () => setNotificationsEnabled(!notificationsEnabled),
              true,
              notificationsEnabled
            )}
            
            {renderSettingItem(
              <Moon size={20} color="#6366f1" />,
              "Dark Mode",
              () => setDarkModeEnabled(!darkModeEnabled),
              true,
              darkModeEnabled
            )}
            
            {renderSettingItem(
              <Shield size={20} color="#6366f1" />,
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
              <HelpCircle size={20} color="#6366f1" />,
              "Help Center",
              handleHelp
            )}
            
            {renderSettingItem(
              <Download size={20} color="#6366f1" />,
              "Export Data",
              handleExportData
            )}
            
            {renderSettingItem(
              <Share2 size={20} color="#6366f1" />,
              "Share App",
              handleShareApp
            )}
          </BlurView>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <BlurView intensity={30} tint="light" style={styles.settingsCard}>
            {renderSettingItem(
              <Trash2 size={20} color="#ef4444" />,
              "Delete Account",
              handleDeleteAccount,
              false,
              false,
              true
            )}
            
            {renderSettingItem(
              <LogOut size={20} color="#ef4444" />,
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
          <Text style={styles.appName}>SplitSaathi</Text>
          <Text style={styles.appVersion}>v1.0.0</Text>
          <Text style={styles.appFooter}>Made with ❤️ in Nepal</Text>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Inter-Medium',
  },
  profileHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
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
  },
  userEmail: {
    fontSize: 16,
    color: '#e0e7ff',
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    marginTop: -24,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: (width - 80) / 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  statIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 36,
    height: 36,
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statsFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsFooterText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Inter-Medium',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  settingsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingIcon: {
    width: 36,
    height: 36,
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
    color: '#334155',
    fontFamily: 'Inter-Medium',
  },
  dangerText: {
    color: '#ef4444',
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  appVersion: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  appFooter: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter-Medium',
  },
});