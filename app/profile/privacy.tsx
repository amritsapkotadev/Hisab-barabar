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

export default function PrivacyScreen() {
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
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Shield size={48} color="#2563eb" />
          <Text style={styles.introTitle}>Your Privacy Matters</Text>
          <Text style={styles.introText}>
            We're committed to protecting your personal information and being transparent 
            about how we collect, use, and share your data.
          </Text>
        </View>

        {renderSection(
          <Database size={24} color="#059669" />,
          'Data Collection',
          'We only collect information necessary to provide our services: your name, email, and expense data you choose to share. We never access your device contacts, photos, or other personal files without explicit permission.'
        )}

        {renderSection(
          <Lock size={24} color="#dc2626" />,
          'Data Security',
          'Your data is encrypted both in transit and at rest using industry-standard encryption. We use secure servers and follow best practices to protect against unauthorized access, alteration, or destruction of your information.'
        )}

        {renderSection(
          <Eye size={24} color="#7c3aed" />,
          'Data Usage',
          'We use your information solely to provide SplitWise services. We analyze usage patterns to improve our app, but this is done with anonymized data. We never sell your personal information to third parties.'
        )}

        {renderSection(
          <Users size={24} color="#ea580c" />,
          'Data Sharing',
          'Your expense data is only shared with group members you explicitly add. We may share anonymized, aggregated data for research purposes, but this never includes personally identifiable information.'
        )}

        {renderSection(
          <Globe size={24} color="#0891b2" />,
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
            your rights, please contact us at ------------ the email willcome here ------------ 
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
  introSection: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  rightsContainer: {
    gap: 12,
  },
  rightItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  rightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  rightDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  contactSection: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  updateSection: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  updateText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});