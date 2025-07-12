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

// Modern color palette with enhanced contrast
const COLORS = {
  primary: '#6366F1',      // Vibrant indigo
  primaryLight: '#818CF8',
  secondary: '#4F46E5',    // Deep violet
  background: '#FAFBFC',   // Ultra clean background
  card: '#FFFFFF',         // Pure white cards
  text: '#1F2937',         // Rich dark text
  subtext: '#6B7280',      // Medium gray
  positive: '#059669',     // Deep emerald
  negative: '#DC2626',     // Rich red
  warning: '#D97706',      // Deep amber
  border: '#F3F4F6',       // Soft border
  gradientStart: '#6366F1', // Indigo
  gradientEnd: '#4F46E5',  // Violet
  shadow: 'rgba(0,0,0,0.04)',
  iconBackgrounds: ['#6366F1', '#4F46E5', '#059669', '#D97706', '#DC2626', '#8B5CF6'],
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
          toValue: 1.05,
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
              }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.groupCard}
          onPress={() => router.push(`/group/${item.id}`)}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={[`${iconColor}08`, `${iconColor}03`]}
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
                      <Crown size={10} color="#fff" />
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
                isPositive && { backgroundColor: `${COLORS.positive}12` },
                isNegative && { backgroundColor: `${COLORS.negative}12` },
                !isPositive && !isNegative && { backgroundColor: `${COLORS.subtext}12` }
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
          <View style={styles.errorIcon}>
            <AlertCircle size={32} color="#ffffff" />
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
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginLeft:30,
    marginTop:10,
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop:10,
    fontSize: 16,
    color: 'black',
    fontFamily: 'Inter-Medium',
    lineHeight: 22,
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
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.negative,
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
    borderRadius: 14,
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    color: COLORS.subtext,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.5,
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
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: COLORS.border,
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
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupIcon: {
    width: 56,
    height: 56,
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
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
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
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.subtext}10`,
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
    paddingTop: width * 0.15,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
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
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
    fontFamily: 'Inter-Regular',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
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
    bottom: 40,
    right: CARD_PADDING,
    zIndex: 10,
  },
  fab: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});