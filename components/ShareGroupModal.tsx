import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { X, Share2, QrCode, Copy } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';

interface Group {
  id: string;
  name: string;
  inviteLink?: string;
}

interface ShareGroupModalProps {
  visible: boolean;
  onClose: () => void;
  group: Group;
}

export default function ShareGroupModal({ visible, onClose, group }: ShareGroupModalProps) {
  const { APP_DOMAIN } = Constants.expoConfig?.extra || {};
  const shareUrl = group.inviteLink || `https://${APP_DOMAIN}/join/${group.id}`;

  const message = `Join "${group.name}" on SplitSaathi to split expenses together!\n\nClick the invite link: ${shareUrl}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message,
        url: shareUrl,
        title: `Join ${group.name} on SplitSaathi`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert('Copied!', 'Invite link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Share Group</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Group Name</Text>
          <Text style={styles.value}>{group.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Invite Link</Text>
          <View style={styles.linkRow}>
            <Text style={styles.link} numberOfLines={1}>{shareUrl}</Text>
            <TouchableOpacity onPress={handleCopy}>
              <Copy size={20} color="#4f46e5" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>QR Code</Text>
          <View style={styles.qrContainer}>
            <QRCode value={shareUrl} size={200} />
          </View>
        </View>

        <View style={styles.shareOptions}>
          <TouchableOpacity style={styles.shareOption} onPress={handleShare}>
            <View style={styles.shareIconContainer}>
              <Share2 size={24} color="#4f46e5" />
            </View>
            <Text style={styles.shareOptionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  link: {
    fontSize: 14,
    color: '#4f46e5',
    flex: 1,
    marginRight: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  shareOption: {
    alignItems: 'center',
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareOptionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
});
