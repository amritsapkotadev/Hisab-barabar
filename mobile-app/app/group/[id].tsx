import React, { useState, useEffect, useRef, FC } from 'react';
import { useServerRefresh } from '@/hooks/useServerRefresh';
import { refreshServerData } from '@/services/dataClient';
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
  Modal,
  Pressable,
  Platform,
  TextInput,
  PanResponder,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Share2,
  Users,
  ChevronRight,
  Check,
  BarChart2,
  UserPlus,
  Download,
  X,
  Settings,
  Trash2,
} from 'lucide-react-native';
import { apiService } from '@/services/api';
import ShareGroupModal from '@/components/ShareGroupModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { Group, Expense, GroupMember } from '@/types';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const { height: WINDOW_HEIGHT } = Dimensions.get('window');

import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useToast } from '@/components/Toast';

type TabType = { id: string; label: string; icon: React.ReactElement<any, any> };

const RupeeIcon: FC<{ size?: number; color?: string }> = ({ size = 24, color }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text
      style={{
        fontSize: size * 0.85,
        lineHeight: size,
        color,
        fontWeight: '700',
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
        transform: [{ translateX: size * 0.24 }, { translateY: size * 0.1 }],
      }}
    >
      रु
    </Text>
  </View>
);

interface SegmentedControlProps {
  tabs: TabType[];
  activeTab: string;
  onTabPress: (id: string) => void;
}

