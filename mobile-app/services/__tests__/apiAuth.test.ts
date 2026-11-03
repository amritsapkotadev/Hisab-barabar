import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { apiService, setUnauthorizedHandler } from '../api';
import { clearStoredAuthToken } from '../tokenStorage';
import { endDataSession } from '../dataClient';

const mockNative = jest.fn<AxiosAdapter>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('../googleAuth', () => ({}));
jest.mock('@/config/api.config', () => ({ API_URL: 'https://example.invalid/api' }));
jest.mock('../tokenStorage', () => ({
  clearStoredAuthToken: jest.fn(),
  storeAuthToken: jest.fn(),
}));
jest.mock('../dataClient', () => ({
  createDataAdapter: () => (config: InternalAxiosRequestConfig) => mockNative(config),
  startDataSession: jest.fn(async () => true),
  endDataSession: jest.fn(),
  setDataUnauthorizedHandler: jest.fn(),
}));

describe('API unauthorized session ownership', () => {
  const unauthorized = jest.fn();
  beforeEach(async () => {
    await apiService.clearAuthToken();
    jest.clearAllMocks();
    setUnauthorizedHandler(unauthorized);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    setUnauthorizedHandler(null);
  });

  it.each(['2026-11-15T12:00:00Z', '2026-12-15T12:00:00Z', '2026-03-15T12:00:00Z'])(
    'sends readable local month boundaries without changing their instants for %s',
    async timestamp => {
      jest.useFakeTimers().setSystemTime(new Date(timestamp));
      mockNative.mockImplementation(async (config: InternalAxiosRequestConfig) => ({
        config, data: { data: [], budget: 0, summary: { count: 0, monthlySpent: 0 } },
        status: 200, statusText: 'OK', headers: new AxiosHeaders(),
      }));
      await apiService.getPersonalExpenses({ limit: 7, page: 1 });
      const { params } = mockNative.mock.calls[0][0];
      const now = new Date();
      const boundaries = [
        ['monthStart', new Date(now.getFullYear(), now.getMonth(), 1)],
        ['monthEnd', new Date(now.getFullYear(), now.getMonth() + 1, 1)],
      ] as const;
      expect(params).toMatchObject({ limit: 7, page: 1 });
      for (const [key, boundary] of boundaries) {
        expect(params[key]).toMatch(/^\d{4}-\d{2}-01T00:00:00[+-]\d{2}:\d{2}$/);
        expect(params[key].slice(0, 7)).toBe(
          `${boundary.getFullYear()}-${String(boundary.getMonth() + 1).padStart(2, '0')}`,
        );
        expect(new Date(params[key]).getTime()).toBe(boundary.getTime());
      }
    },
  );

  it('does not clear a restored session for an unauthenticated request that failed earlier', async () => {
    let fail!: () => void;
    mockNative.mockImplementation((config: InternalAxiosRequestConfig) => new Promise((_, reject) => {
      fail = () => reject(new AxiosError('No token provided', 'ERR_BAD_REQUEST', config, undefined, {
        config, data: { error: 'No token provided' }, status: 401, statusText: 'Unauthorized',
        headers: new AxiosHeaders(),
      }));
    }));
    const pending = apiService.getUserProfile().catch(error => error);
    await new Promise(resolve => setTimeout(resolve, 0));
    await apiService.setAuthToken('current-session');
    fail();
    expect(await pending).toBeInstanceOf(AxiosError);
    expect(apiService.isAuthenticated()).toBe(true);
    expect(unauthorized).not.toHaveBeenCalled();
    expect(clearStoredAuthToken).not.toHaveBeenCalled();
    expect(endDataSession).not.toHaveBeenCalled();
  });

  it('still clears the session when its authenticated request receives 401', async () => {
    await apiService.setAuthToken('current-session');
    mockNative.mockImplementation((config: InternalAxiosRequestConfig) => Promise.reject(
      new AxiosError('Expired token', 'ERR_BAD_REQUEST', config, undefined, {
        config, data: {}, status: 401, statusText: 'Unauthorized', headers: new AxiosHeaders(),
      }),
    ));
    await expect(apiService.getUserProfile()).rejects.toBeInstanceOf(AxiosError);
    expect(apiService.isAuthenticated()).toBe(false);
    expect(unauthorized).toHaveBeenCalledTimes(1);
    expect(clearStoredAuthToken).toHaveBeenCalledTimes(1);
  });

  it('prepares expense capabilities through the shared read adapter', async () => {
    mockNative.mockImplementation(async (config: InternalAxiosRequestConfig) => ({
      config, data: { data: { expenseCreateIdempotency: true, expenseMutationIdempotency: true } },
      status: 200, statusText: 'OK', headers: new AxiosHeaders(),
    }));
    await apiService.prepareOfflineSync();
    expect(mockNative.mock.calls[0][0]).toMatchObject({ url: '/offline-capabilities', method: 'get' });
  });

  it('reports an unsupported backend rather than claiming offline support', async () => {
    mockNative.mockImplementation(async (config: InternalAxiosRequestConfig) => ({
      config, data: { data: { expenseCreateIdempotency: false } },
      status: 200, statusText: 'OK', headers: new AxiosHeaders(),
    }));
    await expect(apiService.prepareOfflineSync()).rejects.toThrow('server needs an update');
  });
});
