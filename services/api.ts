import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group, Expense, User } from '@/types';
import { GoogleUser } from './googleAuth';

// API Configuration - Use environment variable or fallback to Railway domain
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://hisab-barabar.up.railway.app';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token storage
let authToken: string | null = null;

// Initialize auth token from storage
const initializeAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      authToken = token;
      console.log('Auth token initialized from storage');
    }
  } catch (error) {
    console.error('Error loading auth token:', error);
  }
};

// Initialize on module load
initializeAuthToken();

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    console.log(`Making API request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.data || error.message);
    console.error('API Error Status:', error.response?.status);
    console.error('API Error URL:', error.config?.url);

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      authToken = null;
      await AsyncStorage.removeItem('authToken');
      // Optionally handle redirect to login in your app's auth flow
    }

    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Authentication
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      console.log('Attempting login with:', { email });
      const response = await api.post('/users/login', { email, password });
      console.log('Login response:', response.data);

      const { token, user } = response.data;
      authToken = token;
      await AsyncStorage.setItem('authToken', token);
      return { token, user };
    } catch (error: any) {
      console.error('Login API call failed:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      console.log('Attempting registration with:', { name, email });
      const response = await api.post('/users/register', { name, email, password });
      console.log('Registration response:', response.data);

      const { token, user } = response.data;
      authToken = token;
      await AsyncStorage.setItem('authToken', token);
      return { token, user };
    } catch (error: any) {
      console.error('Registration API call failed:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Google Authentication
  async loginWithGoogle(googleUser: GoogleUser): Promise<{ token: string; user: User }> {
    try {
      console.log('Attempting Google login with:', { email: googleUser.email });
      const response = await api.post('/users/google-login', {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      });
      console.log('Google login response:', response.data);

      const { token, user } = response.data;
      authToken = token;
      await AsyncStorage.setItem('authToken', token);
      return { token, user };
    } catch (error: any) {
      console.error('Google login API call failed:', error);
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
  },

  async registerWithGoogle(googleUser: GoogleUser): Promise<{ token: string; user: User }> {
    try {
      console.log('Attempting Google registration with:', { email: googleUser.email });
      const response = await api.post('/users/google-register', {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      });
      console.log('Google registration response:', response.data);

      const { token, user } = response.data;
      authToken = token;
      await AsyncStorage.setItem('authToken', token);
      return { token, user };
    } catch (error: any) {
      console.error('Google registration API call failed:', error);
      throw new Error(error.response?.data?.message || 'Google registration failed');
    }
  },

  // User profile
  async getUserProfile(): Promise<User> {
    try {
      console.log('Fetching user profile...');
      const response = await api.get('/users/profile');
      console.log('Profile response:', response.data);
      return response.data.user;
    } catch (error) {
      console.error('Get profile API call failed:', error);
      throw error;
    }
  },

  async setAuthToken(token: string) {
    authToken = token;
    await AsyncStorage.setItem('authToken', token);
    console.log('Auth token set and stored');
  },

  async clearAuthToken() {
    authToken = null;
    await AsyncStorage.removeItem('authToken');
    console.log('Auth token cleared and removed from storage');
  },

  isAuthenticated(): boolean {
    return !!authToken;
  },

  // Groups
  async getGroups(): Promise<Group[]> {
    try {
      console.log('Fetching groups...');
      const response = await api.get('/api/groups');
      console.log('Groups response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Groups API call failed:', error);
      throw error;
    }
  },

  async getGroup(id: string): Promise<Group | null> {
    try {
      console.log('Fetching group:', id);
      const response = await api.get(`/api/groups/${id}`);
      console.log('Group response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Group API call failed:', error);
      throw error;
    }
  },

  async createGroup(group: Omit<Group, 'id' | 'createdAt' | 'totalExpenses' | 'balances' | 'inviteCode' | 'inviteLink'>): Promise<Group> {
    try {
      console.log('Creating group:', group);
      const response = await api.post('/api/groups', group);
      console.log('Create group response:', response.data);

      const createdGroup = response.data.data || response.data;
      if (!createdGroup.id) {
        throw new Error('Invalid response: missing group ID');
      }
      return createdGroup;
    } catch (error: any) {
      console.error('Create group API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to create group');
    }
  },

  async joinGroupById(groupId: string): Promise<Group> {
    try {
      console.log('Joining group by ID:', groupId);
      const response = await api.post(`/api/groups/${groupId}/join`);
      console.log('Join group response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Join group API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to join group');
    }
  },

  // New method for joining group via QR code
  // async joinGroupWithInviteCode(groupId: string, inviteCode: string): Promise<Group> {
  //   try {
  //     console.log('Joining group with invite code:', { groupId, inviteCode });
  //     const response = await api.post(`/api/groups/${groupId}/join-with-code`, {
  //       inviteCode
  //     });
  //     console.log('Join group with code response:', response.data);
  //     return response.data.data || response.data;
  //   } catch (error: any) {
  //     console.error('Join group with code API call failed:', error);
  //     throw new Error(error.response?.data?.message || 'Failed to join group with invite code');
  //   }
  // },
  async joinGroupWithInviteCode(inviteCode: string): Promise<Group> {
    try {
      console.log('Joining group with invite code:', { inviteCode });
      const response = await api.post(`/api/groups/join`, {
        inviteCode
      });
      console.log('Join group with code response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Join group with code API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to join group with invite code');
    }
  },

  // New method to get group invite details
  async getGroupInviteDetails(groupId: string): Promise<{ inviteCode: string; qrCodeData: string }> {
    try {
      console.log('Fetching group invite details:', groupId);
      const response = await api.get(`/api/groups/${groupId}/invite-details`);
      console.log('Group invite details:', response.data);
      
      // Generate QR code data string
      const qrCodeData = JSON.stringify({
        groupId,
        inviteCode: response.data.inviteCode,
        app: 'SplitSaathi',
        timestamp: new Date().toISOString()
      });

      return {
        inviteCode: response.data.inviteCode,
        qrCodeData
      };
    } catch (error: any) {
      console.error('Get group invite details API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get group invite details');
    }
  },

  // Expenses
  async getGroupExpenses(groupId: string): Promise<Expense[]> {
    try {
      console.log('Fetching expenses for group:', groupId);
      const response = await api.get(`/api/expenses/group/${groupId}`);
      console.log('Expenses response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Expenses API call failed:', error);
      throw error;
    }
  },

  async getAllExpenses(): Promise<Expense[]> {
    try {
      console.log('Fetching all expenses...');
      const response = await api.get('/api/expenses');
      console.log('All expenses response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Get all expenses API call failed:', error);
      throw error;
    }
  },

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    try {
      console.log('Creating expense:', expense);
      const response = await api.post('/api/expenses', expense);
      console.log('Create expense response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Create expense API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to create expense');
    }
  },

  async createUnequalExpense(expense: {
    groupId: string;
    description: string;
    amount: number;
    paidBy: string;
    splits: { participant: string; amount: number; percentage?: number }[];
    date: string;
  }): Promise<Expense> {
    try {
      console.log('Creating unequal expense:', expense);
      const response = await api.post('/api/expenses/unequal', expense);
      console.log('Create unequal expense response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Create unequal expense API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to create unequal expense');
    }
  },

  async createPersonalExpense(expense: {
    description: string;
    amount: number;
    date: string;
    paymentMethod: string;
    category: string;
  }): Promise<Expense> {
    try {
      console.log('Creating personal expense:', expense);
      const response = await api.post('/api/expenses/personal', expense);
      console.log('Create personal expense response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Create personal expense API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to create personal expense');
    }
  },

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      console.log('Deleting expense:', expenseId);
      await api.delete(`/api/expenses/${expenseId}`);
    } catch (error: any) {
      console.error('Delete expense API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete expense');
    }
  },

  async getExpenseById(expenseId: string): Promise<Expense> {
    try {
      const response = await api.get(`/api/expenses/${expenseId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Get expense by ID API call failed:', error);
      throw error;
    }
  },

  async deleteGroup(groupId: string): Promise<void> {
    try {
      const response = await api.delete(`/api/groups/${groupId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async removeGroupMember(groupId: string, memberName: string): Promise<void> {
    try {
      const response = await api.delete(`/api/groups/member/${groupId}`, {
        data: { memberName }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<Expense> {
    try {
      const response = await api.put(`/api/expenses/${expenseId}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Update expense API call failed:', error);
      throw error;
    }
  },
};