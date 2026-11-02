import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { GroupMember } from '@/types';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface SettlementsData {
  balances: { [key: string]: number };
  settlements: Settlement[];
  totalUnsettled: number;
  isSettled: boolean;
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
}

// Profile picture when there is one, initials otherwise (also if the image fails to load).
function Avatar({ name, picture, tone, style }: { name: string; picture?: string; tone?: string; style?: object }) {
  const { styles } = useThemedStyles(createStyles);
  const [failed, setFailed] = useState(false);
  const showPicture = !!picture && !failed;

  return (
    <View style={[styles.avatar, tone ? { backgroundColor: `${tone}14` } : null, style]}>
      {showPicture ? (
        <Image source={{ uri: picture }} style={styles.avatarImage} onError={() => setFailed(true)} />
      ) : (
        <Text style={[styles.avatarText, tone ? { color: tone } : null]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

export default function SettleUpScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [settlementsData, setSettlementsData] = useState<SettlementsData | null>(null);
  const [membersById, setMembersById] = useState<Record<string, GroupMember>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SettleUpScreen mounted with groupId:', groupId);
    fetchSettlements();
  }, [groupId]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, group] = await Promise.all([
        apiService.getGroupSettlements(groupId),
        apiService.getGroup(groupId),
      ]);
      setSettlementsData(data);
      const map: Record<string, GroupMember> = {};
      group?.members.forEach((member) => {
        map[member.id] = member;
      });
      setMembersById(map);
    } catch (err: any) {
      console.error('Error fetching settlements:', err);
      setError(err.message || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={22} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Settle Up</Text>
    </View>
  );

  const renderBalanceItem = ({ memberId, balance }: { memberId: string; balance: number }) => {
    const isPositive = balance > 0.01;
    const isNegative = balance < -0.01;
    const tone = isPositive ? COLORS.positive : isNegative ? COLORS.negative : COLORS.muted;
    const member = membersById[memberId];
    const name = member?.name || memberId;

    return (
      <View style={styles.balanceCard}>
        <Avatar name={name} picture={member?.picture} tone={tone} />
        <View style={styles.balanceInfo}>
          <Text style={styles.memberName} numberOfLines={1}>{name}</Text>
          <Text style={styles.balanceDescription}>
            {isPositive ? 'Gets back' : isNegative ? 'Owes' : 'All settled'}
          </Text>
        </View>
        <Text style={[styles.balanceAmount, { color: tone }]}>
          रु {Math.abs(balance).toFixed(2)}
        </Text>
      </View>
    );
  };

  const renderSettlementItem = (item: Settlement) => (
    <View style={styles.settlementCard}>
      <Text style={styles.settlementText}>
        <Text style={styles.settlementName}>{membersById[item.from]?.name || item.from}</Text>
        {' pays '}
        <Text style={styles.settlementName}>{membersById[item.to]?.name || item.to}</Text>
      </Text>
      <Text style={styles.settlementAmount}>रु {item.amount.toFixed(2)}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.action} />
          <Text style={styles.loadingText}>Calculating settlements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={COLORS.negative} />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSettlements}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!settlementsData) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>No settlement data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { balances, settlements, totalUnsettled, isSettled } = settlementsData;
  const statusColor = isSettled ? COLORS.positive : COLORS.warning;

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Unsettled</Text>
          <Text style={styles.summaryAmount}>रु {totalUnsettled.toFixed(2)}</Text>

          <View style={styles.summaryFooter}>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}1A` }]}>
              {isSettled ? (
                <CheckCircle size={14} color={statusColor} />
              ) : (
                <AlertCircle size={14} color={statusColor} />
              )}
              <Text style={[styles.statusText, { color: statusColor }]}>
                {isSettled ? 'All settled' : 'Unsettled'}
              </Text>
            </View>
            <Text style={styles.summaryMeta}>
              {settlements.length} {settlements.length === 1 ? 'payment' : 'payments'} needed
            </Text>
          </View>
        </View>

        {/* Individual Balances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Balances</Text>
          <View style={styles.listContainer}>
            {Object.entries(balances).map(([member, balance]) => (
              <View key={member}>
                  {renderBalanceItem({ memberId: member, balance })}
              </View>
            ))}
          </View>
        </View>

        {/* Settlement Instructions */}
        {!isSettled && settlements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settlement Instructions</Text>
            <Text style={styles.instructionsText}>
              Follow these payments to settle up the group.
            </Text>

            <View style={styles.listContainer}>
              {settlements.map((item, index) => (
                <View key={`${item.from}-${item.to}-${index}`}>
                  {renderSettlementItem(item)}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* All Settled Message */}
        {isSettled && (
          <View style={styles.settledCard}>
            <CheckCircle size={40} color={COLORS.positive} />
            <Text style={styles.settledTitle}>All Settled Up!</Text>
            <Text style={styles.settledMessage}>
              Everyone's balances are zero. No payments needed.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Medium',
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
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    lineHeight: 40,
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignSelf: 'stretch',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  summaryMeta: {
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Inter-Medium',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: 'Inter-ExtraBold',
  },
  listContainer: {
    gap: 12,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  balanceInfo: {
    flex: 1,
    marginRight: 12,
  },
  memberName: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  balanceDescription: {
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Inter-Regular',
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: -8,
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  settlementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settlementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
    fontFamily: 'Inter-Regular',
  },
  settlementName: {
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  settlementAmount: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  settledCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settledTitle: {
    fontSize: 20,
    color: COLORS.positive,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  settledMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});