const SegmentedControl: FC<SegmentedControlProps> = ({ tabs, activeTab, onTabPress }) => {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
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
              color: activeTab === tab.id ? COLORS.actionText : COLORS.muted
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

const MemberAvatar = ({ member, size = 40 }: { member: GroupMember; size?: number }) => {
  const [failed, setFailed] = useState(false);
  const initials = member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#EF4444'];
  const colorIndex = member.name.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];
  const picture = member.picture;

  // Profile picture when there is one; initials otherwise (also if the image fails to load).
  if (picture && !failed) {
    return (
      <Image
        source={{ uri: picture }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setFailed(true)}
      />
    );
  }

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
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
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
  const [showMemberSheet, setShowMemberSheet] = useState(false);
  const [memberDetail, setMemberDetail] = useState<GroupMember | null>(null);
  const [exportResult, setExportResult] = useState('');
  const [addMemberPhone, setAddMemberPhone] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Resolve a member by their stable group-scoped id from the group's members array.
  const getMemberById = (memberId: string): GroupMember | undefined => {
    return group?.members.find(m => m.id === memberId);
  };

  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const maxLift = Math.round(WINDOW_HEIGHT * 0.2); // how far up it can be dragged

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        // allow only upward drag (negative dy) up to -maxLift
        const clamped = Math.max(-maxLift, Math.min(0, gesture.dy));
        sheetTranslateY.setValue(clamped);
      },
      onPanResponderRelease: () => {
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
        }).start();
      }
    })
  ).current;

  const fetchGroupData = async () => {
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
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setError('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  useServerRefresh(fetchGroupData, id);

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
    await refreshServerData(false);
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
      toast.success(res.message);
      router.replace('/(tabs)/groups');
    } catch (err: string | any) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleDeleteMember = async (): Promise<void> => {
    if (!group || !selectedMember) return;
    try {
      const res = await apiService.removeGroupMember(group.id, selectedMember);
      await fetchGroupData();
      setShowDeleteMemberModal(false);
      toast.success(res.message);
    } catch (err: string | any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleAddMember = async (): Promise<void> => {
    if (!group) return;
    const normalized = addMemberPhone.replace(/\D/g, '');
    if (!normalized || normalized.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    try {
      setAddingMember(true);
      await apiService.addMemberByPhone(group.id, normalized);
      await fetchGroupData();
      setShowAddMemberModal(false);
      setAddMemberPhone('');
      toast.success('Member added to the group');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
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
      toast.error('Failed to export data');
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
        <View style={styles.expenseTop}>
          <Text style={styles.expenseTitle} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.expenseAmount}>रु {item.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.expenseMeta}>
          {group && item.paidBy ? (
            <>
              <MemberAvatar member={getMemberById(item.paidBy) || { id: item.paidBy, name: item.paidBy }} size={20} />
              <Text style={styles.expenseSubtitle} numberOfLines={1}>Paid by {getMemberById(item.paidBy)?.name || item.paidBy}</Text>
            </>
          ) : (
            <>
              <MemberAvatar member={{ id: item.paidBy, name: item.paidBy }} size={20} />
              <Text style={styles.expenseSubtitle} numberOfLines={1}>Paid by {item.paidBy}</Text>
            </>
          )}
          <Text style={styles.expenseDate}>·</Text>
          <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBalanceItem = ({ memberId, balance }: { memberId: string; balance: number }) => {
    const member = group?.members.find(m => m.id === memberId) || { id: memberId, name: memberId };
    return (
      <View style={styles.balanceItem}>
        <MemberAvatar member={member} size={36} />
        <Text style={styles.balanceName} numberOfLines={1}>{member.name}</Text>
        <Text style={[
          styles.balanceAmount,
          balance > 0 ? styles.positiveBalance :
            balance < 0 ? styles.negativeBalance :
              styles.neutralBalance
        ]}>
        रु {Math.abs(balance).toFixed(2)}
      </Text>
    </View>
    );
  };

  const renderMemberItem = (member: GroupMember) => (
    <View style={styles.memberItem}>
      <MemberAvatar member={member} size={36} />
      <View style={styles.memberInfo}>
        <Text
          style={styles.memberName}
          numberOfLines={1}
          onPress={() => {
            setSelectedMember(member.id);
            setMemberDetail(member);
            setShowMemberSheet(true);
          }}
        >
          {member.name}
        </Text>
      </View>
      {(group && member.userId && group.createdBy === member.userId) && (
        <Text style={styles.adminText}>Group Admin</Text>
      )}
      {(group && !(member.userId && group.createdBy === member.userId)) && (
        <TouchableOpacity
          onPress={() => {
            setSelectedMember(member.id);
            setShowDeleteMemberModal(true);
          }}
          style={styles.deleteMemberButton}
        >
          <Trash2 size={20} color={COLORS.negative} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.action} />
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
    { id: 'expenses', label: 'Expenses', icon: <RupeeIcon /> },
    { id: 'balances', label: 'Balances', icon: <BarChart2 /> },
    { id: 'members', label: 'Members', icon: <Users /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
         accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerEmoji}>{group.emoji || '💰'}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Group settings"
        >
          <Settings size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.action}
            colors={[COLORS.action]}
          />
        }
      >
        {/* Segmented Control */}
        <SegmentedControl
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          <View style={styles.tabSummary}>
            <Text style={styles.tabSummaryText}>
              {activeTab === 'expenses'
                ? `${expenses.length} ${expenses.length === 1 ? 'expense' : 'expenses'}`
                : `${group.members.length} ${group.members.length === 1 ? 'member' : 'members'}`}
            </Text>
            {activeTab === 'expenses' && (
              <Text style={styles.tabSummaryTotal}>Total रु {group.totalExpenses.toFixed(2)}</Text>
            )}
            {activeTab === 'balances' && (
              <Text style={[styles.tabSummaryTotal, { color: isSettled ? COLORS.positive : COLORS.warning }]}>
                {isSettled ? 'Settled' : 'Unsettled'}
              </Text>
            )}
            {activeTab === 'members' && (
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() => setShowAddMemberModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Add member"
              >
                <UserPlus size={18} color={COLORS.action} />
              </TouchableOpacity>
            )}
          </View>

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
                <RupeeIcon size={48} color={COLORS.textTertiary} />
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
                      {renderBalanceItem({ memberId: member, balance })}
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
            <View style={styles.membersContainer}>
              {group.members.map(member => (
                <View key={member.id}>
                  {renderMemberItem(member)}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Expense FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/add-expense-advanced', params: { groupId: group.id } })}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <View style={styles.fabGradient}>
          <Plus size={28} color={COLORS.actionText} />
        </View>
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
        message="Are you sure you want to delete this group?"
      />

      <DeleteConfirmationModal
        visible={showDeleteMemberModal}
        onClose={() => setShowDeleteMemberModal(false)}
        onConfirm={handleDeleteMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${group?.members.find(m => m.id === selectedMember)?.name || selectedMember} from the group?`}
      />

      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <BlurView intensity={30} style={styles.modalContainer}>
          <View style={styles.modalContent}>

            <Text style={styles.modalTitle}>Add Member</Text>
            <View style={{ width: '100%', marginTop: 8, marginBottom: 8 }}>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
                autoFocus
                value={addMemberPhone}
                onChangeText={(t) => setAddMemberPhone(t.replace(/[^0-9+]/g, ''))}
                maxLength={10}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddMemberModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  ((addMemberPhone.replace(/\D/g, '').length < 10 || addingMember)) && { opacity: 0.6 }
                ]}
                onPress={handleAddMember}
                activeOpacity={0.7}
                disabled={addingMember || addMemberPhone.replace(/\D/g, '').length < 10}
              >
                <Text style={styles.confirmText}>{addingMember ? 'Adding...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Member Detail Bottom Sheet */}
      <Modal
        visible={showMemberSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberSheet(false)}
      >
        <Pressable style={styles.sheetBackdrop}>
          <Animated.View style={[
            styles.sheetContainer,
            { transform: [{ translateY: sheetTranslateY }] }
          ]} {...panResponder.panHandlers}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity
              style={styles.sheetCloseButton}
              onPress={() => setShowMemberSheet(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close member details"
            >
              <X size={20} color={COLORS.muted} />
            </TouchableOpacity>
            <View style={styles.memberHeader}>
              <View style={styles.memberAvatarWrapper}>
                <MemberAvatar member={memberDetail || { id: selectedMember || '', name: selectedMember || '' }} size={64} />
              </View>
              <Text style={styles.memberDetailName}>{memberDetail?.name || selectedMember}</Text>
            </View>

            {memberDetail?.userId ? (
              <View style={styles.memberInfoBlock}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>Registered member</Text>
                </View>
              </View>
            ) : (
              <View style={styles.memberInfoBlock}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>Guest member</Text>
                </View>
              </View>
            )}
            <View style={{ height: 12 }} />
          </Animated.View>
        </Pressable>
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
                <View style={styles.modalHeaderSide} />
                <Text style={[styles.modalTitle, styles.settingsTitle]}>Group Settings</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowSettings(false)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close group settings"
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
                  <Share2 size={20} color={COLORS.action} />
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
                  <Download size={20} color={COLORS.action} />
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

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSecondary,
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
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 999,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    maxWidth: '70%',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  tabSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tabSummaryText: {
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Inter-Medium',
  },
  tabSummaryTotal: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeSegment: {
    position: 'absolute',
    backgroundColor: COLORS.action,
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
    color: COLORS.actionText,
    fontWeight: '700',
  },
  tabContent: {
    padding: 16,
  },
  expenseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  expenseTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expenseSubtitle: {
    flexShrink: 1,
    color: COLORS.muted,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  expenseDate: {
    color: COLORS.muted,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  expenseAmount: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
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
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
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
    fontFamily: 'Inter-Medium',
    fontSize: 14,
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
    backgroundColor: `${COLORS.positive}18`,
    padding: 16,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: `${COLORS.positive}40`,
    marginBottom: 16,
  },
  settledText: {
    color: COLORS.positive,
    fontWeight: '600',
    fontSize: 15,
  },
  settleButton: {
    backgroundColor: COLORS.action,
    padding: 18,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  settleButtonText: {
    color: COLORS.actionText,
    fontWeight: '700',
    fontSize: 16,
  },
  addMemberButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  membersContainer: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 16,
  },
  adminText: {
    color: COLORS.action,
    fontWeight: '500',
    fontSize: 14,
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.action,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
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
    backgroundColor: COLORS.overlay,
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
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 20,
  },
  modalHeaderSide: {
    width: 40,
    height: 40,
  },
  settingsTitle: {
    flex: 1,
    marginBottom: 0,
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
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  cancelText: {
    color: COLORS.muted,
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: COLORS.action,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  confirmText: {
    color: COLORS.actionText,
    fontWeight: '700',
    fontSize: 14,
  },
  settingsBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
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
    backgroundColor: COLORS.action,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryText: {
    color: COLORS.actionText,
    fontWeight: '600',
    fontSize: 16,
  },
  deleteMemberButton: {
    padding: 8,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceSecondary,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  sheetContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    minHeight: Math.round(WINDOW_HEIGHT * 0.5),
    maxHeight: Math.round(WINDOW_HEIGHT * 0.85),
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 56,
    height: 6,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },
  sheetCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 20,
  },
  memberHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberAvatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  memberAvatarGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 999,
    opacity: 0.25,
  },
  memberDetailName: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 20,
    marginTop: 10,
  },
  memberInfoBlock: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSecondary,
  },
  infoText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  smallIconButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  skeletonContainer: {
    gap: 10,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    width: '80%',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  iconButtonText: {
    color: COLORS.action,
    fontWeight: '700',
    fontSize: 14,
  },
  primaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.action,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  primaryPillText: {
    color: COLORS.actionText,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default GroupScreen;