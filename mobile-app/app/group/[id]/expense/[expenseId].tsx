import React, { useEffect, useState } from 'react';
import { useServerRefresh } from '@/hooks/useServerRefresh';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Calendar, User, Edit3, Users, PieChart, AlertCircle } from 'lucide-react-native';
import { Expense, GroupMember } from '@/types';
import { apiService } from '@/services/api';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

const Avatar = ({ name, picture, isPayer = false }: { name: string; picture?: string; isPayer?: boolean }) => {
  const { styles } = useThemedStyles(createStyles);
  const [failedPicture, setFailedPicture] = useState<string | null>(null);
  return (
    <View style={[styles.avatar, isPayer && styles.payerAvatar]}>
      {picture && picture !== failedPicture ? (
        <Image
          source={{ uri: picture }}
          style={styles.avatarImage}
          onError={() => setFailedPicture(picture)}
          accessibilityLabel={`${name}'s profile picture`}
        />
      ) : (
        <Text style={[styles.avatarText, isPayer && styles.payerAvatarText]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

export default function ExpenseDetailsScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { id, expenseId } = useLocalSearchParams<{ id: string; expenseId: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [membersById, setMembersById] = useState<Record<string, GroupMember>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const getMemberName = (memberId: string): string => {
    return membersById[memberId]?.name || memberId;
  };

  const fetchExpense = async () => {
      try {
        setError(null);
        const [found, group] = await Promise.all([
          apiService.getExpenseById(expenseId),
          apiService.getGroup(id),
        ]);
        setExpense(found || null);
        const map: Record<string, GroupMember> = {};
        group?.members.forEach((member) => {
          map[member.id] = member;
        });
        setMembersById(map);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } catch (err) {
        setError('Failed to load expense details.');
      } finally {
        setLoading(false);
      }
  };
  useServerRefresh(fetchExpense, `${id}:${expenseId}`);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expense Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.action} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !expense) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expense Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={COLORS.negative} />
          <Text style={styles.errorText}>{error || 'Expense not found.'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              setExpense(null);
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Expense Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Expense Card */}
          <View style={styles.expenseCard}>
            <View style={styles.expenseHeader}>
              <View style={styles.amountContainer}>
                <Text style={styles.currency}>रु</Text>
                <Text style={styles.amount}>{expense.amount.toFixed(2)}</Text>
              </View>
              <Text style={styles.description} numberOfLines={2}>{expense.description}</Text>
            </View>

            {/* Expense Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <User size={16} color={COLORS.text} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Paid by</Text>
                  <View style={styles.paidByContainer}>
                    <Avatar name={getMemberName(expense.paidBy)} picture={membersById[expense.paidBy]?.picture} isPayer />
                    <Text style={styles.detailValue}>{getMemberName(expense.paidBy)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Calendar size={16} color={COLORS.text} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(expense.date)}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { marginBottom: 0 }]}>
                <View style={styles.detailIcon}>
                  <Users size={16} color={COLORS.text} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Split between</Text>
                  <View style={styles.participantsContainer}>
                    {expense.participants.slice(0, 3).map((participant) => (
                      <Avatar key={participant} name={getMemberName(participant)} picture={membersById[participant]?.picture} />
                    ))}
                    {expense.participants.length > 3 && (
                      <View style={styles.moreParticipants}>
                        <Text style={styles.moreParticipantsText}>
                          +{expense.participants.length - 3}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Breakdown Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <PieChart size={18} color={COLORS.text} />
              <Text style={styles.sectionTitle}>Breakdown</Text>
            </View>
            <View style={styles.breakdownContainer}>
              {expense.participants.map((participant, index) => (
                <View
                  key={participant}
                  style={[
                    styles.breakdownRow,
                    index === expense.participants.length - 1 && styles.breakdownRowLast,
                  ]}
                >
                  <View style={styles.breakdownLeft}>
                    <Avatar name={getMemberName(participant)} picture={membersById[participant]?.picture} isPayer={participant === expense.paidBy} />
                    <Text style={styles.breakdownName} numberOfLines={1}>
                      {getMemberName(participant)}
                      {participant === expense.paidBy && (
                        <Text style={styles.payerBadge}> (paid)</Text>
                      )}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.breakdownAmount,
                      participant === expense.paidBy
                        ? styles.positiveAmount
                        : styles.negativeAmount,
                    ]}
                  >
                    {participant === expense.paidBy
                      ? `-रु ${(expense.amount - expense.amount / expense.participants.length).toFixed(2)}`
                      : `रु ${(expense.amount / expense.participants.length).toFixed(2)}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push({
          pathname: '/add-expense/[groupId]',
          params: {
            groupId: id,
            edit: 'true',
            expenseId: expense.id,
            description: expense.description,
            amount: expense.amount.toString(),
            paidBy: expense.paidBy,
            participants: JSON.stringify(expense.participants),
            date: expense.date,
            revision: expense.revision,
          }
        })}
        activeOpacity={0.85}
      >
        <Edit3 size={18} color={COLORS.actionText} />
        <Text style={styles.editButtonText}>Edit Expense</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.action,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryButtonText: {
    color: COLORS.actionText,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  expenseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    margin: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  expenseHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  currency: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Bold',
    marginTop: 6,
    marginRight: 2,
  },
  amount: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    lineHeight: 48,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  paidByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 30,
    height: 30,
    flexShrink: 0,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  payerAvatar: {
    backgroundColor: COLORS.action,
    borderColor: COLORS.action,
  },
  avatarImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  payerAvatarText: {
    color: COLORS.actionText,
  },
  moreParticipants: {
    width: 30,
    height: 30,
    flexShrink: 0,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moreParticipantsText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Bold',
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  breakdownContainer: {
    marginTop: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  breakdownRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  breakdownName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
    flexShrink: 1,
  },
  payerBadge: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    flexShrink: 0,
  },
  positiveAmount: {
    color: COLORS.positive,
  },
  negativeAmount: {
    color: COLORS.negative,
  },
  editButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: COLORS.action,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  editButtonText: {
    color: COLORS.actionText,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
