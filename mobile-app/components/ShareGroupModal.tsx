import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Share,
  ScrollView,
  Pressable,
} from 'react-native';
import { X, Share2, Copy, Link, Users, Key } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { buildInviteQrUrl, buildInviteUrl } from '@/utils/invite';
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
  const qrUrl = buildInviteQrUrl(group.id);
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Share group</Text>
              <Text style={styles.subtitle}>Invite people to join your group</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close share dialog"
            >
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.groupSummary}>
            <View style={styles.groupIcon}>
              <Users size={20} color={COLORS.text} />
            </View>
            <View style={styles.groupDetails}>
              <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
              {group.memberCount !== undefined && (
                <Text style={styles.memberCount}>{group.memberCount} members</Text>
              )}
            </View>
          </View>

          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Scan to join</Text>
            <View
              style={styles.qrFrame}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`Invite QR code for ${group.name}`}
            >
              <QRCode value={qrUrl} size={168} color="#000000" backgroundColor="#ffffff" />
            </View>
            <Text style={styles.qrHint}>Scan with your camera to join this group.</Text>
          </View>

          <View style={styles.inviteOptions}>
            <Text style={styles.sectionTitle}>Other ways to invite</Text>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleCopyLink}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Copy invite link"
            >
              <View style={styles.optionIcon}>
                <Link size={18} color={COLORS.textSecondary} />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Invite link</Text>
                <Text style={styles.optionValue} numberOfLines={1}>{shareUrl}</Text>
              </View>
              <Copy size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
            {code && (
              <TouchableOpacity
                style={styles.optionRow}
                onPress={handleCopyCode}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Copy invite code"
              >
                <View style={styles.optionIcon}>
                  <Key size={18} color={COLORS.textSecondary} />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>Invite code</Text>
                  <Text style={styles.optionValue}>{code}</Text>
                </View>
                <Copy size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          </ScrollView>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Share group invite"
          >
            <Share2 size={18} color={COLORS.actionText} />
            <Text style={styles.shareButtonText}>Share invite</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    maxHeight: '94%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderStrong,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerCopy: {
    gap: 3,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 16,
    gap: 14,
  },
  groupSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
  },
  groupIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSecondary,
  },
  groupDetails: {
    flex: 1,
    gap: 3,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  memberCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 14,
  },
  qrTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  qrFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  qrHint: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inviteOptions: {
    gap: 10,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },
  optionIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  optionValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.action,
    minHeight: 54,
    gap: 9,
    borderRadius: 16,
  },
  shareButtonText: {
    color: COLORS.actionText,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});