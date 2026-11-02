import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Share,
  ScrollView,
} from 'react-native';
import { X, Share2, Copy, Link, Users } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { buildInviteUrl } from '@/utils/invite';
import { useToast } from '@/components/Toast';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

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
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const shareUrl = buildInviteUrl(group.id, group.inviteLink);
  const code = group.inviteCode || '';
  const message = `Join my group "${group.name}" on Hisab Barabar!\n${shareUrl}${code ? `\nUse code: ${code}` : ''}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message,
        title: `Join ${group.name}`,
      });
    } catch (error) {
      toast.error('Failed to share');
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(shareUrl);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      toast.success('Invite code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Share Group</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close share dialog"
          >
            <X size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Group Info */}
          <View style={styles.groupCard}>
            <Users size={24} color={COLORS.text} />
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
                <Link size={18} color={COLORS.text} />
                <Text style={styles.linkLabel}>Share this link to invite members</Text>
              </View>
              <TouchableOpacity 
                style={styles.linkContainer} 
                onPress={handleCopyLink}
              >
                <Text style={styles.linkText} numberOfLines={1}>{shareUrl}</Text>
                <Copy size={18} color={COLORS.text} style={styles.copyIcon} />
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
                  <Copy size={18} color={COLORS.text} style={styles.copyIcon} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Share Button */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleShare}
          >
            <Share2 size={20} color={COLORS.actionText} style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Share Invite</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  groupCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 2,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  memberCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  codeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  codeText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  copyIcon: {
    marginLeft: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.action,
    paddingVertical: 16,
    borderRadius: 999,
    marginTop: 8,
  },
  primaryButtonText: {
    color: COLORS.actionText,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  buttonIcon: {
    marginRight: 10,
  },
});