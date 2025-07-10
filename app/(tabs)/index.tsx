import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  FlatList,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Users, FileText, RefreshCw, AlertCircle, Wallet, Bell, Camera, ChevronRight, Edit3, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { apiService } from '@/services/api';
import type { Group, Expense, User } from '@/types';
import AddExpenseScreen from '../add-personal-expense'; 
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
import { useCameraPermission, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import QRScannerScreen from '../scan-qr';

// Modern light blue color palette
const COLORS = {
  primary: '#4361EE',
  secondary: '#3A0CA3',
  accent: '#4CC9F0',
  background: '#F8F9FA',
  card: '#FFFFFF',
  glass: 'rgba(255,255,255,0.7)',
  border: '#E2E8F0',
  text: '#1E293B',
  subtext: '#64748B',
  positive: '#10B981',
  negative: '#EF4444',
  shadow: 'rgba(0,0,0,0.05)',
  progressBg: '#EDF2F7',
  chip: '#E0F2FE',
  gradientStart: '#F0F9FF',
  gradientEnd: '#E0F2FE',
  toggleInactive: '#CBD5E1',
};

function getNetBalance(groups: Group[], userId: string) {
  let net = 0;
  groups.forEach(g => {
    if (g.balances && g.balances[userId]) net += g.balances[userId];
  });
  return net;
}

export default function HomeScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [perExpenses, setPerExpenses] = useState<Expense[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'personal' | 'shared'>('shared');
  const [personalBudget, setPersonalBudget] = useState<number>(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const inputRef = useRef<TextInput>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsRes, expensesRes, userRes, personalExpensesRes] = await Promise.all([
        apiService.getGroups(),
        apiService.getAllExpenses(),
        apiService.getUserProfile(),
        apiService.getPersonalExpenses(),
      ]);
      setGroups(groupsRes);
      setExpenses(expensesRes);
      setUser(userRes);
      setPerExpenses(personalExpensesRes);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    setDeleting(true);
    try {
      await apiService.deleteExpense(selectedExpense.id);
      setPerExpenses(perExpenses.filter(e => e.id !== selectedExpense.id));
      setSelectedExpense(null);
    } catch (err) {
      // Optionally show error
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  // Filter for personal expenses
  // const personalExpenses = expenses.filter(
  //   e => user && (
  //     (!e.groupId && e.paidBy === user.name) ||
  //     (e.participants && e.participants.includes(user.name))
  //   )
  // );

  // Calculate spent and left for this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const spentThisMonth = perExpenses
    .filter(e => new Date(e.date || e.createdAt) >= startOfMonth)
    .reduce((sum, e) => sum + e.amount, 0);
  const leftThisMonth = Math.max(0, personalBudget - spentThisMonth);

  // --- UI Components ---
  const renderAppBar = () => (
    <View style={styles.appBar}>
      <View style={styles.appBarContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={user?.picture ? { uri: user.picture } : require('@/assets/images/icon.png')}
            style={styles.avatar}
          />
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{user ? user.name.split(' ')[0] : 'User'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/profile/notifications')}
        >
          <View style={styles.notificationBadge} />
          <Bell size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNetBalanceCard = () => {
    const net = user ? getNetBalance(groups, user.id) : 0;
    const isPositive = net >= 0;
    const formattedNet = Math.abs(net).toFixed(2);
    
    return (
      <View style={styles.balanceCard}>
        <LinearGradient
          colors={['rgba(67, 97, 238, 0.1)', 'rgba(58, 12, 163, 0.1)']}
          style={styles.balanceGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.balanceContent}>
          <View style={styles.balanceHeader}>
            <Wallet size={20} color={COLORS.primary} />
            <Text style={styles.balanceTitle}>Net Balance</Text>
          </View>
          <Text style={[styles.balanceValue, { color: isPositive ? COLORS.positive : COLORS.negative }]}>
            ₹{formattedNet}
          </Text>
          <Text style={[styles.balanceStatus, { color: isPositive ? COLORS.positive : COLORS.negative }]}>
            {isPositive ? 'You are owed' : 'You owe'}
          </Text>
        </View>
      </View>
    );
  };

  // const renderPersonalExpenseCard = () => (
  //   <View style={styles.balanceCard}>
  //     <LinearGradient
  //       colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
  //       style={styles.balanceGradient}
  //       start={{ x: 0, y: 0 }}
  //       end={{ x: 1, y: 1 }}
  //     />
  //     <View style={styles.balanceContent}>
  //       <View style={styles.balanceHeader}>
  //         <FileText size={20} color={COLORS.negative} />
  //         <Text style={styles.balanceTitle}>Personal Expenses</Text>
  //       </View>
  //       <Text style={[styles.balanceValue, { color: COLORS.text }]}>₹{spentThisMonth.toFixed(2)}</Text>
  //       <Text style={[styles.balanceStatus, { color: COLORS.subtext }]}>This month</Text>
  //     </View>
  //   </View>
  // );

  const renderQuickActions = () => (
    <View style={styles.actionsContainer}>
      {[
        { icon: <Plus size={32} color="#FFF" />, label: 'Add Expense', action: () => router.push('/add-expense-advanced') },
        { icon: <Users size={32} color="#FFF" />, label: 'Add group', action: () => router.push('/add-group') },
        { icon: <Camera size={32} color="#FFF" />, label: 'Join Group', action: () => router.push('/joingroupbycode') },
      ].map((action, index) => (
        <TouchableOpacity
          key={index}
          style={styles.actionButton}
          onPress={action.action}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.actionIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {action.icon}
          </LinearGradient>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGroupCard = ({ item, index }: { item: Group; index: number }) => {
    const spent = item.totalExpenses;
    const limit = item.limit || Math.max(1000, spent * 1.5);
    const progress = Math.min(spent / limit, 1);
    const isActive = index === activeGroupIdx;
    
    return (
      <TouchableOpacity
        style={[styles.groupCard, isActive && styles.groupCardActive]}
        onPress={() => router.push(`/group/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.groupCardInner}>
          <View style={styles.groupIcon}>
            <Users size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.groupMembers}>{item.members.length} members</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground} />
            <View style={[styles.progressFill, { 
              width: `${progress * 100}%`,
              backgroundColor: progress < 0.7 ? COLORS.positive : COLORS.negative 
            }]} />
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Groups</Text>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={() => router.push('/(tabs)/groups')}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={16} color={COLORS.subtext} />
        </TouchableOpacity>
      </View>
      {groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No groups yet</Text>
          <Text style={styles.emptySubtext}>Create your first group to get started</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupCard}
          keyExtractor={g => g.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupsContainer}
          snapToInterval={SCREEN_WIDTH * 0.7 + 16}
          decelerationRate="fast"
          onScroll={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH * 0.7 + 16));
            setActiveGroupIdx(idx);
          }}
        />
      )}
    </View>
  );

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const group = groups.find((g) => g.id === item.groupId);
    const isPositive = user && item.paidBy === user.name;
    const isPersonal = !item.groupId; // Personal expenses have no groupId
    return (
      <View style={styles.expenseCard}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => item.groupId ? router.push(`/group/${item.groupId}`) : null}
          activeOpacity={0.85}
          disabled={!item.groupId}
        >
          <View style={styles.expenseCardInner}>
            <View style={[styles.expenseIcon, { backgroundColor: isPositive ? COLORS.positive + '20' : COLORS.negative + '20' }]}> 
              <FileText size={16} color={isPositive ? COLORS.positive : COLORS.negative} />
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseTitle} numberOfLines={1}>{item.description}</Text>
              <Text style={styles.expenseGroup} numberOfLines={1}>
                {group ? group.name : isPersonal ? 'Personal' : 'Unknown Group'}
              </Text>
            </View>
            <View style={styles.expenseAmountContainer}>
              <Text style={[styles.expenseAmount, { color: isPositive ? COLORS.positive : COLORS.negative }]}>₹{item.amount.toFixed(2)}</Text>
              <Text style={styles.expenseDate}>
                {new Date(item.date || item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            {isPersonal && (
              <View style={styles.expenseActions}>
                <TouchableOpacity
                  style={styles.actionIconSmall}
                  onPress={() => router.push({ pathname: '/add-personal-expense', params: { expenseId: item.id } })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Edit3 size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIconSmall}
                  onPress={() => { setSelectedExpense(item); setDeleteModalVisible(true); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={18} color={COLORS.negative} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecentExpenses = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={() => router.push('/(tabs)/transactions')}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={16} color={COLORS.subtext} />
        </TouchableOpacity>
      </View>
      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Add your first expense to see it here</Text>
        </View>
      ) : (
        <FlatList
          data={expenses.slice(0, 5)}
          renderItem={renderExpenseItem}
          keyExtractor={e => e.id}
          scrollEnabled={false}
          contentContainerStyle={styles.expensesContainer}
        />
      )}
    </View>
  );

  // --- Main Render ---
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <AlertCircle size={48} color={COLORS.negative} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAll}>
          <RefreshCw size={18} color="#FFF" />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[COLORS.primary]} 
            tintColor={COLORS.primary}
            progressBackgroundColor={COLORS.background}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderAppBar()}
        {/* Toggle Switch under welcome text */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, activeTab === 'personal' && styles.toggleButtonActive]}
            onPress={() => setActiveTab('personal')}
          >
            <Text style={[styles.toggleText, activeTab === 'personal' && styles.toggleTextActive]}>Personal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, activeTab === 'shared' && styles.toggleButtonActive]}
            onPress={() => setActiveTab('shared')}
          >
            <Text style={[styles.toggleText, activeTab === 'shared' && styles.toggleTextActive]}>Shared</Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'personal' ? (
          <>
            {/* Personal Budget Card */}
            <View style={styles.personalBudgetCard}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.personalBudgetGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.personalBudgetContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.personalBudgetTitle}>Monthly Budget</Text>
                  <TouchableOpacity onPress={() => {
                    setBudgetInput(personalBudget ? String(personalBudget) : '');
                    setShowBudgetModal(true);
                    setTimeout(() => inputRef.current?.focus(), 200);
                  }}>
                    <Edit3 size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.personalBudgetValue}>₹{personalBudget ? personalBudget.toFixed(2) : '--'}</Text>
                <View style={styles.personalBudgetRow}>
                  <Text style={styles.personalBudgetLabel}>Spent this month:</Text>
                  <Text style={styles.personalBudgetSpent}>₹{spentThisMonth.toFixed(2)}</Text>
                </View>
                <View style={styles.personalBudgetRow}>
                  <Text style={styles.personalBudgetLabel}>Left:</Text>
                  <Text style={styles.personalBudgetLeft}>₹{leftThisMonth.toFixed(2)}</Text>
                </View>
              </View>
            </View>
            {/* Personal Expenses List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Personal Expenses</Text>
              </View>
              {perExpenses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No personal expenses yet</Text>
                  <Text style={styles.emptySubtext}>Add a personal expense to see it here</Text>
                </View>
              ) : (
                <FlatList
                  data={perExpenses}
                  renderItem={renderExpenseItem}
                  keyExtractor={e => e.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.expensesContainer}
                />
              )}
            </View>
            {/* FAB for adding personal expense */}
            <TouchableOpacity
              style={styles.fabPersonal}
              onPress={() => router.push('/add-personal-expense')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.fabGradientPersonal}>
                <Plus size={28} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            {/* Modal for editing budget */}
            <Modal
              visible={showBudgetModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowBudgetModal(false)}
            >
              <KeyboardAvoidingView style={styles.budgetModalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.budgetModalContent}>
                  <Text style={styles.budgetModalTitle}>Set Monthly Budget</Text>
                  <TextInput
                    ref={inputRef}
                    style={styles.budgetInput}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    placeholderTextColor="#A0A0C0"
                    value={budgetInput}
                    onChangeText={setBudgetInput}
                    onSubmitEditing={() => {
                      setPersonalBudget(Number(budgetInput) || 0);
                      setShowBudgetModal(false);
                    }}
                  />
                  <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
                    <TouchableOpacity
                      style={[styles.budgetModalBtn, { backgroundColor: COLORS.negative }]}
                      onPress={() => setShowBudgetModal(false)}
                    >
                      <Text style={styles.budgetModalBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.budgetModalBtn, { backgroundColor: COLORS.primary }]}
                      onPress={() => {
                        setPersonalBudget(Number(budgetInput) || 0);
                        setShowBudgetModal(false);
                      }}
                    >
                      <Text style={styles.budgetModalBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          </>
        ) : (
          <>
            {renderNetBalanceCard()}
            {/* {renderPersonalExpenseCard()} */}
            {renderQuickActions()}
            {renderGroupsSection()}
            {renderRecentExpenses()}
          </>
        )}
      </Animated.ScrollView>
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this personal expense? This action cannot be undone."
        confirmText="Delete"
        isDangerous
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  appBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  appBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  greetingContainer: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginTop: 2,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    zIndex: 10,
  },
  balanceCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
    height: 160,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  balanceContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceTitle: {
    fontSize: 16,
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  balanceStatus: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
    color: COLORS.subtext,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Medium',
    marginRight: 4,
  },
  groupsContainer: {
    paddingLeft: 24,
    paddingRight: 8,
  },
  groupCard: {
    width: SCREEN_WIDTH * 0.7,
    marginRight: 16,
    marginTop: 2,
    marginBottom: 2,
    borderRadius: 24,
    overflow: 'hidden',
    height: 180,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  groupCardActive: {
    transform: [{ scale: 1.02 }],
    borderColor: COLORS.primary,
  },
  groupCardInner: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.chip,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
  },
  groupMembers: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.progressBg,
    marginTop: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.progressBg,
  },
  progressFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 3,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    top: -20,
    fontSize: 12,
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  expensesContainer: {
    paddingHorizontal: 24,
  },
  expenseCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseCardInner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  expenseGroup: {
    fontSize: 13,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginHorizontal: 24,
    backgroundColor: COLORS.card,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.subtext,
    marginTop: 24,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
    marginTop: 24,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    marginHorizontal: 24,
    backgroundColor: COLORS.toggleInactive,
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    color: COLORS.subtext,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  toggleTextActive: {
    color: '#fff',
  },
  fabPersonal: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  fabGradientPersonal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    width: 60,
    height: 60,
  },
  personalBudgetCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
    height: 160,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  personalBudgetGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  personalBudgetContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  personalBudgetTitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  personalBudgetValue: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  personalBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  personalBudgetLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter-Regular',
  },
  personalBudgetSpent: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  personalBudgetLeft: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  budgetModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  budgetModalContent: {
    width: '85%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  budgetModalTitle: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  budgetInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    fontSize: 18,
    backgroundColor: COLORS.background,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  budgetModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetModalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionIcon: {
    marginHorizontal: 4,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  actionIconSmall: {
    marginHorizontal: 4,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
});