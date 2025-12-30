import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Users, CircleCheck as CheckCircle, Circle as XCircle, ArrowRight, Chrome as Home, UserPlus } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { Group } from '@/types';

export default function JoinGroupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [joinStatus, setJoinStatus] = useState<'pending' | 'success' | 'error' | 'already_member'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (groupId) {
      handleJoinGroup();
    } else {
      setLoading(false);
      setJoinStatus('error');
      setErrorMessage('Invalid group link');
    }
  }, [groupId]);

  const handleJoinGroup = async () => {
    if (!groupId) return;

    // Check if user is authenticated
    if (!apiService.isAuthenticated()) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to join a group. Please log in first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Login', 
            onPress: () => {
              router.replace('/(auth)/login');
            }
          }
        ]
      );
      return;
    }

    setLoading(true);
    setJoining(true);

    try {
      // First, try to get group info
      const groupData = await apiService.getGroup(groupId);
      
      if (!groupData) {
        setJoinStatus('error');
        setErrorMessage('Group not found');
        return;
      }

      // Try to join the group
      const joinResult = await apiService.joinGroupById(groupId);
      setGroup(joinResult);
      
      if (joinResult) {
        setJoinStatus('success');
      } else {
        setJoinStatus('error');
        setErrorMessage('Failed to join group');
      }
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
          <ActivityIndicator size="large" color="#4f46e5" />
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
              <CheckCircle size={80} color="#10b981" />
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
                <ArrowRight size={20} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Go to Group</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Home size={20} color="#4f46e5" />
                <Text style={styles.secondaryButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'already_member':
        return (
          <View style={styles.centerContent}>
            <View style={styles.infoIcon}>
              <Users size={80} color="#4f46e5" />
            </View>
            <Text style={styles.infoTitle}>Already a member</Text>
            <Text style={styles.infoMessage}>
              You're already a member of this group!
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGoToGroup}>
                <ArrowRight size={20} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Go to Group</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Home size={20} color="#4f46e5" />
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
              <XCircle size={80} color="#ef4444" />
            </View>
            <Text style={styles.errorTitle}>Unable to join group</Text>
            <Text style={styles.errorMessage}>
              {errorMessage || 'Something went wrong while trying to join the group.'}
            </Text>

            <View style={styles.buttonContainer}>
              {errorMessage.includes('log in') ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                  <UserPlus size={20} color="#ffffff" />
                  <Text style={styles.primaryButtonText}>Login</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Home size={20} color="#4f46e5" />
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
          <Text style={styles.headerSubtitle}>SplitSaathi</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
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
    color: '#6b7280',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
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
    color: '#4f46e5',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoMessage: {
    fontSize: 16,
    color: '#6b7280',
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
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  groupInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  groupInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  groupInfoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  groupInfoLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  secondaryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});