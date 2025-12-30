import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, DollarSign, Users, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';

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
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
}

export default function SettleUpScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [settlementsData, setSettlementsData] = useState<SettlementsData | null>(null);
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
      const data = await apiService.getGroupSettlements(groupId);
      setSettlementsData(data);
    } catch (err: any) {
      console.error('Error fetching settlements:', err);
      setError(err.message || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const renderBalanceItem = ({ member, balance }: { member: string; balance: number }) => {
    const isPositive = balance > 0;
    const isNegative = balance < 0;
    const isZero = Math.abs(balance) < 0.01;

    return (
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(member)}</Text>
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.memberName}>{member}</Text>
            <View style={styles.balanceStatus}>
              {isPositive && <TrendingUp size={16} color="#10b981" />}
              {isNegative && <TrendingDown size={16} color="#ef4444" />}
              {isZero && <CheckCircle size={16} color="#6b7280" />}
              <Text style={[
                styles.balanceAmount,
                isPositive && styles.positiveAmount,
                isNegative && styles.negativeAmount,
                isZero && styles.zeroAmount
              ]}>
                {isPositive ? `+₹${balance.toFixed(2)}` : 
                 isNegative ? `-₹${Math.abs(balance).toFixed(2)}` : 
                 '₹0.00'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.balanceDescription}>
          {isPositive ? 'Gets back' : 
           isNegative ? 'Owes' : 
           'All settled'}
        </Text>
      </View>
    );
  };

  const renderSettlementItem = ({ item }: { item: Settlement }) => (
    <View style={styles.settlementCard}>
      <View style={styles.settlementHeader}>
        <View style={styles.settlementFrom}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.from)}</Text>
          </View>
          <Text style={styles.settlementName}>{item.from}</Text>
        </View>
        
        <View style={styles.settlementArrow}>
          <DollarSign size={20} color="#7c3aed" />
          <Text style={styles.settlementAmount}>₹{item.amount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.settlementTo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.to)}</Text>
          </View>
          <Text style={styles.settlementName}>{item.to}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#4f46e5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settle Up</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Calculating settlements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#4f46e5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settle Up</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#ef4444" />
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#4f46e5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settle Up</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>No settlement data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { balances, settlements, totalUnsettled, isSettled } = settlementsData;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#f8fafc', '#f1f5f9']} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settle Up</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Users size={24} color="#7c3aed" />
            <Text style={styles.summaryTitle}>Settlement Summary</Text>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Unsettled</Text>
              <Text style={styles.statValue}>₹{totalUnsettled.toFixed(2)}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Transactions Needed</Text>
              <Text style={styles.statValue}>{settlements.length}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Status</Text>
              <View style={styles.statusContainer}>
                {isSettled ? (
                  <>
                    <CheckCircle size={16} color="#10b981" />
                    <Text style={[styles.statusText, styles.settledText]}>All Settled</Text>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} color="#f59e0b" />
                    <Text style={[styles.statusText, styles.unsettledText]}>Unsettled</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Individual Balances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Balances</Text>
          <View style={styles.balancesContainer}>
            {Object.entries(balances).map(([member, balance]) => (
              <View key={member}>
                {renderBalanceItem({ member, balance })}
              </View>
            ))}
          </View>
        </View>

        {/* Settlement Instructions */}
        {!isSettled && settlements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settlement Instructions</Text>
            <Text style={styles.instructionsText}>
              Follow these transactions to settle up the group:
            </Text>
            
            <FlatList
              data={settlements}
              renderItem={renderSettlementItem}
              keyExtractor={(item, index) => `${item.from}-${item.to}-${index}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        )}

        {/* All Settled Message */}
        {isSettled && (
          <View style={styles.settledCard}>
            <CheckCircle size={48} color="#10b981" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
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
    color: '#64748b',
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
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Medium',
  },
  retryButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
    fontFamily: 'Inter-Bold',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: 'Inter-Bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  settledText: {
    color: '#10b981',
  },
  unsettledText: {
    color: '#f59e0b',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  balancesContainer: {
    gap: 12,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  balanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: 'Inter-Bold',
  },
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  zeroAmount: {
    color: '#6b7280',
  },
  balanceDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Inter-Regular',
  },
  instructionsText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
    fontFamily: 'Inter-Medium',
  },
  settlementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  settlementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settlementFrom: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settlementTo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  settlementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'Inter-SemiBold',
  },
  settlementArrow: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7c3aed',
    marginTop: 4,
    fontFamily: 'Inter-Bold',
  },
  separator: {
    height: 12,
  },
  settledCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  settledTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  settledMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
}); 