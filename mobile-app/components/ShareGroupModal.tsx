import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Share,
  ScrollView,
} from 'react-native';
import { X, Share2, Copy, Link, Users } from 'lucide-react-native';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';

interface Group {
  id: string;
  name: string;
  inviteLink?: string;
  inviteCode?: string;
  memberCount?: number;
}

interface ShareGroupModalProps {
  visible: boolean;
  onClose: () => void;
  group: Group;
}

export default function ShareGroupModal({ visible, onClose, group }: ShareGroupModalProps) {
  const { APP_DOMAIN } = Constants.expoConfig?.extra || {};
  const shareUrl = group.inviteLink || `https://${APP_DOMAIN}/join/${group.id}`;
  const code = group.inviteCode || '';
  const message = `Join my group "${group.name}" on SplitSaathi!\n${shareUrl}${code ? `\nUse code: ${code}` : ''}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message,
        title: `Join ${group.name}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert('Copied!', 'Link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert('Copied!', 'Invite code copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Share Group</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Group Info */}
          <View style={styles.groupCard}>
            <Users size={24} color="#4F46E5" />
            <Text style={styles.groupName}>{group.name}</Text>
            {group.memberCount !== undefined && (
              <Text style={styles.memberCount}>{group.memberCount} members</Text>
            )}
          </View>

          {/* Link Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invite Link</Text>
            <View style={styles.card}>
              <View style={styles.linkHeader}>
                <Link size={18} color="#4F46E5" />
                <Text style={styles.linkLabel}>Share this link to invite members</Text>
              </View>
              <TouchableOpacity 
                style={styles.linkContainer} 
                onPress={handleCopyLink}
              >
                <Text style={styles.linkText} numberOfLines={1}>{shareUrl}</Text>
                <Copy size={18} color="#4F46E5" style={styles.copyIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Code Section - Only shown if code exists */}
          {code && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invite Code</Text>
              <View style={styles.card}>
                <Text style={styles.codeLabel}>Share this code if the link doesn't work</Text>
                <TouchableOpacity 
                  style={styles.codeContainer} 
                  onPress={handleCopyCode}
                >
                  <Text style={styles.codeText}>{code}</Text>
                  <Copy size={18} color="#4F46E5" style={styles.copyIcon} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Share Button */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleShare}
          >
            <Share2 size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Share Invite</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  groupCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 2,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  memberCount: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
  },
  codeLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  codeText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#0C4A6E',
    letterSpacing: 0.5,
  },
  copyIcon: {
    marginLeft: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 10,
  },
});