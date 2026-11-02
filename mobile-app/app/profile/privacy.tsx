import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Globe } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function PrivacyScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const renderSection = (icon: React.ReactNode, title: string, content: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          {icon}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionContent}>{content}</Text>
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
        <Text style={styles.title} numberOfLines={1}>Privacy & Security</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Shield size={48} color={COLORS.text} />
          <Text style={styles.introTitle}>Your Privacy Matters</Text>
          <Text style={styles.introText}>
            We're committed to protecting your personal information and being transparent 
            about how we collect, use, and share your data.
          </Text>
        </View>

        {renderSection(
          <Database size={24} color={COLORS.text} />,
          'Data Collection',
          'We only collect information necessary to provide our services: your name, email, and expense data you choose to share. We never access your device contacts, photos, or other personal files without explicit permission.'
        )}

        {renderSection(
          <Lock size={24} color={COLORS.text} />,
          'Data Security',
          'Your data is encrypted both in transit and at rest using industry-standard encryption. We use secure servers and follow best practices to protect against unauthorized access, alteration, or destruction of your information.'
        )}

        {renderSection(
          <Eye size={24} color={COLORS.text} />,
          'Data Usage',
          'We use your information solely to provide Hisab Barabar services. We analyze usage patterns to improve our app, but this is done with anonymized data. We never sell your personal information to third parties.'
        )}

        {renderSection(
          <Users size={24} color={COLORS.text} />,
          'Data Sharing',
          'Your expense data is only shared with group members you explicitly add. We may share anonymized, aggregated data for research purposes, but this never includes personally identifiable information.'
        )}

        {renderSection(
          <Globe size={24} color={COLORS.text} />,
          'Third-Party Services',
          'We use trusted third-party services for analytics and crash reporting to improve our app. These services are bound by strict privacy agreements and cannot access your personal expense data.'
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <View style={styles.rightsContainer}>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>Access</Text>
              <Text style={styles.rightDescription}>
                Request a copy of all data we have about you
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>Correction</Text>
              <Text style={styles.rightDescription}>
                Update or correct any inaccurate information
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>Deletion</Text>
              <Text style={styles.rightDescription}>
                Request deletion of your account and all associated data
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>Portability</Text>
              <Text style={styles.rightDescription}>
                Export your data in a machine-readable format
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions About Privacy?</Text>
          <Text style={styles.contactText}>
            If you have any questions about our privacy practices or want to exercise
            your rights, please contact us at support@hisabbarabar.com
          </Text>
        </View>

        <View style={styles.updateSection}>
          <Text style={styles.updateTitle}>Policy Updates</Text>
          <Text style={styles.updateText}>
            We may update this privacy policy from time to time. We'll notify you of 
            any significant changes through the app or via email.
          </Text>
          <Text style={styles.lastUpdated}>Last updated: June 2025</Text>
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
  introSection: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  rightsContainer: {
    gap: 12,
  },
  rightItem: {
    backgroundColor: COLORS.surfaceSecondary,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.action,
  },
  rightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  rightDescription: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  contactSection: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  updateSection: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  updateText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
});