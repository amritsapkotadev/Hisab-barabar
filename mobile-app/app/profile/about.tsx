import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Heart, 
  Globe, 
  Mail, 
  MapPin,
  Users,
  Star,
  Shield,
  Smartphone,
  ExternalLink
} from 'lucide-react-native';

export default function AboutScreen() {
  const handleOpenWebsite = () => {
    Linking.openURL('https://hisabkitab.com');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://hisabkitab.com/privacy');
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://hisabkitab.com/terms');
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:hello@hisabkitab.com');
  };

  const renderFeatureItem = (icon: React.ReactNode, title: string, description: string) => (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        {icon}
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );

  const renderLinkItem = (icon: React.ReactNode, title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.linkItem} onPress={onPress}>
      <View style={styles.linkIcon}>
        {icon}
      </View>
      <Text style={styles.linkTitle}>{title}</Text>
      <ExternalLink size={16} color="#9ca3af" />
    </TouchableOpacity>
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
        <Text style={styles.title}>About Hisab Kitab</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo and Info */}
        <View style={styles.appInfoSection}>
          <View style={styles.appLogo}>
            <Smartphone size={40} color="#2563eb" />
          </View>
          <Text style={styles.appName}>Hisab Kitab</Text>
          <Text style={styles.appTagline}>Smart Expense Sharing for Nepal</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          
          <View style={styles.madeInNepal}>
            <Text style={styles.madeInNepalText}>Made with </Text>
            <Heart size={16} color="#dc2626" />
            <Text style={styles.madeInNepalText}> in Nepal 🇳🇵</Text>
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            Hisab Kitab makes it easy for friends, families, and groups in Nepal to track and split shared expenses. 
            Whether you're planning a trip to Pokhara, sharing apartment rent in Kathmandu, or organizing a family event, 
            we help you keep track of who owes what, so money never comes between relationships.
          </Text>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresGrid}>
            {renderFeatureItem(
              <Users size={20} color="#2563eb" />,
              'Group Management',
              'Create groups for different occasions and track expenses together'
            )}
            {renderFeatureItem(
              <Smartphone size={20} color="#059669" />,
              'eSewa Integration',
              'Seamless integration with Nepal\'s leading digital wallet'
            )}
            {renderFeatureItem(
              <Shield size={20} color="#7c3aed" />,
              'Secure & Private',
              'Your financial data is encrypted and stored securely'
            )}
            {renderFeatureItem(
              <Star size={20} color="#ea580c" />,
              'Smart Splitting',
              'Automatically calculate fair splits and track balances'
            )}
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Company</Text>
          <View style={styles.companyCard}>
            <View style={styles.companyHeader}>
              <MapPin size={20} color="#2563eb" />
              <Text style={styles.companyLocation}>Kathmandu, Nepal</Text>
            </View>
            <Text style={styles.companyDescription}>
              Hisab Kitab is developed by a team of passionate developers in Nepal who understand the local culture 
              of sharing expenses and the need for transparent financial tracking. We're committed to building 
              technology that serves the Nepali community.
            </Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impact</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>1000+</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>5000+</Text>
              <Text style={styles.statLabel}>Expenses Tracked</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₹50L+</Text>
              <Text style={styles.statLabel}>Money Managed</Text>
            </View>
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learn More</Text>
          <View style={styles.linksGroup}>
            {renderLinkItem(
              <Globe size={20} color="#6b7280" />,
              'Visit Our Website',
              handleOpenWebsite
            )}
            {renderLinkItem(
              <Shield size={20} color="#6b7280" />,
              'Privacy Policy',
              handleOpenPrivacy
            )}
            {renderLinkItem(
              <Shield size={20} color="#6b7280" />,
              'Terms of Service',
              handleOpenTerms
            )}
            {renderLinkItem(
              <Mail size={20} color="#6b7280" />,
              'Contact Us',
              handleContactUs
            )}
          </View>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credits</Text>
          <View style={styles.creditsCard}>
            <Text style={styles.creditsText}>
              Special thanks to the open-source community and all the libraries that made this app possible. 
              Built with React Native, Expo, and lots of chai ☕
            </Text>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2024 Hisab Kitab. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Proudly serving the Nepali community
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
  appInfoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  madeInNepal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  madeInNepalText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
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
  missionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    textAlign: 'justify',
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  companyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
  },
  companyDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  linksGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  linkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  creditsCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  creditsText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
    textAlign: 'center',
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 24,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 10,
    color: '#d1d5db',
  },
});