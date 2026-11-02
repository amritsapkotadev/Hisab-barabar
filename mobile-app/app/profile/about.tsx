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
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function AboutScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const handleOpenWebsite = () => {
    Linking.openURL('https://hisabbarabar.qzz.io');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://hisabbarabar.qzz.io/privacy-policy');
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://hisabbarabar.qzz.io/terms-of-service');
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:support@hisabbarabar.com');
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
      <ExternalLink size={16} color={COLORS.textTertiary} />
    </TouchableOpacity>
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
        <Text style={styles.title} numberOfLines={1}>About Hisab Barabar</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo and Info */}
        <View style={styles.appInfoSection}>
          <View style={styles.appLogo}>
            <Smartphone size={40} color={COLORS.text} />
          </View>
          <Text style={styles.appName}>Hisab Barabar</Text>
          <Text style={styles.appTagline}>Smart Expense Sharing for Nepal</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          
          <View style={styles.madeInNepal}>
            <Text style={styles.madeInNepalText}>Made with </Text>
            <Heart size={16} color={COLORS.negative} />
            <Text style={styles.madeInNepalText}> in Nepal</Text>
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            Hisab Barabar makes it easy for friends, families, and groups in Nepal to track and split shared expenses. 
            Whether you're planning a trip to Pokhara, sharing apartment rent in Kathmandu, or organizing a family event, 
            we help you keep track of who owes what, so money never comes between relationships.
          </Text>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresGrid}>
            {renderFeatureItem(
              <Users size={20} color={COLORS.text} />,
              'Group Management',
              'Create groups for different occasions and track expenses together'
            )}
            {renderFeatureItem(
              <Smartphone size={20} color={COLORS.text} />,
              'eSewa Integration',
              'Seamless integration with Nepal\'s leading digital wallet'
            )}
            {renderFeatureItem(
              <Shield size={20} color={COLORS.text} />,
              'Secure & Private',
              'Your financial data is encrypted and stored securely'
            )}
            {renderFeatureItem(
              <Star size={20} color={COLORS.text} />,
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
              <MapPin size={20} color={COLORS.text} />
              <Text style={styles.companyLocation}>Kathmandu, Nepal</Text>
            </View>
            <Text style={styles.companyDescription}>
              Hisab Barabar is developed by a team of passionate developers in Nepal who understand the local culture 
              of sharing expenses and the need for transparent financial tracking. We're committed to building 
              technology that serves the Nepali community.
            </Text>
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learn More</Text>
          <View style={styles.linksGroup}>
            {renderLinkItem(
              <Globe size={20} color={COLORS.textTertiary} />,
              'Visit Our Website',
              handleOpenWebsite
            )}
            {renderLinkItem(
              <Shield size={20} color={COLORS.textTertiary} />,
              'Privacy Policy',
              handleOpenPrivacy
            )}
            {renderLinkItem(
              <Shield size={20} color={COLORS.textTertiary} />,
              'Terms of Service',
              handleOpenTerms
            )}
            {renderLinkItem(
              <Mail size={20} color={COLORS.textTertiary} />,
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
              Built with React Native, Expo, and lots of chai
            </Text>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2026 Hisab Barabar. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Proudly serving the Nepali community
          </Text>
        </View>
      </ScrollView>
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
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 15,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  madeInNepal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.negative}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.negative}30`,
  },
  madeInNepalText: {
    fontSize: 13,
    color: COLORS.negative,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
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
  missionText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    textAlign: 'justify',
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  companyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLocation: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  companyDescription: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  linksGroup: {
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
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  linkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
  },
  creditsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  creditsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    textAlign: 'center',
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 24,
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
  },
});