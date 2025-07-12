import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Users, TrendingUp, TrendingDown, Plus, ChevronRight, AlertCircle, UserPlus, MoreVertical, Sparkles, Crown } from 'lucide-react-native';
import { Group } from '@/types';
import { apiService } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_PADDING = 24;

// Enhanced color palette with better contrast and modern tones
const COLORS = {
  primary: '#6366F1',      // Vibrant indigo
  primaryLight: '#818CF8',
  secondary: '#4F46E5',    // Deep violet
  background: '#FAFBFC',   // Ultra clean background
  card: '#FFFFFF',         // Pure white cards
  text: '#1F2937',         // Rich dark text
  subtext: '#6B7280',      // Medium gray
  positive: '#10B981',     // Brighter emerald
  negative: '#EF4444',     // Brighter red
  warning: '#F59E0B',      // Vibrant amber
  border: '#F3F4F6',       // Soft border
  gradientStart: '#6366F1', // Indigo
  gradientEnd: '#8B5CF6',  // Brighter purple for gradient
  shadow: 'rgba(0,0,0,0.05)',
  iconBackgrounds: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'],
  glass: 'rgba(255,255,255,0.8)',
  glassBorder: 'rgba(255,255,255,0.2)',
};

const getGroupColor = (name: string) => {
  const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COLORS.iconBackgrounds[charSum % COLORS.iconBackgrounds.length];
};

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  // FAB pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Header animation
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      fetchGroups();
    }, [])
  );

  const renderGroupCard = ({ item, index }: { item: Group; index: number }) => {
    const netAmount = Object.values(item.balances).reduce((sum, balance) => sum + balance, 0);
    const isPositive = netAmount > 0;
    const isNegative = netAmount < 0;
    const statusText = isPositive 
      ? `You're owed ₹${Math.abs(netAmount).toFixed(2)}` 
      : isNegative
        ? `You owe ₹${Math.abs(netAmount).toFixed(2)}` 
        : 'Settled up';

    const iconColor = getGroupColor(item.name);
    const isActive = item.members.length > 2; // Active group indicator

    return (
      <Animated.View 
        style={[
          styles.cardContainer, 
          {
            opacity: fadeAnim,
            transform: [
              { 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [60, 0]
                }) 
              },
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1]
                })
              }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.groupCard}
          onPress={() => router.push(`/group/${item.id}`)}
          activeOpacity={0.92}
        >
          <LinearGradient
            colors={[`${iconColor}0A`, `${iconColor}03`]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.leftSection}>
                <View style={[styles.groupIcon, { backgroundColor: `${iconColor}15` }]}>
                  <LinearGradient
                    colors={[iconColor, `${iconColor}90`]}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={styles.groupInitial}>{item.name.charAt(0)}</Text>
                  {isActive && (
                    <View style={styles.activeIndicator}>
                      <Crown size={14} color="#fff" />
                    </View>
                  )}
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.groupMeta}>
                    <Users size={14} color={COLORS.subtext} />
                    <Text style={styles.groupSubtitle}>{item.members.length} members</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
                <MoreVertical size={18} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
              <View style={[
                styles.statusBadge,
                isPositive && { backgroundColor: `${COLORS.positive}15` },
                isNegative && { backgroundColor: `${COLORS.negative}15` },
                !isPositive && !isNegative && { backgroundColor: `${COLORS.subtext}10` }
              ]}>
                {isPositive && <TrendingUp size={16} color={COLORS.positive} style={styles.statusIcon} />}
                {isNegative && <TrendingDown size={16} color={COLORS.negative} style={styles.statusIcon} />}
                {!isPositive && !isNegative && <Users size={16} color={COLORS.subtext} style={styles.statusIcon} />}
                <Text style={[
                  styles.statusText,
                  isPositive && { color: COLORS.positive },
                  isNegative && { color: COLORS.negative },
                  !isPositive && !isNegative && { color: COLORS.subtext }
                ]}>
                  {statusText}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <LinearGradient
          colors={[COLORS.background, '#F8FAFC']}
          style={styles.background}
        />
        <View style={styles.header}>
          <Text style={styles.title}>Your Groups</Text>
          <Text style={styles.subtitle}>Loading your groups...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Gathering your groups</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <LinearGradient
        colors={[COLORS.background, '#F8FAFC']}
        style={styles.background}
      />
      
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.titleContainer}>
              <Sparkles size={24} color={COLORS.primary} style={styles.titleIcon} />
              <Text style={styles.title}>My Groups</Text>
            </View>
            <Text style={styles.subtitle}>
              {groups.length} {groups.length === 1 ? 'group' : 'groups'} • Manage expenses together
            </Text>
          </View>
        </View>
      </Animated.View>

      {error ? (
        <View style={styles.errorContainer}>
          <LinearGradient
            colors={[`${COLORS.negative}`, '#DC2626']}
            style={styles.errorIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <AlertCircle size={32} color="#ffffff" />
          </LinearGradient>
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
              progressBackgroundColor="#ffffff"
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <Text style={styles.listHeader}>
              {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
            </Text>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  style={styles.emptyGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <UserPlus size={42} color="#ffffff" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first group to start sharing expenses with friends
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/add-group')}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.createButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Animated.View style={[styles.fabContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/add-group')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus size={26} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
    paddingLeft: 36,
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
    backgroundColor: '#ffffff',
    marginHorizontal: CARD_PADDING,
    marginTop: 16,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  retryButtonText: {
    color: '#ffffff',
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
    marginBottom: 16,
  },
  groupCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  iconGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.25,
  },
  groupInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupSubtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
    opacity: 0.9,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.subtext}08`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
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
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  emptyGradient: {
    width: '100%',
    height: '100%',
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
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  createButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter-SemiBold',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 36,
    right: CARD_PADDING,
    zIndex: 10,
  },
  fab: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});