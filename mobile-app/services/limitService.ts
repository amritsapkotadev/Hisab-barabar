import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyLimits {
  transactions: number;
  groups: number;
  date: string;
}

interface AdRewards {
  transactionBonus: number;
  groupBonus: number;
  date: string;
}

const DAILY_TRANSACTION_LIMIT = 5;
const DAILY_GROUP_LIMIT = 3;
const AD_TRANSACTION_BONUS = 5;
const AD_GROUP_BONUS = 1;

export const limitService = {
  // Get today's date string
  getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  },

  // Get current daily limits
  async getDailyLimits(): Promise<DailyLimits> {
    try {
      const stored = await AsyncStorage.getItem('dailyLimits');
      const today = this.getTodayString();
      
      if (stored) {
        const limits = JSON.parse(stored);
        if (limits.date === today) {
          return limits;
        }
      }
      
      // Reset for new day
      const newLimits: DailyLimits = {
        transactions: 0,
        groups: 0,
        date: today,
      };
      
      await AsyncStorage.setItem('dailyLimits', JSON.stringify(newLimits));
      return newLimits;
    } catch (error) {
      console.error('Error getting daily limits:', error);
      return {
        transactions: 0,
        groups: 0,
        date: this.getTodayString(),
      };
    }
  },

  // Get ad rewards for today
  async getAdRewards(): Promise<AdRewards> {
    try {
      const stored = await AsyncStorage.getItem('adRewards');
      const today = this.getTodayString();
      
      if (stored) {
        const rewards = JSON.parse(stored);
        if (rewards.date === today) {
          return rewards;
        }
      }
      
      // Reset for new day
      const newRewards: AdRewards = {
        transactionBonus: 0,
        groupBonus: 0,
        date: today,
      };
      
      await AsyncStorage.setItem('adRewards', JSON.stringify(newRewards));
      return newRewards;
    } catch (error) {
      console.error('Error getting ad rewards:', error);
      return {
        transactionBonus: 0,
        groupBonus: 0,
        date: this.getTodayString(),
      };
    }
  },

  // Check if user can add a transaction
  async canAddTransaction(): Promise<{ canAdd: boolean; remaining: number; needsAd: boolean }> {
    const limits = await this.getDailyLimits();
    const rewards = await this.getAdRewards();
    
    const totalAllowed = DAILY_TRANSACTION_LIMIT + rewards.transactionBonus;
    const remaining = totalAllowed - limits.transactions;
    
    return {
      canAdd: remaining > 0,
      remaining: Math.max(0, remaining),
      needsAd: remaining <= 0 && rewards.transactionBonus < AD_TRANSACTION_BONUS * 3, // Max 3 ad bonuses per day
    };
  },

  // Check if user can create a group
  async canCreateGroup(): Promise<{ canAdd: boolean; remaining: number; needsAd: boolean }> {
    const limits = await this.getDailyLimits();
    const rewards = await this.getAdRewards();
    
    const totalAllowed = DAILY_GROUP_LIMIT + rewards.groupBonus;
    const remaining = totalAllowed - limits.groups;
    
    return {
      canAdd: remaining > 0,
      remaining: Math.max(0, remaining),
      needsAd: remaining <= 0 && rewards.groupBonus < AD_GROUP_BONUS * 2, // Max 2 ad bonuses per day
    };
  },

  // Increment transaction count
  async incrementTransactions(): Promise<void> {
    try {
      const limits = await this.getDailyLimits();
      limits.transactions += 1;
      await AsyncStorage.setItem('dailyLimits', JSON.stringify(limits));
    } catch (error) {
      console.error('Error incrementing transactions:', error);
    }
  },

  // Increment group count
  async incrementGroups(): Promise<void> {
    try {
      const limits = await this.getDailyLimits();
      limits.groups += 1;
      await AsyncStorage.setItem('dailyLimits', JSON.stringify(limits));
    } catch (error) {
      console.error('Error incrementing groups:', error);
    }
  },

  // Add transaction bonus from ad
  async addTransactionBonus(): Promise<void> {
    try {
      const rewards = await this.getAdRewards();
      rewards.transactionBonus += AD_TRANSACTION_BONUS;
      await AsyncStorage.setItem('adRewards', JSON.stringify(rewards));
    } catch (error) {
      console.error('Error adding transaction bonus:', error);
    }
  },

  // Add group bonus from ad
  async addGroupBonus(): Promise<void> {
    try {
      const rewards = await this.getAdRewards();
      rewards.groupBonus += AD_GROUP_BONUS;
      await AsyncStorage.setItem('adRewards', JSON.stringify(rewards));
    } catch (error) {
      console.error('Error adding group bonus:', error);
    }
  },

  // Get usage stats for display
  async getUsageStats(): Promise<{
    transactions: { used: number; total: number };
    groups: { used: number; total: number };
  }> {
    const limits = await this.getDailyLimits();
    const rewards = await this.getAdRewards();
    
    return {
      transactions: {
        used: limits.transactions,
        total: DAILY_TRANSACTION_LIMIT + rewards.transactionBonus,
      },
      groups: {
        used: limits.groups,
        total: DAILY_GROUP_LIMIT + rewards.groupBonus,
      },
    };
  },

  // Reset all limits (for testing)
  async resetLimits(): Promise<void> {
    try {
      await AsyncStorage.removeItem('dailyLimits');
      await AsyncStorage.removeItem('adRewards');
    } catch (error) {
      console.error('Error resetting limits:', error);
    }
  },
};