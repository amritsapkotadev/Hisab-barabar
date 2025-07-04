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
  Image
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
  ArrowUpRight,
  Bell,
  Minus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import ShareGroupModal from '@/components/ShareGroupModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { Group, Expense } from '@/types';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');
const statusBarHeight = Constants.statusBarHeight;

const COLORS = {
  primary: '#7c3aed',
  secondary: '#a78bfa',
  background: '#f8fafc',
  card: '#fff',
  text: '#1e293b',
  muted: '#64748b',
  positive: '#22c55e',
  negative: '#ef4444',
  border: '#e5e7eb',
  fab: ['#a78bfa', '#7c3aed'],
  header: '#7c3aed',
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
          width: tabWidth - 16,
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
            ? React.cloneElement(tab.icon, { size: 18 })
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
  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
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
      Alert.alert('Success', 'Group deleted successfully');
      router.replace('/(tabs)/groups');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete group');
    }
  };

  const handleDeleteMember = async (memberName: string): Promise<void> => {
    if (!group || !memberName) return;
    try {
      await apiService.removeGroupMember(group.id, memberName);
      await fetchGroupData();
      setShowDeleteMemberModal(false);
      Alert.alert('Success', 'Member removed successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to remove member');
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
            outputRange: [50 * (item.id.charCodeAt(0) + 1), 0],
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
          <DollarSign size={20} color="#7C3AED" />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle} numberOfLines={1}>{item.description}</Text>
          <View style={styles.expenseMeta}>
            <View style={styles.expensePaidBy}>
              <MemberAvatar name={item.paidBy} size={24} />
              <Text style={styles.expenseSubtitle}>{item.paidBy}</Text>
            </View>
            <View style={styles.expenseDateContainer}>
              <Clock size={14} color="#94a3b8" />
              <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.expenseAmountContainer}>
          <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
          <ChevronRight size={18} color="#94a3b8" />
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
        {group && group.createdBy === member && (
          <Text style={styles.adminText}>Group Admin</Text>
        )}
      </View>
      {group && group.createdBy !== member && (
        <TouchableOpacity
          onPress={() => {
            setSelectedMember(member);
            setShowDeleteMemberModal(true);
            handleDeleteMember(member);
          }}
          style={styles.deleteMemberButton}
        >
          <Minus size={20} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
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
        colors={['#7C3AED', '#5B21B6']}
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
            tintColor="#7C3AED"
            colors={['#7C3AED']}
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
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <DollarSign size={20} color="#7C3AED" />
            </View>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>₹{group.totalExpenses.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <User size={20} color="#7C3AED" />
            </View>
            <Text style={styles.summaryLabel}>Members</Text>
            <Text style={styles.summaryValue}>{group.members.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <FileText size={20} color="#7C3AED" />
            </View>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.summaryValue}>{expenses.length}</Text>
          </View>
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
                  <Check size={16} color="#22c55e" />
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
                <UserPlus size={18} color="#7C3AED" />
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
          colors={['#7C3AED', '#5B21B6']}
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
              <X size={24} color="#94a3b8" />
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
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowSettings(false)}
                activeOpacity={0.7}
              >
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>Group Settings</Text>
              
              <View style={styles.settingsOptionsContainer}>
                <TouchableOpacity 
                  style={styles.settingsOption}
                  onPress={() => {
                    setShowSettings(false);
                    setShowShareModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Share2 size={20} color="#7C3AED" />
                  <Text style={styles.settingsOptionText}>Share Group</Text>
                  <ChevronRight size={20} color="#94a3b8" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.settingsOption}
                  onPress={() => {
                    setShowSettings(false);
                    handleExport();
                  }}
                  activeOpacity={0.7}
                >
                  <Download size={20} color="#7C3AED" />
                  <Text style={styles.settingsOptionText}>Export Data</Text>
                  <ChevronRight size={20} color="#94a3b8" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.settingsOption}
                  onPress={() => {
                    setShowSettings(false);
                    setShowDeleteModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Trash2 size={20} color="#EF4444" />
                  <Text style={[styles.settingsOptionText, { color: '#EF4444' }]} onPress={handleDeleteGroup}>Delete Group</Text>
                  <ChevronRight size={20} color="#94a3b8" />
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
  // ... (keep all previous styles)

  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  deleteMemberButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  // ... (rest of the styles remain the same)




  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIcon: {
    backgroundColor: '#EDE9FE',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  summaryValue: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 18,
  },
  trackingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  trackingIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingText: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activeSegment: {
    position: 'absolute',
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    height: '110%',
    top: '15%',
    left: 8,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    zIndex: 1,
  },
  segmentButtonText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentButtonActive: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
  },
  segmentButtonTextActive: {
    color: '#7C3AED',
  },
  tabContent: {
    padding: 16,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  expenseIcon: {
    backgroundColor: '#EDE9FE',
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
    color: '#1E293B',
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
    color: '#64748B',
    fontWeight: '500',
    fontSize: 14,
  },
  expenseDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expenseDate: {
    color: '#94A3B8',
    fontWeight: '500',
    fontSize: 13,
  },
  expenseAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseAmount: {
    color: '#1E293B',
    fontWeight: '700',
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
  },
  emptyTitle: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 18,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontWeight: '500',
    fontSize: 14,
  },
  balancesContainer: {
    gap: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  balanceName: {
    flex: 1,
    color: '#1E293B',
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 12,
  },
  balanceAmount: {
    fontWeight: '700',
    fontSize: 16,
  },
  positiveBalance: {
    color: '#22c55e',
  },
  negativeBalance: {
    color: '#ef4444',
  },
  neutralBalance: {
    color: '#94a3b8',
  },
  settledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  settledText: {
    color: '#16A34A',
    fontWeight: '600',
  },
  settleButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  settleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  addMemberText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  membersContainer: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 16,
  },
  memberName: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 16,
  },
  adminText: {
    color: '#7C3AED',
    fontWeight: '500',
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalTitle: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#1E293B',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  exportScroll: {
    maxHeight: 200,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  exportText: {
    color: '#1E293B',
    fontWeight: '400',
    fontSize: 12,
  },
  copyButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  copyText: {
    color: '#fff',
    fontWeight: '600',
  },
  settingsBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  settingsContainer: {
    width: '100%',
  },
  settingsContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 40,
  },
  settingsOptionsContainer: {
    marginTop: 16,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsOptionText: {
    flex: 1,
    color: '#1E293B',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default GroupScreen;