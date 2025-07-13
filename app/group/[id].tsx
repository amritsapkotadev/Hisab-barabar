import React, { useState, useEffect, useRef, FC } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  DollarSign,
  Share2,
  Users,
  ChevronRight,
  Check,
  BarChart2,
  UserPlus,
  Download,
  X,
  Clock,
  User,
  FileText,
  Settings,
  Trash2,
  Minus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import ShareGroupModal from '@/components/ShareGroupModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { Group, Expense } from '@/types';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const statusBarHeight = Constants.statusBarHeight;

const COLORS = {
  primary: '#6366F1',
  secondary: '#4F46E5',
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',
  positive: '#10B981',
  negative: '#EF4444',
  border: '#E5E7EB',
  headerGradient: ['#6366F1', '#4F46E5'],
  summaryCard1: '#818CF8',
  summaryCard2: '#6366F1',
  summaryCard3: '#4F46E5',
  fab: ['#6366F1', '#4F46E5'],
  chip: '#E0E7FF',
};

type TabType = { id: string; label: string; icon: React.ReactElement<any, any> };

interface SegmentedControlProps {
  tabs: TabType[];
  activeTab: string;
  onTabPress: (id: string) => void;
}

const SegmentedControl: FC<SegmentedControlProps> = ({ tabs, activeTab, onTabPress }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const tabWidth = (width - 40) / tabs.length;

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    Animated.spring(translateX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      damping: 15,
    }).start();
  }, [activeTab]);

  return (
    <View style={styles.segmentedContainer}>
      <Animated.View style={[
        styles.activeSegment,
        {
          width: tabWidth - 7,
          transform: [{ translateX }],
        }
      ]} />
      {tabs.map((tab: TabType) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.segmentButton, activeTab === tab.id ? styles.segmentButtonActive : undefined]}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.8}
        >
          {React.isValidElement(tab.icon)
            ? React.cloneElement(tab.icon as React.ReactElement<any>, {
              size: 18,
              color: activeTab === tab.id ? '#FFFFFF' : COLORS.muted
            })
            : tab.icon}
          <Text style={[styles.segmentButtonText, activeTab === tab.id ? styles.segmentButtonTextActive : undefined]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const MemberAvatar = ({ name, size = 40 }: { name: string; size?: number }) => {
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#EF4444'];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <View style={{
      backgroundColor: color,
      width: size,
      height: size,
      borderRadius: size / 2,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: size * 0.4 }}>{initials}</Text>
    </View>
  );
};

const GroupScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const [groupData, expenseData] = await Promise.all([
        apiService.getGroup(id),
        apiService.getGroupExpenses(id),
      ]);
      setGroup(groupData);
      setExpenses(expenseData);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 10,
        })
      ]).start();
    } catch (err) {
      setError('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (showShareModal) {
        setShowShareModal(false);
      }
    });

    return unsubscribe;
  }, [navigation, showShareModal]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string): string => new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const isSettled = group && Object.values(group.balances).every(b => Math.abs(b) < 0.01);

  const handleDeleteGroup = async (): Promise<void> => {
    if (!group) return;
    try {
      const res = await apiService.deleteGroup(group.id);
      Alert.alert(res.message);
      router.replace('/(tabs)/groups');
    } catch (err: string | any) {
      Alert.alert('Error', err.response?.data?.message);
    }
  };

  const handleDeleteMember = async (): Promise<void> => {
    if (!group || !selectedMember) return;
    try {
      const res = await apiService.removeGroupMember(group.id, selectedMember);
      await fetchGroupData();
      setShowDeleteMemberModal(false);
      Alert.alert(res.message);
    } catch (err: string | any) {
      Alert.alert('Error', err.response?.data?.message);
    }
  };

  const handleAddMember = async (): Promise<void> => {
    if (!group) return;
    try {
      await apiService.joinGroupById(group.id);
      await fetchGroupData();
      setShowAddMemberModal(false);
      Alert.alert('Success', 'You joined the group!');
    } catch (err) {
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const handleExport = async (): Promise<void> => {
    if (!group) return;
    try {
      let csv = `Group: ${group.name}\n\n`;
      csv += `Expenses:\nDate,Description,Amount,Paid By\n`;
      expenses.forEach((exp: Expense) => {
        csv += `${formatDate(exp.date)},${exp.description},${exp.amount},${exp.paidBy}\n`;
      });
      csv += `\nBalances:\nMember,Balance\n`;
      Object.entries(group.balances).forEach(([member, balance]: [string, number]) => {
        csv += `${member},${balance.toFixed(2)}\n`;
      });
      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        const fileUri = FileSystem.cacheDirectory + `group-${group.id}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv);
        await Sharing.shareAsync(fileUri);
      } else {
        setExportResult(csv);
        setShowExportModal(true);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const renderExpenseCard = ({ item }: { item: Expense }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          })
        }]
      }}
    >
      <TouchableOpacity
        style={styles.expenseCard}
        onPress={() => router.push(`/group/${id}/expense/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.expenseIcon}>
          <DollarSign size={20} color={COLORS.primary} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle} numberOfLines={1}>{item.description}</Text>
          <View style={styles.expenseMeta}>
            <View style={styles.expensePaidBy}>
              <MemberAvatar name={item.paidBy} size={24} />
              <Text style={styles.expenseSubtitle}>{item.paidBy}</Text>
            </View>
            <View style={styles.expenseDateContainer}>
              <Clock size={14} color={COLORS.muted} />
              <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.expenseAmountContainer}>
          <Text style={styles.expenseAmount}>रु {item.amount.toFixed(2)}</Text>
          <ChevronRight size={18} color={COLORS.muted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBalanceItem = ({ member, balance }: { member: string; balance: number }) => (
    <View style={styles.balanceItem}>
      <MemberAvatar name={member} size={36} />
      <Text style={styles.balanceName} numberOfLines={1}>{member}</Text>
      <Text style={[
        styles.balanceAmount,
        balance > 0 ? styles.positiveBalance :
          balance < 0 ? styles.negativeBalance :
            styles.neutralBalance
      ]}>
        {balance > 0 ? '+' : ''}₹{Math.abs(balance).toFixed(2)}
      </Text>
    </View>
  );

  const renderMemberItem = (member: string) => (
    <View style={styles.memberItem}>
      <MemberAvatar name={member} size={44} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>{member}</Text>
        {(group && group.members[0] === member) && (
          <Text style={styles.adminText}>Group Admin</Text>
        )}
      </View>
      {(group && group.members[0] !== member) && (
        <TouchableOpacity
          onPress={() => {
            setSelectedMember(member);
            setShowDeleteMemberModal(true);
          }}
          style={styles.deleteMemberButton}
        >
          <Minus size={20} color={COLORS.negative} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Group not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchGroupData}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tabs = [
    { id: 'expenses', label: 'Expenses', icon: <DollarSign /> },
    { id: 'balances', label: 'Balances', icon: <BarChart2 /> },
    { id: 'members', label: 'Members', icon: <Users /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerEmoji}>{group.emoji || '💰'}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.7}
        >
          <Settings size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Summary Cards */}
        <Animated.View
          style={[
            styles.summaryContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: cardAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={[COLORS.summaryCard1, COLORS.summaryCard2]}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <DollarSign size={24} color="#fff" />
            <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.85)' }]}>Total</Text>
            <Text style={[
              styles.summaryValue,
              {
                color: '#fff',
                marginLeft: -4,
              }]}>रु {group.totalExpenses.toFixed(2)}</Text>
          </LinearGradient>

          <LinearGradient
            colors={[COLORS.summaryCard2, COLORS.summaryCard3]}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <User size={24} color="#fff" />
            <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.85)' }]}>Members</Text>
            <Text style={[styles.summaryValue, { color: '#fff' }]}>{group.members.length}</Text>
          </LinearGradient>

          <LinearGradient
            colors={[COLORS.summaryCard3, '#4338ca']}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FileText size={24} color="#fff" />
            <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.85)' }]}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#fff' }]}>{expenses.length}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Segmented Control */}
        <SegmentedControl
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'expenses' && (
            expenses.length > 0 ? (
              <FlatList
                data={expenses}
                renderItem={renderExpenseCard}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyState}>
                <DollarSign size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySubtitle}>Add your first expense to get started</Text>
              </View>
            )
          )}

          {activeTab === 'balances' && (
            <>
              {isSettled ? (
                <View style={styles.settledBanner}>
                  <Check size={16} color={COLORS.positive} />
                  <Text style={styles.settledText}>All settled up!</Text>
                </View>
              ) : (
                <View style={styles.balancesContainer}>
                  {Object.entries(group.balances).map(([member, balance]) => (
                    <View key={member}>
                      {renderBalanceItem({ member, balance })}
                    </View>
                  ))}
                </View>
              )}

              {!isSettled && (
                <TouchableOpacity
                  style={styles.settleButton}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/settle-up/${group.id}`)}
                >
                  <Text style={styles.settleButtonText}>Settle Up</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {activeTab === 'members' && (
            <>
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() => setShowAddMemberModal(true)}
                activeOpacity={0.7}
              >
                <UserPlus size={18} color={COLORS.primary} />
                <Text style={styles.addMemberText}>Add Member</Text>
              </TouchableOpacity>

              <View style={styles.membersContainer}>
                {group.members.map(member => (
                  <View key={member}>
                    {renderMemberItem(member)}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Expense FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/add-expense/${group.id}`)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={COLORS.fab}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Plus size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modals */}
      <ShareGroupModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        group={group}
      />

      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        message="Are you sure? This action cannot be undone."
      />

      <DeleteConfirmationModal
        visible={showDeleteMemberModal}
        onClose={() => setShowDeleteMemberModal(false)}
        onConfirm={handleDeleteMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${selectedMember} from the group?`}
      />

      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <BlurView intensity={30} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddMemberModal(false)}
              activeOpacity={0.7}
            >
              <X size={24} color={COLORS.muted} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Join Group</Text>
            <Text style={styles.modalText}>
              You'll be added as a member to "{group.name}"
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddMemberModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddMember}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable
          style={styles.settingsBackdrop}
          onPress={() => setShowSettings(false)}
        >
          <BlurView intensity={30} style={styles.settingsContainer}>
            <Pressable style={styles.settingsContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Group Settings</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowSettings(false)}
                  activeOpacity={0.7}
                >
                  <X size={24} color={COLORS.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingsOptionsContainer}>
                <TouchableOpacity
                  style={styles.settingsOption}
                  onPress={() => {
                    setShowSettings(false);
                    setShowShareModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Share2 size={20} color={COLORS.primary} />
                  <Text style={styles.settingsOptionText}>Share Group</Text>
                  <ChevronRight size={20} color={COLORS.muted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingsOption}
                  onPress={() => {
                    setShowSettings(false);
                    handleExport();
                  }}
                  activeOpacity={0.7}
                >
                  <Download size={20} color={COLORS.primary} />
                  <Text style={styles.settingsOptionText}>Export Data</Text>
                  <ChevronRight size={20} color={COLORS.muted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingsOption}
                  onPress={() => {
                    setShowSettings(false);
                    setShowDeleteModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Trash2 size={20} color={COLORS.negative} />
                  <Text style={[styles.settingsOptionText, { color: COLORS.negative }]}>
                    Delete Group
                  </Text>
                  <ChevronRight size={20} color={COLORS.muted} />
                </TouchableOpacity>
              </View>
            </Pressable>
          </BlurView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: statusBarHeight + 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  headerEmoji: {
    fontSize: 24,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    maxWidth: '70%',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryLabel: {
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  summaryValue: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.3,
    marginTop: 4,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeSegment: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    height: '100%',
    top: 5,
    left: 6,
    margin: 2,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    zIndex: 1,
    borderRadius: 10,
  },
  segmentButtonText: {
    color: COLORS.muted,
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  segmentButtonActive: {
    backgroundColor: 'transparent',
  },
  segmentButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabContent: {
    padding: 16,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseIcon: {
    backgroundColor: COLORS.chip,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 16,
  },
  expenseTitle: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expensePaidBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseSubtitle: {
    color: COLORS.muted,
    fontWeight: '500',
    fontSize: 14,
  },
  expenseDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expenseDate: {
    color: COLORS.muted,
    fontWeight: '500',
    fontSize: 13,
  },
  expenseAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseAmount: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 18,
    marginTop: 8,
  },
  emptySubtitle: {
    color: COLORS.muted,
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
  balancesContainer: {
    gap: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  balanceName: {
    flex: 1,
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 12,
  },
  balanceAmount: {
    fontWeight: '800',
    fontSize: 16,
  },
  positiveBalance: {
    color: COLORS.positive,
  },
  negativeBalance: {
    color: COLORS.negative,
  },
  neutralBalance: {
    color: COLORS.muted,
  },
  settledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  settledText: {
    color: '#15803D',
    fontWeight: '600',
    fontSize: 15,
  },
  settleButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  settleButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignSelf: 'flex-start',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  addMemberText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  membersContainer: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 16,
  },
  memberName: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  },
  adminText: {
    color: COLORS.primary,
    fontWeight: '500',
    fontSize: 14,
    marginTop: 4,
    backgroundColor: '#E0E7FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 20,
  },
  modalTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    color: COLORS.muted,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 28,
    fontSize: 16,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  settingsBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  settingsContainer: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  settingsContent: {
    backgroundColor: COLORS.card,
    padding: 24,
    paddingTop: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsOptionsContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingsOptionText: {
    flex: 1,
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 17,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.muted,
    fontWeight: '500',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: COLORS.negative,
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteMemberButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});

export default GroupScreen;