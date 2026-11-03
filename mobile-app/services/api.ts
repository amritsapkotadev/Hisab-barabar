import axios from 'axios';
import type { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Group, Expense, User, BudgetResponse, PersonalExpensesResponse, ExpensePage, ExpensePageOptions, PersonalExpensePage } from '@/types';
import { GoogleUser } from './googleAuth';
import { API_URL } from '@/config/api.config';
import {
  clearStoredAuthToken,
  storeAuthToken,
} from './tokenStorage';
import {
  createDataAdapter,
  endDataSession,
  isLocalExpenseId,
  setDataUnauthorizedHandler,
  startDataSession,
} from './dataClient';

// API Configuration - Use the centralized config
const API_BASE_URL = API_URL;

function formatLocalDateTime(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offset * 60_000).toISOString().slice(0, 19);
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${local}${offset >= 0 ? '+' : '-'}${hours}:${minutes}`;
}

function expenseRevisionHeader(revision: number | undefined): string {
  if (revision === undefined || !Number.isSafeInteger(revision) || revision < 0) {
    throw new Error('Expense revision is missing. Refresh the expense before changing it.');
  }
  return `"${revision}"`;
}

function expenseMutationHeaders(expenseId: string, revision: number | undefined) {
  return isLocalExpenseId(expenseId) && revision === undefined
    ? {}
    : { 'If-Match': expenseRevisionHeader(revision) };
}

function validateExpensePage(page: ExpensePage | PersonalExpensesResponse): asserts page is ExpensePage {
  if (!Array.isArray(page.data) || !('pageInfo' in page) || !page.pageInfo || typeof page.pageInfo.hasMore !== 'boolean' ||
      !page.data.every(expense => expense && typeof expense.id === 'string') ||
      !Number.isSafeInteger(page.pageInfo.page) || page.pageInfo.page < 1 ||
      !Number.isSafeInteger(page.pageInfo.limit) || page.pageInfo.limit < 1 || page.pageInfo.limit > 100 ||
      (page.pageInfo.hasMore ? page.pageInfo.nextPage !== page.pageInfo.page + 1 : page.pageInfo.nextPage !== null) ||
      !page.summary || !Number.isSafeInteger(page.summary.count) || page.summary.count < 0) {
    throw new Error('Expense pagination is missing or invalid. Update the backend and refresh.');
  }
}

async function getFCMTokenForAuth() {
  if (await AsyncStorage.getItem('pushNotificationsEnabled') === 'false') return null;
  return AsyncStorage.getItem('fcmToken');
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
api.defaults.adapter = createDataAdapter(axios.getAdapter(api.defaults.adapter));

// Auth token storage
let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

// Session restoration is owned by AuthProvider; it also restores account-scoped data.

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    console.log(`API call (cache or network): ${axios.getUri(config)}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API result (cache or network) from ${response.config.url}:`, response.status);
    return response;
  },
  async (error: AxiosError) => {
    console.error('API Error:', error.response?.data || error.message);
    console.error('API Error Status:', error.response?.status);
    console.error('API Error URL:', error.config?.url);

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 || error.code === 'SESSION_EXPIRED') {
      const requestToken = error.config?.headers.get('Authorization');
      if (!requestToken) return Promise.reject(error);
      if (requestToken && requestToken !== `Bearer ${authToken}`) {
        return Promise.reject(new axios.CanceledError('Previous account request expired'));
      }
      authToken = null;
      unauthorizedHandler?.();
      const url = error.config?.url || '';
      if (!url.includes('/auth/')) {
        router.replace('/(auth)/login');
      }
      await apiService.clearAuthToken();
    }

    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Authentication
  async login(email: string, password: string): Promise<{ token: string; user: User; message?: string }> {
    try {
      console.log('Attempting login with:', { email });
      const fcmToken = await getFCMTokenForAuth();
      const response = await api.post('/auth/login', { email, password, fcmToken });
      const { token, user, message } = response.data;
      authToken = token;
      await storeAuthToken(token);
      return { token, user, message };
    } catch (error: any) {
      console.error('Login API call failed:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  async register(name: string, email: string, phone: string, password: string): Promise<{ user: User; success?: boolean }> {
    try {
      console.log('Attempting registration with:', { name, email, phone });
      const fcmToken = await getFCMTokenForAuth();
      const response = await api.post('/auth/register', { name, email, phone, password, fcmToken });
      const { user, success } = response.data;
      return { user, success };
    } catch (error: any) {
      console.error('Registration API call failed:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Google Authentication
  async loginWithGoogle(googleUser: GoogleUser): Promise<{ token: string; user: User }> {
    try {
      console.log('Attempting Google login with:', { email: googleUser.email });
      const fcmToken = await getFCMTokenForAuth();
      const response = await api.post('/auth/google-login', {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        fcmToken,
      });
      const { token, user } = response.data;
      authToken = token;
      await storeAuthToken(token);
      return { token, user };
    } catch (error: any) {
      console.error('Google login API call failed:', error);
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
  },

  async registerWithGoogle(googleUser: GoogleUser): Promise<{ token: string; user: User }> {
    try {
      console.log('Attempting Google registration with:', { email: googleUser.email });
      const fcmToken = await getFCMTokenForAuth();
      const response = await api.post('/auth/google-register', {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        fcmToken,
      });
      const { token, user } = response.data;
      authToken = token;
      await storeAuthToken(token);
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
      return response.data.user;
    } catch (error) {
      console.error('Get profile API call failed:', error);
      throw error;
    }
  },

  async updateUserProfile(updates: Partial<User>): Promise<User> {
    try {
      console.log('Updating user profile with:', updates);
      const response = await api.put('/users/profile', updates);
      return response.data.user;
    } catch (error: any) {
      console.error('Update profile API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  async uploadUserProfilePicture(asset: {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  }): Promise<User> {
    try {
      const formData = new FormData();
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || `profile-picture.${extension}`,
        type: mimeType,
      } as unknown as Blob);

      const response = await api.post('/users/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      });
      return response.data.user;
    } catch (error: any) {
      console.error('Profile picture upload API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload profile picture');
    }
  },

  async setAuthToken(token: string) {
    if (!await startDataSession(token, API_BASE_URL)) {
      throw new axios.CanceledError('Session changed while restoring credentials');
    }
    authToken = token;
    await storeAuthToken(token);
    console.log('Auth token set and stored');
  },

  async clearAuthToken() {
    authToken = null;
    try {
      await endDataSession();
    } finally {
      await clearStoredAuthToken();
    }
    console.log('Auth token cleared and removed from storage');
  },

  isAuthenticated(): boolean {
    return !!authToken;
  },

  async prepareOfflineSync(): Promise<void> {
    const response = await api.get<{
      data?: { expenseCreateIdempotency?: boolean; expenseMutationIdempotency?: boolean };
    }>('/offline-capabilities');
    if (response.data.data?.expenseCreateIdempotency !== true ||
        response.data.data?.expenseMutationIdempotency !== true) {
      throw new Error('The server needs an update before offline expense sync is available.');
    }
  },

  // Personal budget
  async setPersonalBudget(budget: number): Promise<BudgetResponse> {
    try {
      const response = await api.post('/users/budget', { budget });
      console.log('Set budget response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Set personal budget API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to set personal budget');
    }
  },

  // Groups
  async getGroups(): Promise<Group[]> {
    try {
      console.log('Fetching groups...');
      const response = await api.get('/groups');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Groups API call failed:', error);
      throw error;
    }
  },

  async getGroup(id: string, onlineOnly = false): Promise<Group | null> {
    try {
      console.log('Fetching group:', id);
      const response = await api.get(`/groups/${id}`, onlineOnly ? { headers: { 'Cache-Control': 'no-cache' } } : undefined);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Group API call failed:', error);
      throw error;
    }
  },

  async getGroupSettlements(groupId: string): Promise<{
    balances: Record<string, number>;
    settlements: { from: string; to: string; amount: number }[];
    totalUnsettled: number;
    isSettled: boolean;
  }> {
    const group = await this.getGroup(groupId, true);
    if (!group) {
      throw new Error('Group not found');
    }

    const settlements = (group.netSettlements ?? []).map((settlement) => ({
      from: settlement.fromUserId,
      to: settlement.toUserId,
      amount: Number(settlement.amount) || 0,
    }));
    const totalUnsettled =
      Math.round(settlements.reduce((sum, settlement) => sum + settlement.amount, 0) * 100) / 100;

    return {
      balances: group.balances ?? {},
      settlements,
      totalUnsettled,
      isSettled: totalUnsettled < 0.01,
    };

  },

  async createGroup(group: Omit<Group, 'id' | 'createdAt' | 'totalExpenses' | 'balances' | 'inviteCode' | 'inviteLink'>): Promise<Group> {
    try {
      // The server assigns stable member ids at creation time, so send names.
      const payload = { ...group, members: group.members.map((member) => member.name) };
      console.log('Creating group:', payload);
      const response = await api.post('/groups', payload);

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

  async joinGroupById(
    groupId: string
  ): Promise<{ group: Group; alreadyMember: boolean }> {
    try {
      console.log('Joining group by ID:', groupId);
      const response = await api.post(`/groups/${groupId}/join`);
      return {
        group: response.data.data || response.data,
        alreadyMember: response.data.message === 'You are already a member of this group',
      };
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
      const response = await api.post(`/groups/join`, {
        inviteCode
      });
      console.log('Join group with code response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Join group with code API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to join group with invite code');
    }
  },

  async addMemberByPhone(groupId: string, phone: string): Promise<Group> {
    try {
      console.log('Adding member by phone:', { groupId, phone });
      const response = await api.post(`/groups/${groupId}/add-member`, { phone });
      console.log('Add member response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Add member by phone API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to add member');
    }
  },

  // Expenses
  async getExpensePage(options: ExpensePageOptions, groupId?: string): Promise<ExpensePage> {
    const path = groupId ? `/expenses/group/${groupId}` : '/expenses';
    const response = await api.get<ExpensePage>(path, { params: options });
    console.log('Expenses page response:', response.data);
    validateExpensePage(response.data);
    if (typeof response.data.summary.totalAmount !== 'number' ||
        !Number.isFinite(response.data.summary.totalAmount)) {
      throw new Error('Expense total is missing or invalid. Update the backend and refresh.');
    }
    return response.data;
  },

  async getPersonalExpensePage(options: ExpensePageOptions): Promise<PersonalExpensePage> {
    const response = await apiService.getPersonalExpenses(options);
    validateExpensePage(response);
    if (!Number.isFinite(response.summary.monthlySpent)) {
      throw new Error('Personal expense spending total is missing or invalid.');
    }
    return response;
  },

  async getGroupExpenses(groupId: string): Promise<Expense[]> {
    try {
      console.log('Fetching expenses for group:', groupId);
      const response = await api.get(`/expenses/group/${groupId}`);
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
      const response = await api.get('/expenses');
      console.log('All expenses response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Get all expenses API call failed:', error);
      throw error;
    }
  },

  async getPersonalExpenses(options?: ExpensePageOptions): Promise<PersonalExpensesResponse> {
    try {
      console.log('Fetching personal expenses...');
      const now = new Date();
      const response = await api.get<PersonalExpensesResponse>('/expenses/personal', {
        params: {
          ...options,
          monthStart: formatLocalDateTime(new Date(now.getFullYear(), now.getMonth(), 1)),
          monthEnd: formatLocalDateTime(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
        },
      });
      console.log('Personal expenses response:', response.data);
      if (!response.data.summary) {
        throw new Error('Personal expense summary is missing from the API response');
      }
      if (typeof response.data.budget !== 'number' || !Number.isFinite(response.data.budget) ||
          response.data.budget < 0) {
        throw new Error('Personal expense budget is missing or invalid. Update the backend and refresh personal expenses.');
      }
      return response.data;
    } catch (error) {
      console.error('Get personal expenses API call failed:', error);
      throw error;
    }
  },

  async createExpense(
    expense: Pick<Expense, 'groupId' | 'description' | 'amount' | 'paidBy' | 'participants' | 'date'> &
      Partial<Pick<Expense, 'splits' | 'payers' | 'splitType' | 'type' | 'paymentMethod' | 'category' | 'createdBy'>>
  ): Promise<Expense> {
    try {
      console.log('Creating expense:', expense);
      const response = await api.post('/expenses', expense);
      console.log('Create expense response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Create expense API call failed:', error);
      if (axios.isAxiosError(error) && error.code === 'OFFLINE_QUEUED') throw error;
      throw new Error(error.response?.data?.message || error.message || 'Failed to create expense');
    }
  },

  async createPersonalExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'groupId'>): Promise<Expense> {
    try {
      console.log('Creating expense:', expense);
      const response = await api.post('/expenses/personal', expense);
      console.log('Create expense response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Create expense API call failed:', error);
      if (axios.isAxiosError(error) && error.code === 'OFFLINE_QUEUED') throw error;
      throw new Error(error.response?.data?.message || error.message || 'Failed to create expense');
    }
  },

  async updatePersonalExpense(expenseId: string, updates: Partial<Expense>, revision: number | undefined): Promise<Expense> {
    try {
      const response = await api.put(`/expenses/${expenseId}`, updates, { headers: expenseMutationHeaders(expenseId, revision) });
      console.log('Update personal expense response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Update personal expense API call failed:', error);
      if (axios.isAxiosError(error) && error.code === 'OFFLINE_QUEUED') throw error;
      throw new Error(error.response?.data?.message || 'Failed to update personal expense');
    }
  },

  async createUnequalExpense(expense: {
    groupId: string;
    description: string;
    amount: number;
    paidBy: string;
    splits: { participant: string; amount: number; percentage?: number }[];
    date: string;
    type: 'group';
  }): Promise<Expense> {
    try {
      console.log('Creating unequal expense:', expense);
      const response = await api.post('/expenses/unequal', expense);
      console.log('Create unequal expense response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Create unequal expense API call failed:', error);
      if (axios.isAxiosError(error) && error.code === 'OFFLINE_QUEUED') throw error;
      throw new Error(error.response?.data?.message || error.message || 'Failed to create unequal expense');
    }
  },

  async deleteExpense(expenseId: string, revision: number | undefined): Promise<void> {
    try {
      console.log('Deleting expense:', expenseId);
      await api.delete(`/expenses/${expenseId}`, { headers: expenseMutationHeaders(expenseId, revision) });
    } catch (error: any) {
      console.error('Delete expense API call failed:', error);
      if (axios.isAxiosError(error) && error.code === 'OFFLINE_QUEUED') throw error;
      throw new Error(error.response?.data?.message || 'Failed to delete expense');
    }
  },

  async deletePersonalExpense(expenseId: string, revision: number | undefined): Promise<void> {
    try {
      console.log('Deleting personal expense:', expenseId);
      await api.delete(`/expenses/${expenseId}`, { headers: expenseMutationHeaders(expenseId, revision) });
    } catch (error: any) {
      console.error('Delete personal expense API call failed:', error);
      if (axios.isAxiosError(error) && error.code === 'OFFLINE_QUEUED') throw error;
      throw new Error(error.response?.data?.message || 'Failed to delete personal expense');
    }
  },

  async getExpenseById(expenseId: string): Promise<Expense> {
    try {
      const response = await api.get(`/expenses/${expenseId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Get expense by ID API call failed:', error);
      throw error;
    }
  },

  async deleteGroup(groupId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async removeGroupMember(groupId: string, memberId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/groups/member/${groupId}`, {
        data: { memberId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateExpense(expenseId: string, updates: Partial<Expense>, revision: number | undefined): Promise<Expense> {
    try {
      const response = await api.put(`/expenses/${expenseId}`, updates, { headers: expenseMutationHeaders(expenseId, revision) });
      return response.data.data;
    } catch (error) {
      console.error('Update expense API call failed:', error);
      if (axios.isAxiosError(error) && error.code === 'OFFLINE_QUEUED') throw error;
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Changing password for user');
      const response = await api.put('/users/change-password', { currentPassword, newPassword });
      console.log('Change password response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Change password API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  },

  async deleteAccount(): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Deleting user account');
      const response = await api.delete('/users/delete-account');
      console.log('Delete account response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Delete account API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete account');
    }
  },

  async verifyOtp({ otp, email, purpose }: { otp: string; email: string; purpose?: 'reset' }): Promise<{ token: string; success: boolean; message?: string }> {
    try {
      console.log('Verifying OTP for email:', email);
      const response = await api.post('/auth/verify-otp', { otp, email, purpose });
      console.log('Verify OTP response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Verify OTP API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify OTP');
    }
  },

  async resendOtp({ email }: { email: string }): Promise<{ token: string; success: boolean, message?: string }> {
    try {
      console.log('Resending OTP to email:', email);
      const response = await api.post('/auth/resend-otp', { email });
      console.log('Resend OTP response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Resend OTP API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to resend OTP');
    }
  },

  async forgotPassword({ email }: { email: string }): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Sending forgot password request for email:', email);
      const response = await api.post('/auth/forgot-password', { email });
      console.log('Forgot password response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Forgot password API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to send forgot password request');
    }
  },

  async resetPassword({email, otp, newPassword}: { email: string; otp: string; newPassword: string }): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Resetting password for email:', email);
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      console.log('Reset password response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Reset password API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  },

  async updateFCMToken(fcmToken: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Updating FCM token');
      const response = await api.put('/users/fcm-token', { fcmToken });
      console.log('Update FCM token response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Update FCM token API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to update FCM token');
    }
  },

  async clearFCMToken(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put('/users/fcm-token', { fcmToken: null });
      return response.data;
    } catch (error: any) {
      console.error('Clear FCM token API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to disable push notifications');
    }
  },
};

setDataUnauthorizedHandler(async () => {
  unauthorizedHandler?.();
  router.replace('/(auth)/login');
  await apiService.clearAuthToken();
});