import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Play, Gift, Star } from 'lucide-react-native';

interface AdModalProps {
  visible: boolean;
  onClose: () => void;
  onAdWatched: () => void;
  adType: 'transaction' | 'group';
}

export default function AdModal({ visible, onClose, onAdWatched, adType }: AdModalProps) {
  const [adState, setAdState] = useState<'loading' | 'ready' | 'playing' | 'completed'>('loading');
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (visible) {
      setAdState('loading');
      setCountdown(30);
      
      // Simulate ad loading
      const loadTimer = setTimeout(() => {
        setAdState('ready');
      }, 2000);

      return () => clearTimeout(loadTimer);
    }
  }, [visible]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (adState === 'playing' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (adState === 'playing' && countdown === 0) {
      setAdState('completed');
    }

    return () => clearTimeout(timer);
  }, [adState, countdown]);

  const handlePlayAd = () => {
    setAdState('playing');
  };

  const handleSkipAd = () => {
    if (countdown <= 5) {
      setAdState('completed');
    }
  };

  const handleClaimReward = () => {
    onAdWatched();
    onClose();
    Alert.alert(
      'Reward Claimed!',
      adType === 'transaction' 
        ? 'You can now add 5 more transactions today!' 
        : 'You can now create 1 more group!',
      [{ text: 'Great!', style: 'default' }]
    );
  };

  const renderAdContent = () => {
    switch (adState) {
      case 'loading':
        return (
          <View style={styles.adContent}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading ad...</Text>
          </View>
        );

      case 'ready':
        return (
          <View style={styles.adContent}>
            <View style={styles.adPreview}>
              <Play size={48} color="#2563eb" />
            </View>
            <Text style={styles.adTitle}>Watch a short ad to continue</Text>
            <Text style={styles.adDescription}>
              {adType === 'transaction' 
                ? 'Get 5 more transactions for today by watching a 30-second ad'
                : 'Create 1 more group by watching a 30-second ad'
              }
            </Text>
            <TouchableOpacity style={styles.playButton} onPress={handlePlayAd}>
              <Play size={20} color="#ffffff" />
              <Text style={styles.playButtonText}>Watch Ad (30s)</Text>
            </TouchableOpacity>
          </View>
        );

      case 'playing':
        return (
          <View style={styles.adContent}>
            <View style={styles.adPlayer}>
              <View style={styles.adVideo}>
                <Text style={styles.adVideoText}>🎬 Ad Playing...</Text>
                <Text style={styles.adVideoSubtext}>Demo Advertisement</Text>
              </View>
              <View style={styles.adControls}>
                <Text style={styles.countdownText}>{countdown}s</Text>
                {countdown <= 5 && (
                  <TouchableOpacity style={styles.skipButton} onPress={handleSkipAd}>
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        );

      case 'completed':
        return (
          <View style={styles.adContent}>
            <View style={styles.rewardContent}>
              <Gift size={48} color="#059669" />
              <Text style={styles.rewardTitle}>Ad Complete!</Text>
              <Text style={styles.rewardDescription}>
                {adType === 'transaction' 
                  ? 'You\'ve earned 5 additional transactions for today'
                  : 'You\'ve earned 1 additional group creation'
                }
              </Text>
              <TouchableOpacity style={styles.claimButton} onPress={handleClaimReward}>
                <Star size={20} color="#ffffff" />
                <Text style={styles.claimButtonText}>Claim Reward</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {adType === 'transaction' ? 'More Transactions' : 'More Groups'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {renderAdContent()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ads help us keep SplitWise free for everyone
          </Text>
        </View>
      </View>
    </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  adContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  adPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  adTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  adDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  adPlayer: {
    width: '100%',
    maxWidth: 400,
  },
  adVideo: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  adVideoText: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 8,
  },
  adVideoSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  adControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  skipButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  rewardContent: {
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#059669',
    marginTop: 16,
    marginBottom: 12,
  },
  rewardDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  claimButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});