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
import { useLocalSearchParams, router } from 'expo-router';
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
  FileText
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

const { width, height } = Dimensions.get('window');

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
};

type TabType = { id: string; label: string; icon: React.ReactElement<any, any> };
const SegmentedControl: FC<{ tabs: TabType[]; activeTab: string; onTabPress: (id: string) => void }> = ({ tabs, activeTab, onTabPress }) => {
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
          <Text style={[styles.segmentButtonText, activeTab === tab.id ? styles.segmentButtonTextActive : undefined]}>{tab.label}</Text>
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
  const [exportResult, setExportResult] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  // Fetch group data
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupData();
    setRefreshing(false);
  };

  // Helper functions
  const formatDate = (dateString: string): string => new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });

  const isSettled = group && Object.values(group.balances).every(b => Math.abs(b) < 0.01);

  // Handlers
  const handleDeleteGroup = async (): Promise<void> => {
    if (!group) return;
    try {
      await apiService.deleteGroup(group.id);
      router.replace('/');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete group');
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

  // Render functions
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
        <MemberAvatar name={item.paidBy} size={44} />
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.expenseSubtitle}>Paid by {item.paidBy}</Text>
        </View>
        <View style={styles.expenseAmountContainer}>
          <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
          <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
        </View>
        <ChevronRight size={18} color="#94a3b8" />
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
        {balance > 0 ? '+' : ''}{balance.toFixed(2)}
      </Text>
    </View>
  );

  const renderMemberItem = (member: string) => (
    <View style={styles.memberItem}>
      <MemberAvatar name={member} size={44} />
      <Text style={styles.memberName} numberOfLines={1}>{member}</Text>
      {group && group.createdBy === member && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminText}>Admin</Text>
        </View>
      )}
    </View>
  );

  // Loading and error states
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
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
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#e2e8f0" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerEmoji}>{group.emoji || '💰'}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleExport}
            activeOpacity={0.7}
          >
            <Download size={22} color="#a78bfa" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowShareModal(true)}
            activeOpacity={0.7}
          >
            <Share2 size={22} color="#e2e8f0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
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
            <DollarSign size={20} color="#a78bfa" />
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>${group.totalExpenses.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <User size={20} color="#a78bfa" />
            <Text style={styles.summaryLabel}>Members</Text>
            <Text style={styles.summaryValue}>{group.members.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <FileText size={20} color="#a78bfa" />
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
                <DollarSign size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySubtitle}>Add your first expense</Text>
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
                <UserPlus size={18} color="#8b5cf6" />
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

        {/* Delete button for settled groups */}
        {isSettled && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteText}>Delete Group</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Expense FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/add-expense/${group.id}`)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#a78bfa', '#7c3aed']}
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

      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <BlurView intensity={30} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowExportModal(false)}
              activeOpacity={0.7}
            >
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Export Data</Text>
            
            <ScrollView style={styles.exportScroll}>
              <Text selectable style={styles.exportText}>
                {exportResult}
              </Text>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => {
                Clipboard.setStringAsync(exportResult);
                Alert.alert('Copied!', 'Data copied to clipboard');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.copyText}>Copy to Clipboard</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.3)',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(71, 85, 105, 0.2)',
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
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#f8fafc',
    maxWidth: '70%',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#94a3b8',
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: '#f87171',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
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
    backgroundColor: 'rgba(71, 85, 105, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  summaryLabel: {
    color: '#94a3b8',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  summaryValue: {
    color: '#f8fafc',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(71, 85, 105, 0.2)',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  activeSegment: {
    position: 'absolute',
    backgroundColor: '#8b5cf6',
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  segmentButtonActive: {
    backgroundColor: '#ede9fe',
  },
  segmentButtonTextActive: {
    color: '#fff',
  },
  tabContent: {
    padding: 16,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(71, 85, 105, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expenseTitle: {
    color: '#f8fafc',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  expenseSubtitle: {
    color: '#94a3b8',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginTop: 4,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  expenseAmount: {
    color: '#f8fafc',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  expenseDate: {
    color: '#94a3b8',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 4,
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
    color: '#f8fafc',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  balancesContainer: {
    gap: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(71, 85, 105, 0.2)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  balanceName: {
    flex: 1,
    color: '#f8fafc',
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginLeft: 12,
  },
  balanceAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
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
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  settledText: {
    color: '#22c55e',
    fontFamily: 'Inter_600SemiBold',
  },
  settleButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  settleButtonText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  addMemberText: {
    color: '#a78bfa',
    fontFamily: 'Inter_600SemiBold',
  },
  membersContainer: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(71, 85, 105, 0.2)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  memberName: {
    flex: 1,
    color: '#f8fafc',
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    marginLeft: 12,
  },
  adminBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  adminText: {
    color: '#a78bfa',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteText: {
    color: '#f87171',
    fontFamily: 'Inter_600SemiBold',
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
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalTitle: {
    color: '#f8fafc',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    color: '#94a3b8',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(71, 85, 105, 0.2)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  cancelText: {
    color: '#f8fafc',
    fontFamily: 'Inter_600SemiBold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
  exportScroll: {
    maxHeight: 200,
    marginBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 8,
    padding: 12,
  },
  exportText: {
    color: '#f8fafc',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  copyButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
});

export default GroupScreen;
    