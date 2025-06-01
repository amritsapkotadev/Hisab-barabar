import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Image } from 'react-native';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getProfile } from '@/services/profiles';
import { calculateBalances } from '@/services/expenses';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [youAreOwed, setYouAreOwed] = useState(0);

  const primaryColor = useThemeColor('primary');
  const textSecondaryColor = useThemeColor('textSecondary');
  const successColor = useThemeColor('success');
  const errorColor = useThemeColor('error');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await getProfile(user.id);
      setProfile(profileData);

      // For demo purposes, setting static values
      setTotalBalance(1234.56);
      setYouOwe(450.75);
      setYouAreOwed(1685.31);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="heading1">Welcome back</Text>
          <Text style={{ color: textSecondaryColor }}>
            {profile?.display_name || 'Friend'}
          </Text>
        </View>
        <Image
          source={{ uri: profile?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' }}
          style={styles.avatar}
        />
      </View>

      <View style={styles.balanceCards}>
        <Card style={[styles.balanceCard, styles.totalBalanceCard]}>
          <View style={styles.cardHeader}>
            <TrendingUp size={24} color={primaryColor} />
            <Text variant="heading3" style={styles.cardTitle}>Total Balance</Text>
          </View>
          <Text variant="heading2" style={{ color: primaryColor }}>
            ${totalBalance.toFixed(2)}
          </Text>
        </Card>

        <View style={styles.smallCards}>
          <Card style={[styles.balanceCard, styles.smallCard]}>
            <View style={styles.cardHeader}>
              <ArrowUpRight size={24} color={successColor} />
              <Text style={styles.cardTitle}>You are owed</Text>
            </View>
            <Text variant="heading3" style={{ color: successColor }}>
              ${youAreOwed.toFixed(2)}
            </Text>
          </Card>

          <Card style={[styles.balanceCard, styles.smallCard]}>
            <View style={styles.cardHeader}>
              <ArrowDownRight size={24} color={errorColor} />
              <Text style={styles.cardTitle}>You owe</Text>
            </View>
            <Text variant="heading3" style={{ color: errorColor }}>
              ${youOwe.toFixed(2)}
            </Text>
          </Card>
        </View>
      </View>

      {/* Add recent activity and other sections here */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  balanceCards: {
    padding: 16,
  },
  balanceCard: {
    marginBottom: 16,
  },
  totalBalanceCard: {
    padding: 24,
  },
  smallCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallCard: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    marginLeft: 8,
  },
});