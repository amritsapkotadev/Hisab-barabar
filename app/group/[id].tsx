import React, { useState, useEffect, useRef } from 'react';
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
  Easing,
  Dimensions,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Plus, DollarSign, Calendar, Share2, Users, CreditCard, ChevronRight, Check, BarChart2, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import ShareGroupModal from '@/components/ShareGroupModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { Group, Expense } from '@/types';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

interface SegmentedControlProps {
  tabs: {
    id: string;
    label: string;
    icon: React.ReactNode;
  }[];
  activeTab: string;
  onTabPress: (id: string) => void;
}

const SegmentedControl = ({ tabs, activeTab, onTabPress }: SegmentedControlProps) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const tabWidth = (width - 32) / tabs.length;

  useEffect(() => {
    const newIndex = tabs.findIndex(tab => tab.id === activeTab);
    Animated.spring(slideAnim, {
      toValue: newIndex * tabWidth,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  return (
    <View style={styles.segmentedControlContainer}>
      <Animated.View style={[styles.activeTabIndicator, { transform: [{ translateX: slideAnim }], width: tabWidth }]} />
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.segmentedTab}
          onPress={() => onTabPress(tab.id)}
        >
          {tab.icon && React.isValidElement(tab.icon) && React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, { color: activeTab === tab.id ? '#fff' : '#9CA3AF' })}
          <Text style={[styles.segmentedTabText, activeTab === tab.id && styles.activeSegmentedTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};


export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  const fetchGroupData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [groupData, expenseData] = await Promise.all([
        apiService.getGroup(id),
        apiService.getGroupExpenses(id),
      ]);
      setGroup(groupData);
      setExpenses(expenseData);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setError('Failed to load group data. Please try again.');
      console.error('Error fetching group data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const getColorForName = (name: string) => {
    const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#78716C'];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const isSettled = group && Object.values(group.balances).every(balance => Math.abs(balance) < 0.01);

  const handleDeleteGroup = async () => {
    if (!group) return;
    setDeleting(true);
    try {
      await apiService.deleteGroup(group.id);
      setShowDeleteModal(false);
      router.replace('/');
    } catch (err: any) {
      setDeleting(false);
      const message = err?.response?.data?.message || 'Failed to delete group.';
      alert(message);
    }
  };

  const handleAddMember = async () => {
    if (!group) return;
    setJoining(true);
    try {
      await apiService.joinGroupById(group.id);
      setShowAddMemberModal(false);
      await fetchGroupData();
      Alert.alert('Success', 'You have joined the group!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join group.');
    } finally {
      setJoining(false);
    }
  };

  const handleExportGroup = async () => {
    setShowAdModal(true);
  };

  const proceedExportGroup = async () => {
    if (!group) return;
    setExporting(true);
    setShowAdModal(false);
    try {
      const groupExpenses = await apiService.getGroupExpenses(group.id);
      let csv = `Group Name,Description,Members,Total Expenses,Created At\n`;
      csv += `"${group.name}","${group.description}","${group.members.join(';')}",${group.totalExpenses},${group.createdAt}\n\n`;
      csv += `Expenses:\nDate,Description,Amount,Paid By,Participants\n`;
      groupExpenses.forEach(exp => {
        csv += `${exp.date},"${exp.description}",${exp.amount},${exp.paidBy},"${exp.participants.join(';')}"\n`;
      });
      csv += `\nBalances:\nMember,Balance\n`;
      Object.entries(group.balances).forEach(([member, balance]) => {
        csv += `"${member}",${balance}\n`;
      });
      const fileName = `hisabkitab-group-${group.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Group Data' });
      } else {
        setExportResult(csv);
        setExportModalVisible(true);
      }
    } catch (err) {
      Alert.alert('Export Failed', 'Could not export group data.');
    } finally {
      setExporting(false);
    }
  };

  const renderExpenseCard = ({ item }: { item: Expense }) => (
    <TouchableOpacity onPress={() => router.push(`/group/${id}/expense/${item.id}`)}>
      <View style={styles.expenseCard}>
        <View style={[styles.expenseAvatar, { backgroundColor: getColorForName(item.paidBy) }]}>
          <Text style={styles.expenseAvatarText}>{getInitials(item.paidBy)}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.expensePaidBy}>Paid by {item.paidBy}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
          <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
        </View>
        <ChevronRight size={18} color="#475569" />
      </View>
    </TouchableOpacity>
  );

  const renderBalanceCard = () => {
    if (!group || !group.balances || Object.keys(group.balances).length === 0) return null;
    const maxBalance = Math.max(...Object.values(group.balances).map(b => Math.abs(Number(b))));

    return (
      <View style={styles.balanceCard}>
        {Object.entries(group.balances).map(([member, balance]) => (
          <View key={member} style={styles.balanceRow}>
            <View style={styles.memberInfo}>
              <View style={[styles.memberAvatarSmall, { backgroundColor: getColorForName(member) }]}>
                <Text style={styles.memberAvatarTextSmall}>{getInitials(member)}</Text>
              </View>
              <Text style={styles.memberName} numberOfLines={1}>{member}</Text>
            </View>
            <View style={styles.balanceVisualization}>
              <Text style={[styles.balanceAmount, balance > 0 ? styles.positiveBalance : balance < 0 ? styles.negativeBalance : styles.neutralBalance]}>
                {balance > 0 ? `+ $${Math.abs(balance).toFixed(2)}` : balance < 0 ? `- $${Math.abs(balance).toFixed(2)}` : '$0.00'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };
  
  const renderMembers = () => {
    if (!group) return null;
    return (
      <View style={styles.membersContainer}>
        {group.members.map((member, idx) => (
          <View key={idx} style={styles.memberCard}>
             <View style={[styles.memberAvatar, { backgroundColor: getColorForName(member) }]}>
                <Text style={styles.memberAvatarText}>{getInitials(member)}</Text>
              </View>
            <Text style={styles.memberNameLarge} numberOfLines={1}>{member}</Text>
            {group.createdBy === member && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorText}>Admin</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  if (loading && !group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Summoning Group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Group not found.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGroupData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const tabs = [
    { id: 'expenses', label: 'Expenses', icon: <DollarSign size={18} /> },
    { id: 'balances', label: 'Balances', icon: <BarChart2 size={18} /> },
    { id: 'members', label: 'Members', icon: <Users size={18} /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#E5E7EB" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
           <Text style={styles.headerEmoji}>{group.emoji || '💰'}</Text>
           <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.headerButton} onPress={handleExportGroup} disabled={exporting}>
            <DollarSign size={22} color={exporting ? '#a3a3a3' : '#A78BFA'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowShareModal(true)}>
            <Share2 size={22} color="#E5E7EB" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={styles.summaryValue}>${group.totalExpenses.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Members</Text>
              <Text style={styles.summaryValue}>{group.members.length}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={styles.summaryValue}>{expenses.length}</Text>
            </View>
          </View>
          
          <SegmentedControl tabs={tabs} activeTab={activeTab} onTabPress={setActiveTab} />
          
          <View style={styles.contentSection}>
            {activeTab === 'expenses' && (
              <>
                {expenses.length > 0 ? (
                  <FlatList
                    data={expenses}
                    renderItem={renderExpenseCard}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <DollarSign size={48} color="#8B5CF6" />
                    <Text style={styles.emptyText}>No expenses yet</Text>
                    <Text style={styles.emptySubtext}>Tap the '+' to add one!</Text>
                  </View>
                )}
              </>
            )}

            {activeTab === 'balances' && (
              <>
                {isSettled ? (
                  <View style={styles.settledBadge}>
                    <Check size={14} color="#22C55E" />
                    <Text style={styles.settledText}>All Settled Up!</Text>
                  </View>
                ) : (
                   renderBalanceCard()
                )}

                {!isSettled && (
                  <TouchableOpacity style={styles.settleButton}>
                    <Text style={styles.settleButtonText}>Settle Balances</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {activeTab === 'members' && (
              <>
                <TouchableOpacity style={styles.addMemberButton} onPress={() => setShowAddMemberModal(true)}>
                  <UserPlus size={16} color="#8B5CF6" />
                  <Text style={styles.addMemberText}>Add Member</Text>
                </TouchableOpacity>
                {renderMembers()}
                <Modal
                  visible={showAddMemberModal}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowAddMemberModal(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Join Group</Text>
                      <Text style={styles.modalMessage}>
                        You will be added as a member to this group. Continue?
                      </Text>
                      <View style={styles.modalActionRow}>
                        <Pressable
                          style={[styles.modalButton, styles.modalCancelButton]}
                          onPress={() => setShowAddMemberModal(false)}
                          disabled={joining}
                        >
                          <Text style={[styles.modalButtonText, styles.modalCancelButtonText]}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.modalButton, styles.modalConfirmButton]}
                          onPress={handleAddMember}
                          disabled={joining}
                        >
                          <Text style={[styles.modalButtonText, styles.modalConfirmButtonText]}>{joining ? 'Joining...' : 'Join'}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Modal>
              </>
            )}
          </View>

          {isSettled && (
            <TouchableOpacity style={styles.deleteGroupButton} onPress={() => setShowDeleteModal(true)}>
              <Text style={styles.deleteGroupButtonText}>Delete Group</Text>
            </TouchableOpacity>
          )}

        </Animated.View>
      </ScrollView>

      {group && (
        <ShareGroupModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          group={{ id: group.id, name: group.name, inviteLink: group.inviteLink }}
        />
      )}

      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action is permanent."
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/add-expense/${group.id}`)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#A78BFA', '#7C3AED']}
          style={styles.fabGradient}
        >
          <Plus size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Export Modal (fallback for web or if sharing is not available) */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Exported CSV</Text>
            <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
              <Text selectable style={{ color: '#F3F4F6', fontSize: 13 }}>{exportResult}</Text>
            </ScrollView>
            <View style={styles.modalActionRow}>
              <Pressable
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={async () => {
                  if (exportResult) await Clipboard.setStringAsync(exportResult);
                  Alert.alert('Copied', 'CSV copied to clipboard!');
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmButtonText]}>Copy CSV</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setExportModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelButtonText]}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ad Required Modal */}
      <Modal
        visible={showAdModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Watch Ad to Export</Text>
            <Text style={styles.modalMessage}>
              You must watch an ad to export this CSV.
            </Text>
            <View style={styles.modalActionRow}>
              <Pressable
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={async () => {
                  setAdLoading(true);
                  setTimeout(() => {
                    setAdLoading(false);
                    proceedExportGroup();
                  }, 2000);
                }}
                disabled={adLoading}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmButtonText]}>{adLoading ? 'Watching...' : 'Watch Ad'}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowAdModal(false)}
                disabled={adLoading}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelButtonText]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#F3F4F6',
    maxWidth: '80%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#F87171',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    margin: 16,
    padding: 16,
  },
  summaryBox: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    color: '#F3F4F6',
    fontFamily: 'Inter_700Bold',
  },
  segmentedControlContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 4,
    height: 50,
    position: 'relative',
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1,
  },
  segmentedTabText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter_600SemiBold',
  },
  activeSegmentedTabText: {
    color: '#FFFFFF',
  },
  activeTabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
  },
  contentSection: {
    padding: 16,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151'
  },
  expenseAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseAvatarText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    color: '#F3F4F6',
    fontFamily: 'Inter_600SemiBold',
  },
  expensePaidBy: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#F3F4F6',
  },
  expenseDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarTextSmall: {
     fontSize: 14,
     color: '#fff',
     fontFamily: 'Inter_600SemiBold',
  },
  memberName: {
    fontSize: 15,
    color: '#F3F4F6',
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  balanceVisualization: {
    flex: 1,
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  positiveBalance: { color: '#22C55E' },
  negativeBalance: { color: '#EF4444' },
  neutralBalance: { color: '#9CA3AF' },
  settledBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
  },
  settledText: {
    color: '#22C55E',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  membersContainer: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  memberNameLarge: {
    fontSize: 16,
    color: '#F3F4F6',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  creatorBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
  },
  creatorText: {
    color: '#A78BFA',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#1F2937',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#F3F4F6',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  deleteGroupButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteGroupButtonText: {
    color: '#F87171',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  settleButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  settleButtonText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  addMemberText: {
    color: '#A78BFA',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#F3F4F6',
  },
  modalMessage: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#374151',
  },
  modalConfirmButton: {
    backgroundColor: '#8B5CF6',
  },
  modalButtonText: {
    fontWeight: '600',
  },
  modalCancelButtonText: {
    color: '#F3F4F6',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
  }
});