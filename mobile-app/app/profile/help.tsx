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
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I create a new group in Hisab Kitab?',
      answer: 'Tap the "+" button on the Groups tab or use the "New Group" quick action on the home screen. Enter a group name, description, and add members to start tracking shared expenses.'
    },
    {
      question: 'How are expenses split in Hisab Kitab?',
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
      answer: 'Hisab Kitab supports eSewa for digital payments in Nepal, along with cash settlements. More payment methods will be added in future updates.'
    },
    {
      question: 'How do I leave a group?',
      answer: 'You can leave a group by going to the group settings. Make sure all balances are settled before leaving to avoid confusion.'
    },
    {
      question: 'Is my data secure in Hisab Kitab?',
      answer: 'Yes, we use industry-standard encryption to protect your data. Your financial information is securely stored and never shared with third parties.'
    }
  ];

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you\'d like to contact us:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => Linking.openURL('mailto:support@hisabkitab.com') },
        { text: 'Phone', onPress: () => Linking.openURL('tel:+9779800000000') },
      ]
    );
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://hisabkitab.com/help');
  };

  const handleCommunity = () => {
    Alert.alert('Community', 'Join our community forum to connect with other Hisab Kitab users and get help.');
  };

  const handleReportBug = () => {
    Alert.alert('Report Bug', 'Thank you for helping us improve Hisab Kitab! Please describe the issue you encountered.');
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
        <ExternalLink size={20} color="#9ca3af" />
      ) : (
        <ChevronRight size={20} color="#9ca3af" />
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
          color="#6b7280" 
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
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          <View style={styles.helpGroup}>
            {renderHelpItem(
              <MessageCircle size={20} color="#6b7280" />,
              'Contact Support',
              'Get help from our Hisab Kitab support team',
              handleContactSupport
            )}
            {renderHelpItem(
              <Book size={20} color="#6b7280" />,
              'User Guide',
              'Learn how to use Hisab Kitab effectively',
              handleOpenWebsite,
              true
            )}
            {renderHelpItem(
              <Video size={20} color="#6b7280" />,
              'Video Tutorials',
              'Watch step-by-step guides in Nepali',
              handleOpenWebsite,
              true
            )}
            {renderHelpItem(
              <Users size={20} color="#6b7280" />,
              'Community Forum',
              'Connect with other Hisab Kitab users',
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
              <Mail size={20} color="#2563eb" />
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@hisabkitab.com</Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <Phone size={20} color="#2563eb" />
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
              <Bug size={20} color="#6b7280" />,
              'Report a Bug',
              'Help us improve Hisab Kitab',
              handleReportBug
            )}
          </View>
        </View>

        {/* App Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>App Information</Text>
          <Text style={styles.infoText}>
            Hisab Kitab v1.0.0{'\n'}
            Last updated: January 2024{'\n'}
            Platform: React Native{'\n'}
            Made in Nepal 🇳🇵
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  helpGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  faqGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
    color: '#6b7280',
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    color: '#111827',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  contactHours: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
});