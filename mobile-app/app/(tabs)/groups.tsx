import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useServerRefresh } from '@/hooks/useServerRefresh';
import { refreshServerData } from '@/services/dataClient';
import { Users, TrendingUp, TrendingDown, Plus, AlertCircle, UserPlus, Crown } from 'lucide-react-native';
import { Group } from '@/types';
import { apiService } from '@/services/api';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');
const CARD_PADDING = 24;

export default function GroupsScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fabScale = useSharedValue(1);
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const fetchGroups = async () => {
    try {
      setError(null);
      const fetchedGroups = await apiService.getGroups();
      setGroups(fetchedGroups);
    } catch (err) {
      setError('Failed to load groups. Please try again.');
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshServerData(false);
    await fetchGroups();
    setRefreshing(false);
  };

  useServerRefresh(fetchGroups);

  const renderGroupCard = ({ item, index }: { item: Group; index: number }) => {
    const netAmount = Object.values(item.balances).reduce((sum, balance) => sum + balance, 0);
    const isPositive = netAmount > 0;
    const isNegative = netAmount < 0;
    const statusText = isPositive 
      ? `You're owed रु ${Math.abs(netAmount).toFixed(2)}` 
      : isNegative
        ? `You owe रु ${Math.abs(netAmount).toFixed(2)}` 
        : 'Settled up';

    const isActive = item.members.length > 2; // Active group indicator

    return (
      <Animated.View
        entering={FadeInDown.duration(240).delay(Math.min(index, 6) * 35).easing(Easing.out(Easing.cubic))}
        style={styles.cardContainer}
      >
        <TouchableOpacity
          style={styles.groupCard}
          onPress={() => router.push(`/group/${item.id}`)}
          activeOpacity={0.85}
        >
          <View style={styles.groupIcon}>
            <Text style={styles.groupInitial}>{item.name.charAt(0)}</Text>
            {isActive && (
              <View style={styles.activeIndicator}>
                <Crown size={10} color={COLORS.actionText} />
              </View>
            )}
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.groupMeta}>
              <Users size={13} color={COLORS.subtext} />
              <Text style={styles.groupSubtitle} numberOfLines={1}>{item.members.length} members</Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            isPositive && { backgroundColor: `${COLORS.positive}15` },
            isNegative && { backgroundColor: `${COLORS.negative}15` },
            !isPositive && !isNegative && { backgroundColor: `${COLORS.subtext}10` }
          ]}>
            {isPositive && <TrendingUp size={13} color={COLORS.positive} style={styles.statusIcon} />}
            {isNegative && <TrendingDown size={13} color={COLORS.negative} style={styles.statusIcon} />}
            {!isPositive && !isNegative && <Users size={13} color={COLORS.subtext} style={styles.statusIcon} />}
            <Text
              style={[
                styles.statusText,
                isPositive && { color: COLORS.positive },
                isNegative && { color: COLORS.negative },
                !isPositive && !isNegative && { color: COLORS.subtext }
              ]}
              numberOfLines={1}
            >
              {statusText}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <Text style={styles.title}>Your Groups</Text>
          {/* <Text style={styles.subtitle}>Loading your groups...</Text> */}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.action} />
          <Text style={styles.loadingText}>Gathering your groups</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      
      <Animated.View
        style={styles.header}
        entering={FadeInDown.duration(240).easing(Easing.out(Easing.cubic))}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>My Groups</Text>
            <Text style={styles.subtitle}>Manage expenses together</Text>
          </View>
        </View>
      </Animated.View>

      {error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <AlertCircle size={32} color={COLORS.negative} />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id}
          style={styles.groupsList}
          contentContainerStyle={[
            styles.groupsContent,
            groups.length === 0 && styles.emptyContainer
          ]}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
              progressBackgroundColor={COLORS.surface}
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => groups.length > 0 ? (
            <Text style={styles.listHeader}>
              {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
            </Text>
          ) : null}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <UserPlus size={42} color={COLORS.text} />
              </View>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first group to start sharing expenses with friends
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/add-group')}
              >
                <Plus size={20} color={COLORS.actionText} />
                <Text style={styles.createButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/add-group')}
          onPressIn={() => {
            fabScale.value = withSpring(0.94, { damping: 18, stiffness: 320 });
          }}
          onPressOut={() => {
            fabScale.value = withSpring(1, { damping: 18, stiffness: 320 });
          }}
          accessibilityRole="button"
          accessibilityLabel="Add group"
        >
          <View style={styles.fabGradient}>
            <Plus size={26} color={COLORS.actionText} />
          </View>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.subtext,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  errorContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: CARD_PADDING,
    marginTop: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.negative}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 24,
    fontFamily: 'Inter-Medium',
  },
  retryButton: {
    backgroundColor: COLORS.action,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    marginTop: 12,
  },
  retryButtonText: {
    color: COLORS.actionText,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  groupsList: {
    flex: 1,
  },
  groupsContent: {
    paddingBottom: 100,
  },
  listHeader: {
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 16,
    paddingTop: 8,
    color: COLORS.subtext,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardContainer: {
    paddingHorizontal: CARD_PADDING,
    marginBottom: 10,
  },
  groupCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  groupInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.action,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  groupInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 3,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexShrink: 0,
    maxWidth: '42%',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: CARD_PADDING,
    paddingTop: width * 0.2,
  },
  emptyIllustration: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
    fontFamily: 'Inter-Regular',
    opacity: 0.9,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.action,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 999,
  },
  createButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.actionText,
    fontFamily: 'Inter-SemiBold',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 36,
    right: CARD_PADDING,
    zIndex: 10,
  },
  fab: {
    shadowColor: COLORS.action,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.action,
    justifyContent: 'center',
    alignItems: 'center',
  },
});