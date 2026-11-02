import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Users, CircleCheck as CheckCircle, Circle as XCircle, ArrowRight, Chrome as Home, UserPlus } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToGroupTopic } from '@/services/notifications';
import { Group } from '@/types';

export default function JoinGroupScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { status } = useAuth();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [joinStatus, setJoinStatus] = useState<'pending' | 'success' | 'error' | 'already_member'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!groupId) {
      setLoading(false);
      setJoinStatus('error');
      setErrorMessage('Invalid group link');
      return;
    }

    if (status === 'unauthenticated') {
      router.replace({
        pathname: '/(auth)/login',
        params: { redirect: `/join/${groupId}` },
      });
      return;
    }

    handleJoinGroup();
  }, [groupId, status]);

  const handleJoinGroup = async () => {
    if (!groupId) return;

    setLoading(true);
    setJoining(true);

    try {
      const { group: joinedGroup, alreadyMember } = await apiService.joinGroupById(groupId);
      setGroup(joinedGroup);
      await subscribeToGroupTopic(groupId);
      setJoinStatus(alreadyMember ? 'already_member' : 'success');
    } catch (error: any) {
      console.error('Join group error:', error);
      
      if (error.message?.includes('already a member')) {
        setJoinStatus('already_member');
      } else if (error.message?.includes('not found')) {
        setJoinStatus('error');
        setErrorMessage('Group not found or invite link is invalid');
      } else if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
        setJoinStatus('error');
        setErrorMessage('Please log in to join this group');
      } else {
        setJoinStatus('error');
        setErrorMessage(error.message || 'Failed to join group');
      }
    } finally {
      setLoading(false);
      setJoining(false);
    }
  };

  const handleGoToGroup = () => {
    if (group) {
      router.replace(`/group/${group.id}`);
    } else {
      router.replace('/(tabs)/groups');
    }
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleRetry = () => {
    handleJoinGroup();
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.action} />
          <Text style={styles.loadingText}>
            {joining ? 'Joining group...' : 'Loading group...'}
          </Text>
        </View>
      );
    }

    switch (joinStatus) {
      case 'success':
        return (
          <View style={styles.centerContent}>
            <View style={styles.successIcon}>
              <CheckCircle size={80} color={COLORS.positive} />
            </View>
            <Text style={styles.successTitle}>Welcome to the group!</Text>
            <Text style={styles.successMessage}>
              You've successfully joined "{group?.name}"
            </Text>
            
            {group && (
              <View style={styles.groupInfo}>
                <Text style={styles.groupInfoTitle}>Group Details</Text>
                <Text style={styles.groupInfoText}>
                  <Text style={styles.groupInfoLabel}>Name: </Text>
                  {group.name}
                </Text>
                {group.description && (
                  <Text style={styles.groupInfoText}>
                    <Text style={styles.groupInfoLabel}>Description: </Text>
                    {group.description}
                  </Text>
                )}
                <Text style={styles.groupInfoText}>
                  <Text style={styles.groupInfoLabel}>Members: </Text>
                  {group.members.length}
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGoToGroup}>
                <ArrowRight size={20} color={COLORS.actionText} />
                <Text style={styles.primaryButtonText}>Go to Group</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Home size={20} color={COLORS.text} />
                <Text style={styles.secondaryButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'already_member':
        return (
          <View style={styles.centerContent}>
            <View style={styles.infoIcon}>
              <Users size={80} color={COLORS.text} />
            </View>
            <Text style={styles.infoTitle}>Already a member</Text>
            <Text style={styles.infoMessage}>
              You're already a member of this group!
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGoToGroup}>
                <ArrowRight size={20} color={COLORS.actionText} />
                <Text style={styles.primaryButtonText}>Go to Group</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Home size={20} color={COLORS.text} />
                <Text style={styles.secondaryButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'error':
      default:
        return (
          <View style={styles.centerContent}>
            <View style={styles.errorIcon}>
              <XCircle size={80} color={COLORS.negative} />
            </View>
            <Text style={styles.errorTitle}>Unable to join group</Text>
            <Text style={styles.errorMessage}>
              {errorMessage || 'Something went wrong while trying to join the group.'}
            </Text>

            <View style={styles.buttonContainer}>
              {errorMessage.includes('log in') ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                  <UserPlus size={20} color={COLORS.actionText} />
                  <Text style={styles.primaryButtonText}>Login</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Home size={20} color={COLORS.text} />
                <Text style={styles.secondaryButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Join Group</Text>
          <Text style={styles.headerSubtitle}>Hisab Barabar</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        {renderContent()}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have the app? Visit splitsaathi.up.railway.app to get started!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textTertiary,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.positive,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  infoIcon: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoMessage: {
    fontSize: 16,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorIcon: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.negative,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  groupInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
  },
  groupInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  groupInfoText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginBottom: 8,
    lineHeight: 20,
  },
  groupInfoLabel: {
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.action,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 999,
  },
  primaryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.actionText,
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});