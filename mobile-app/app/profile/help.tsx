import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/components/Toast';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  CircleHelp as HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronRight,
  Book,
  Video,
  Users,
  Bug
} from 'lucide-react-native';

export default function HelpScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I create a new group in Hisab Barabar?',
      answer: 'Tap the "+" button on the Groups tab or use the "New Group" quick action on the home screen. Enter a group name, description, and add members to start tracking shared expenses.'
    },
    {
      question: 'How are expenses split in Hisab Barabar?',
      answer: 'By default, expenses are split equally among all participants. You can select which group members participated in each expense when adding it. The app automatically calculates each person\'s share.'
    },
    {
      question: 'How do I settle up with someone?',
      answer: 'Go to the group where you owe money, check the balances section. You can use eSewa or other payment methods to settle. Then mark it as settled in the app.'
    },
    {
      question: 'Can I edit or delete expenses?',
      answer: 'Currently, expenses cannot be edited or deleted once created. This feature will be available in a future update to maintain transaction integrity.'
    },
    {
      question: 'How do I export my transaction data?',
      answer: 'Go to your Profile > Export Data to download all your transactions as a CSV file. This includes all expenses, payments, and group details.'
    },
    {
      question: 'What payment methods are supported?',
      answer: 'Hisab Barabar supports eSewa for digital payments in Nepal, along with cash settlements. More payment methods will be added in future updates.'
    },
    {
      question: 'How do I leave a group?',
      answer: 'You can leave a group by going to the group settings. Make sure all balances are settled before leaving to avoid confusion.'
    },
    {
      question: 'Is my data secure in Hisab Barabar?',
      answer: 'Yes, we use industry-standard encryption to protect your data. Your financial information is securely stored and never shared with third parties.'
    }
  ];

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you\'d like to contact us:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => Linking.openURL('mailto:support@hisabbarabar.com') },
        { text: 'Phone', onPress: () => Linking.openURL('tel:+9779800000000') },
      ]
    );
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://hisabbarabar.qzz.io');
  };

  const handleCommunity = () => {
    toast.info('Join our community forum to connect with other Hisab Barabar users and get help.');
  };

  const handleReportBug = () => {
    toast.info('Thank you for helping us improve Hisab Barabar! Please describe the issue you encountered.');
  };

  const renderHelpItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onPress: () => void,
    showExternal: boolean = false
  ) => (
    <TouchableOpacity style={styles.helpItem} onPress={onPress}>
      <View style={styles.helpIcon}>
        {icon}
      </View>
      <View style={styles.helpContent}>
        <Text style={styles.helpTitle}>{title}</Text>
        <Text style={styles.helpSubtitle}>{subtitle}</Text>
      </View>
      {showExternal ? (
        <ExternalLink size={20} color={COLORS.textTertiary} />
      ) : (
        <ChevronRight size={20} color={COLORS.textTertiary} />
      )}
    </TouchableOpacity>
  );

  const renderFAQItem = (faq: typeof faqs[0], index: number) => (
    <View key={index} style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
      >
        <Text style={styles.faqQuestionText}>{faq.question}</Text>
        <ChevronRight 
          size={20} 
          color={COLORS.textTertiary} 
          style={[
            styles.faqChevron,
            expandedFAQ === index && styles.faqChevronExpanded
          ]}
        />
      </TouchableOpacity>
      {expandedFAQ === index && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
        </View>
      )}
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
        <Text style={styles.title} numberOfLines={1}>Help & Support</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          <View style={styles.helpGroup}>
            {renderHelpItem(
              <MessageCircle size={20} color={COLORS.textTertiary} />,
              'Contact Support',
              'Get help from our Hisab Barabar support team',
              handleContactSupport
            )}
            {renderHelpItem(
              <Book size={20} color={COLORS.textTertiary} />,
              'User Guide',
              'Learn how to use Hisab Barabar effectively',
              handleOpenWebsite,
              true
            )}
            {renderHelpItem(
              <Video size={20} color={COLORS.textTertiary} />,
              'Video Tutorials',
              'Watch step-by-step guides in Nepali',
              handleOpenWebsite,
              true
            )}
            {renderHelpItem(
              <Users size={20} color={COLORS.textTertiary} />,
              'Community Forum',
              'Connect with other Hisab Barabar users',
              handleCommunity,
              true
            )}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqGroup}>
            {faqs.map((faq, index) => renderFAQItem(faq, index))}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactItem}>
              <Mail size={20} color={COLORS.text} />
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@hisabbarabar.com</Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <Phone size={20} color={COLORS.text} />
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Phone Support</Text>
                <Text style={styles.contactValue}>+977 98-00000000</Text>
              </View>
            </View>
            <Text style={styles.contactHours}>
              Support hours: Sunday - Friday, 10 AM - 6 PM NST
            </Text>
          </View>
        </View>

        {/* Report Issues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Issues</Text>
          <View style={styles.helpGroup}>
            {renderHelpItem(
              <Bug size={20} color={COLORS.textTertiary} />,
              'Report a Bug',
              'Help us improve Hisab Barabar',
              handleReportBug
            )}
          </View>
        </View>

        {/* App Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>App Information</Text>
          <Text style={styles.infoText}>
            Hisab Barabar v1.0.0{'\n'}
            Last updated: January 2024{'\n'}
            Platform: React Native{'\n'}
            Made in Nepal
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
  helpGroup: {
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
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
  },
  faqGroup: {
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
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    marginRight: 12,
  },
  faqChevron: {
    transform: [{ rotate: '0deg' }],
  },
  faqChevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  faqAnswerText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  contactCard: {
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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactContent: {
    marginLeft: 12,
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
  },
  contactHours: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
});