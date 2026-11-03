import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import {
  createDataAdapter, startDataSession, endDataSession, setDataOnline, queryClient,
  getDataState, replayQueuedExpenses, dismissQueuedExpense, refreshServerData,
  loadExpenseDraft, saveExpenseDraft, deleteExpenseDraft,
  setDataUnauthorizedHandler, resumeDataReads, retryQueuedExpense,
} from '../dataClient';

let mockOutbox: Array<Record<string, unknown>> = [];
let mockSnapshots: Array<Record<string, unknown>> = [];
let mockConfirmed: Array<Record<string, unknown>> = [];
let mockLocalIds: Array<Record<string, unknown>> = [];
let mockDrafts: Array<Record<string, unknown>> = [];
let mockFailNextSqlWrite = false;
let mockTransactionActive = false;
const mockClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(),
}));
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `expense-${Math.random()}`),
}));
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => ({
    execAsync: async () => {},
    withTransactionAsync: async (work: () => Promise<void>) => {
      if (mockTransactionActive) throw new Error('cannot start a transaction within a transaction');
      mockTransactionActive = true;
      const before = [mockClone(mockOutbox), mockClone(mockSnapshots), mockClone(mockConfirmed), mockClone(mockLocalIds), mockClone(mockDrafts)];
      try {
        await new Promise(resolve => setTimeout(resolve, 0));
        await work();
      } catch (error) {
        [mockOutbox, mockSnapshots, mockConfirmed, mockLocalIds, mockDrafts] = before;
        throw error;
      } finally {
        mockTransactionActive = false;
      }
    },
    runAsync: async (sql: string, ...args: unknown[]) => {
      if (mockFailNextSqlWrite && sql.includes('INSERT INTO expense_outbox')) {
        mockFailNextSqlWrite = false;
        throw new Error('SQLite full');
      }
      if (sql.startsWith('DELETE FROM expense_outbox')) {
        mockOutbox = mockOutbox.filter(row => row.scope !== args[0]);
      } else if (sql.startsWith('DELETE FROM confirmed_expenses')) {
        mockConfirmed = mockConfirmed.filter(row => row.scope !== args[0] ||
          (args.length > 1 && row.expense_id !== args[1]));
      } else if (sql.startsWith('DELETE FROM local_expense_ids')) {
        mockLocalIds = mockLocalIds.filter(row => row.scope !== args[0] ||
          (sql.includes('server_id = ?') ? row.server_id !== args[1] : row.local_id !== args[1]));
      } else if (sql.startsWith('DELETE FROM expense_snapshots')) {
        mockSnapshots = mockSnapshots.filter(row => row.scope !== args[0] || row.cache_key !== args[1]);
      } else if (sql.startsWith('UPDATE expense_snapshots')) {
        const [body, savedAt, scope, key] = args;
        const snapshot = mockSnapshots.find(row => row.scope === scope && row.cache_key === key);
        if (snapshot) Object.assign(snapshot, { body, saved_at: savedAt });
      } else if (sql.includes('INSERT INTO local_expense_ids')) {
        const [scope, localId, serverId] = args;
        mockLocalIds = mockLocalIds.filter(row => row.scope !== scope || row.local_id !== localId);
        mockLocalIds.push({ scope, local_id: localId, server_id: serverId });
      } else if (sql.includes('INSERT OR IGNORE INTO expense_outbox')) {
        const [scope, id, path, body, createdAt, attemptedAt, status, message] = args;
        if (!mockOutbox.some(row => row.scope === scope && row.operation_id === id)) {
          mockOutbox.push({
            scope, operation_id: id, path, method: 'post', body, created_at: createdAt,
            attempted_at: attemptedAt, status, message, expense_id: null, expected_revision: null,
          });
        }
      } else if (sql.includes('INSERT INTO expense_outbox')) {
        const [scope, id, path, method, body, createdAt, attemptedAt, status, message, expenseId, revision] = args;
        mockOutbox.push({
          scope, operation_id: id, path, method, body, created_at: createdAt,
          attempted_at: attemptedAt, status, message, expense_id: expenseId, expected_revision: revision,
        });
      } else if (sql.includes('INSERT INTO expense_snapshots')) {
        const [scope, key, status, statusText, body, savedAt] = args;
        if (statusText == null) throw new Error('NOT NULL constraint failed: expense_snapshots.status_text');
        mockSnapshots = mockSnapshots.filter(row => row.scope !== scope || row.cache_key !== key);
        mockSnapshots.push({ scope, cache_key: key, status, status_text: statusText, body, saved_at: savedAt });
      } else if (sql.includes('INSERT INTO confirmed_expenses')) {
        const [scope, id, payload, updatedAt] = args;
        mockConfirmed = mockConfirmed.filter(row => row.scope !== scope || row.expense_id !== id);
        mockConfirmed.push({ scope, expense_id: id, payload, updated_at: updatedAt });
      } else if (sql.includes('INSERT INTO expense_drafts')) {
        const [scope, key, payload, updatedAt] = args;
        mockDrafts = mockDrafts.filter(row => row.scope !== scope || row.draft_key !== key);
        mockDrafts.push({ scope, draft_key: key, payload, updated_at: updatedAt });
      } else if (sql.startsWith('DELETE FROM expense_drafts')) {
        mockDrafts = mockDrafts.filter(row => row.scope !== args[0] || row.draft_key !== args[1]);
      }
    },
    getAllAsync: async (sql: string, ...args: unknown[]) => {
      if (sql.includes('FROM expense_outbox')) return mockClone(mockOutbox.filter(row => row.scope === args[0]));
      if (sql.includes('FROM expense_snapshots')) return mockClone(mockSnapshots.filter(row => row.scope === args[0]));
      if (sql.includes('FROM local_expense_ids')) return mockClone(mockLocalIds.filter(row => row.scope === args[0]));
      if (sql.includes('FROM confirmed_expenses')) return mockClone(mockConfirmed.filter(row => row.scope === args[0]));
      return [];
    },
    getFirstAsync: async (sql: string, ...args: unknown[]) => {
      if (sql.includes('FROM expense_snapshots')) {
        return mockClone(mockSnapshots.find(row => row.scope === args[0] && row.cache_key === args[1]) ?? null);
      }
      if (sql.includes('FROM confirmed_expenses')) {
        return mockClone(mockConfirmed.find(row => row.scope === args[0] && row.expense_id === args[1]) ?? null);
      }
      if (sql.includes('FROM local_expense_ids')) {
        return mockClone(mockLocalIds.find(row => row.scope === args[0] && row.local_id === args[1]) ?? null);
      }
      if (sql.includes('FROM expense_drafts')) {
        return mockClone(mockDrafts.find(row => row.scope === args[0] && row.draft_key === args[1]) ?? null);
      }
      return null;
    },
  }),
}));

const storage = jest.mocked(AsyncStorage);
const disk = new Map<string, string>();
const token = (id: string) => `header.${Buffer.from(JSON.stringify({
  id, exp: Math.floor(Date.now() / 1000) + 3600,
})).toString('base64url')}.signature`;

const response = (config: InternalAxiosRequestConfig, data: unknown = { success: true, data: [] }) => ({
  config, data: JSON.stringify(data), status: 200, statusText: 'OK',
  headers: new AxiosHeaders({ 'x-idempotency-supported': 'true' }),
});
const capable = { success: true, data: { expenseCreateIdempotency: true, expenseMutationIdempotency: true } };

describe('shared account data and offline journal', () => {
  let native: jest.Mock;
  let api: ReturnType<typeof axios.create>;
  beforeEach(async () => {
    jest.clearAllMocks();
    disk.clear();
    mockOutbox = [];
    mockSnapshots = [];
    mockConfirmed = [];
    mockLocalIds = [];
    mockDrafts = [];
    mockFailNextSqlWrite = false;
    mockTransactionActive = false;
    storage.getItem.mockImplementation(async key => disk.get(key) ?? null);
    storage.setItem.mockImplementation(async (key, value) => { disk.set(key, value); });
    storage.removeItem.mockImplementation(async key => { disk.delete(key); });
    await endDataSession();
    setDataOnline(true);
    native = jest.fn(async config => response(config,
      config.url === '/offline-capabilities' ? capable :
        config.method === 'post' ? { success: true, data: { id: 'server-created', revision: 0 } } : undefined));
    api = axios.create({ adapter: createDataAdapter(native), baseURL: 'https://example.invalid/api' });
    await startDataSession(token('user-a'));
  });
  afterEach(async () => {
    await endDataSession();
  });

  it('deduplicates concurrent reads and reuses fresh data', async () => {
    const [first, second] = await Promise.all([api.get('/groups'), api.get('/groups')]);
    expect(first.data).toEqual(second.data);
    expect(native).toHaveBeenCalledTimes(1);
    await api.get('/groups');
    expect(native).toHaveBeenCalledTimes(1);
    await refreshServerData(false);
    await api.get('/groups');
    expect(native).toHaveBeenCalledTimes(2);
  });

  it('logs one network miss for concurrent reads, then a fresh query-cache hit', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await Promise.all([api.get('/groups'), api.get('/groups')]);
      expect(log.mock.calls).toEqual([
        ['[cache] MISS GET /groups (network fetch)'],
        ['[cache] HIT GET /groups (shared in-flight request)'],
      ]);
      expect(native).toHaveBeenCalledTimes(1);
      await api.get('/groups');
      expect(log).toHaveBeenLastCalledWith('[cache] HIT GET /groups (fresh query cache)');
      expect(native).toHaveBeenCalledTimes(1);
      await refreshServerData(false);
      await api.get('/groups');
      expect(log).toHaveBeenLastCalledWith('[cache] MISS GET /groups (network fetch)');
      expect(native).toHaveBeenCalledTimes(2);
    } finally {
      log.mockRestore();
    }
  });

  it('does not cancel or invalidate dashboard reads when the FCM token is saved', async () => {
    let finish!: () => void;
    let signal: AbortSignal | undefined;
    native.mockImplementation(config => {
      if (config.method === 'put') return response(config);
      signal = config.signal;
      return new Promise(resolve => {
        finish = () => resolve(response(config));
      });
    });
    const revision = getDataState().revision;
    const pending = api.get('/groups');
    await new Promise(resolve => setTimeout(resolve, 0));
    await api.put('/users/fcm-token', { fcmToken: 'test-token' });
    expect(signal?.aborted).toBe(false);
    expect(getDataState().revision).toBe(revision);
    finish();
    await pending;
    expect(getDataState().revision).toBe(revision);
    await api.get('/groups');
    expect(native.mock.calls.filter(([config]) => config.method === 'get')).toHaveLength(1);
  });

  it('reuses fresh data on resume and fetches stale data', async () => {
    await api.get('/users/profile');
    const revision = getDataState().revision;
    resumeDataReads();
    expect(getDataState().revision).toBe(revision + 1);
    await api.get('/users/profile');
    expect(native).toHaveBeenCalledTimes(1);
    queryClient.setQueryData(['user-a', '/users/profile', null],
      { data: '{}', status: 200, statusText: 'OK' }, { updatedAt: Date.now() - 31_000 });
    resumeDataReads();
    await api.get('/users/profile');
    expect(native).toHaveBeenCalledTimes(2);
  });

  it('shares an in-flight read across app resume', async () => {
    let finish!: () => void;
    let signal: AbortSignal | undefined;
    native.mockImplementation(config => {
      signal = config.signal;
      return new Promise(resolve => {
        finish = () => resolve(response(config));
      });
    });
    const first = api.get('/groups');
    await new Promise(resolve => setTimeout(resolve, 0));
    resumeDataReads();
    const second = api.get('/groups');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(native).toHaveBeenCalledTimes(1);
    expect(signal?.aborted).toBe(false);
    finish();
    const results = await Promise.all([first, second]);
    expect(results[0].data).toEqual(results[1].data);
  });

  it('still invalidates cached data after group writes', async () => {
    await api.get('/groups');
    const revision = getDataState().revision;
    await api.post('/groups', { name: 'New group' });
    expect(getDataState().revision).toBe(revision + 1);
    await api.get('/groups');
    expect(native.mock.calls.filter(([config]) => config.method === 'get')).toHaveLength(2);
  });

  it.each([undefined, null, ''])('serializes parallel login refresh writes with status text %p', async statusText => {
    native.mockImplementation(config => ({
      ...response(config, { success: true, data: [] }),
      statusText,
    }));
    await Promise.all([
      api.get('/groups'),
      api.get('/expenses'),
      api.get('/expenses/personal'),
      saveExpenseDraft('personal-create', { amount: '10' }),
    ]);
    expect(mockSnapshots).toHaveLength(2);
    expect(mockSnapshots.every(row => row.status_text === '')).toBe(true);
    await expect(loadExpenseDraft('personal-create')).resolves.toEqual({ amount: '10' });
    expect(getDataState().error).toBeNull();
    setDataOnline(false);
    await expect(api.get('/expenses')).resolves.toMatchObject({
      status: 200, statusText: '', data: { success: true, data: [] },
    });
  });

  it('uses recent cache offline and explicitly rejects missing or settlement reads', async () => {
    await api.get('/groups');
    setDataOnline(false);
    expect((await api.get('/groups')).data.data).toEqual([]);
    await expect(api.get('/expenses')).rejects.toMatchObject({ code: 'OFFLINE' });
    await expect(api.get('/groups', { headers: { 'Cache-Control': 'no-cache' } }))
      .rejects.toMatchObject({ code: 'OFFLINE' });
    await expect(api.post('/settlements', {})).rejects.toMatchObject({ code: 'OFFLINE' });
    expect(native).toHaveBeenCalledTimes(1);
  });

  it('does not restore another account cache and deletes cached server data on logout', async () => {
    await api.get('/groups');
    await new Promise(resolve => setTimeout(resolve, 550));
    expect(disk.has('server-cache:v1:user-a')).toBe(true);
    await startDataSession(token('user-b'));
    setDataOnline(false);
    await expect(api.get('/groups')).rejects.toMatchObject({ code: 'OFFLINE' });
    await endDataSession();
    expect(disk.has('server-cache:v1:user-b')).toBe(false);
  });

  it('restores recent persisted profile for an offline session', async () => {
    await api.get('/users/profile');
    await new Promise(resolve => setTimeout(resolve, 550));
    await startDataSession(token('user-b'));
    setDataOnline(false);
    await startDataSession(token('user-a'));
    await expect(api.get('/users/profile')).resolves.toMatchObject({ status: 200 });
  });

  it('aborts in-flight shared reads on account switch without leaking results', async () => {
    let signal: AbortSignal | undefined;
    native.mockImplementationOnce(config => new Promise((resolve, reject) => {
      signal = config.signal;
      signal?.addEventListener('abort', () => reject(new axios.CanceledError('aborted')));
    }));
    const pending = api.get('/groups').catch(error => error);
    await new Promise(resolve => setTimeout(resolve, 0));
    await startDataSession(token('user-b'));
    expect(signal?.aborted).toBe(true);
    expect(await pending).toBeInstanceOf(Error);
    expect(queryClient.getQueryData(['user-b', '/groups', null])).toBeUndefined();
  });

  it('journals offline creates before acknowledging, blocks duplicate submits, and replays once', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    const body = { amount: 15, description: 'Lunch' };
    await expect(api.post('/expenses/personal', body)).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    const item = getDataState().queue[0];
    expect(getDataState().queue).toHaveLength(1);
    await expect(api.post('/expenses/personal', body)).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    expect(getDataState().queue).toHaveLength(1);
    setDataOnline(true);
    await replayQueuedExpenses();
    const sent = native.mock.calls.find(([config]) => config.method === 'post')![0];
    expect(sent.headers.get('Idempotency-Key')).toBe(item.id);
    expect(getDataState().queue[0].status).toBe('synced');
    await replayQueuedExpenses();
    expect(native.mock.calls.filter(([config]) => config.method === 'post')).toHaveLength(1);
  });

  it('migrates the old create journal to SQLite without changing keys or payloads', async () => {
    const legacy = [{
      id: 'd741b4a5-cd34-469f-b939-d2d2389c29be',
      path: '/expenses/personal',
      body: '{"amount":15,"description":"Lunch"}',
      createdAt: 123,
      status: 'pending',
    }];
    await endDataSession();
    disk.set('offline-expenses:v1:user-a', JSON.stringify(legacy));
    await startDataSession(token('user-a'));
    expect(getDataState().queue).toMatchObject([{
      id: legacy[0].id, body: legacy[0].body, attemptedAt: 123, method: 'post',
    }]);
    expect(disk.has('offline-expenses:v1:user-a')).toBe(false);
    await endDataSession();
    await startDataSession(token('user-a'));
    expect(getDataState().queue[0].id).toBe(legacy[0].id);
  });

  it('stores expense snapshots in SQLite and reads them after a restart without the 24-hour limit', async () => {
    await api.get('/expenses');
    expect(mockSnapshots).toHaveLength(1);
    await endDataSession();
    await startDataSession(token('user-a'));
    setDataOnline(false);
    await expect(api.get('/expenses')).resolves.toMatchObject({ status: 200 });
    expect(native.mock.calls.filter(([config]) => config.url === '/expenses')).toHaveLength(1);
  });

  it('serves a confirmed expense by id from the local SQLite index', async () => {
    const expense = { id: 'expense-12', amount: 12, description: 'Lunch', updatedAt: new Date().toISOString() };
    native.mockImplementation(config => response(config,
      config.url === '/expenses' ? { success: true, data: [expense] } : undefined));
    await api.get('/expenses');
    setDataOnline(false);
    await expect(api.get('/expenses/expense-12')).resolves.toMatchObject({
      data: { success: true, data: { id: 'expense-12' } },
    });
  });

  it('reconciles local confirmed rows only after a complete all-expenses response', async () => {
    const first = { id: 'expense-21', amount: 21, updatedAt: new Date().toISOString() };
    const second = { id: 'expense-22', amount: 22, updatedAt: new Date().toISOString() };
    native.mockImplementation(config => response(config, config.url === '/expenses'
      ? { success: true, data: [first, second] }
      : undefined));
    await api.get('/expenses');
    native.mockImplementation(config => response(config, config.url === '/expenses/personal'
      ? { success: true, data: [second] }
      : undefined));
    await api.get('/expenses/personal');
    expect(mockConfirmed.map(row => row.expense_id)).toEqual(['expense-21', 'expense-22']);
    await refreshServerData(false);
    native.mockImplementation(config => response(config, config.url === '/expenses'
      ? { success: true, data: [second] }
      : undefined));
    await api.get('/expenses');
    expect(mockConfirmed.map(row => row.expense_id)).toEqual(['expense-22']);
    setDataOnline(false);
    await expect(api.get('/expenses/expense-21')).rejects.toMatchObject({ code: 'OFFLINE' });
    await expect(api.get('/expenses/expense-22')).resolves.toMatchObject({
      data: { success: true, data: { id: 'expense-22' } },
    });
    await expect(api.get('/expenses')).resolves.toMatchObject({
      data: { success: true, data: [{ id: 'expense-22' }] },
    });
  });

  it('updates scoped and detail snapshots from the complete expense list', async () => {
    const oldExpense = {
      id: 'expense-31', groupId: 'group-1', amount: 31, description: 'Old name',
      paidBy: 'member-1', participants: ['member-1'], date: '2026-10-31',
      createdAt: '2026-10-31', type: 'group', revision: 1,
    };
    const updatedExpense = { ...oldExpense, description: 'Updated name', revision: 2 };
    const removedExpense = { ...oldExpense, id: 'expense-32', description: 'Removed' };
    native.mockImplementation(config => {
      if (config.url === '/expenses') return response(config, { success: true, data: [oldExpense, removedExpense] });
      if (config.url === '/expenses/group/group-1') return response(config, { success: true, data: [oldExpense, removedExpense] });
      if (config.url === '/expenses/expense-31') return response(config, { success: true, data: oldExpense });
      if (config.url === '/expenses/expense-32') return response(config, { success: true, data: removedExpense });
      return response(config);
    });
    await api.get('/expenses/group/group-1');
    await api.get('/expenses/expense-31');
    await api.get('/expenses/expense-32');
    await refreshServerData(false);
    native.mockImplementation(config => response(config, {
      success: true,
      data: [{ ...updatedExpense }, { ...oldExpense, id: 'expense-33', description: 'New expense' }],
    }));
    await api.get('/expenses');
    setDataOnline(false);
    await expect(api.get('/expenses/group/group-1')).resolves.toMatchObject({
      data: { success: true, data: [{ id: 'expense-31', description: 'Updated name' }, { id: 'expense-33' }] },
    });
    await expect(api.get('/expenses/expense-31')).resolves.toMatchObject({
      data: { success: true, data: { id: 'expense-31', description: 'Updated name', revision: 2 } },
    });
    await expect(api.get('/expenses/expense-32')).rejects.toMatchObject({ code: 'OFFLINE' });
  });

  it('does not reconcile an incomplete expense response', async () => {
    const confirmed = { id: 'expense-39', amount: 39, type: 'personal' };
    native.mockImplementation(config => response(config, { success: true, data: [confirmed] }));
    await api.get('/expenses');
    await refreshServerData(false);
    native.mockImplementation(config => response(config, { success: true, data: [{}] }));
    await expect(api.get('/expenses')).rejects.toThrow('Complete expense response is invalid');
    expect(mockConfirmed.map(row => row.expense_id)).toEqual(['expense-39']);
  });

  it('stores numbered pages independently without deleting other confirmed expenses', async () => {
    const first = { id: 'page-expense-1', amount: 10, type: 'personal' };
    const second = { id: 'page-expense-2', amount: 20, type: 'personal' };
    native.mockImplementation(config => response(config, !config.params
      ? { success: true, data: [first, second] }
      : {
        success: true, data: config.params.page === 2 ? [second] : [first],
        pageInfo: { page: config.params.page, limit: 1, hasMore: config.params.page === 1,
          nextPage: config.params.page === 1 ? 2 : null },
        summary: { count: 2, totalAmount: 30 },
      }));
    await api.get('/expenses');
    await api.get('/expenses', { params: { limit: 1, page: 1 } });
    await api.get('/expenses', { params: { limit: 1, page: 2 } });
    expect(mockConfirmed.map(row => row.expense_id).sort()).toEqual([first.id, second.id]);
    setDataOnline(false);
    await expect(api.get('/expenses', { params: { limit: 1, page: 1 } })).resolves.toMatchObject({
      data: { data: [{ id: first.id }], summary: { count: 2, totalAmount: 30 } },
    });
    await expect(api.get('/expenses', { params: { limit: 1, page: 2 } })).resolves.toMatchObject({
      data: { data: [{ id: second.id }], pageInfo: { hasMore: false } },
    });
    await expect(api.get('/expenses', { params: { limit: 1, page: 3 } }))
      .rejects.toMatchObject({ code: 'OFFLINE' });
  });

  it('does not replace bounded pages with a complete expense list during reconciliation', async () => {
    const rows = [
      { id: 'bounded-1', amount: 10, type: 'personal' },
      { id: 'bounded-2', amount: 20, type: 'personal' },
    ];
    native.mockImplementation(config => response(config, config.params ? {
      success: true, data: [rows[0]], budget: 50, summary: { count: 2, monthlySpent: 30 },
      pageInfo: { page: 1, limit: 1, hasMore: true, nextPage: 2 },
    } : { success: true, data: rows }));
    await api.get('/expenses/personal', { params: { limit: 1 } });
    await api.get('/expenses');
    setDataOnline(false);
    await expect(api.get('/expenses/personal', { params: { limit: 1 } }))
      .rejects.toMatchObject({ code: 'OFFLINE' });
    expect(mockConfirmed).toHaveLength(2);
  });

  it.each([
    ['2026-11-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z'],
    ['2026-11-01T00:00:00+05:45', '2026-12-01T00:00:00+05:45'],
    ['2026-11-01T00:00:00-04:00', '2026-12-01T00:00:00-05:00'],
  ])('rebuilds cached personal summaries from complete data for %s', async (monthStart, monthEnd) => {
    const inMonth = { id: 'expense-36', amount: 36, date: '2026-11-02', type: 'personal' };
    const outOfMonth = { id: 'expense-37', amount: 37, date: '2026-10-02', type: 'personal' };
    native.mockImplementation(config => response(config, config.url === '/expenses/personal'
      ? { success: true, data: [inMonth, outOfMonth], budget: 25000, summary: { count: 2, monthlySpent: 36 } }
      : { success: true, data: [inMonth, outOfMonth] }));
    await api.get('/expenses/personal', { params: { monthStart, monthEnd } });
    await refreshServerData(false);
    const changed = { ...inMonth, amount: 40 };
    native.mockImplementation(config => response(config, { success: true, data: [changed, outOfMonth] }));
    await api.get('/expenses');
    setDataOnline(false);
    await expect(api.get('/expenses/personal', { params: { monthStart, monthEnd } })).resolves.toMatchObject({
      data: {
        budget: 25000,
        data: [expect.objectContaining({ id: 'expense-36', amount: 40 }),
          expect.objectContaining({ id: 'expense-37', amount: 37 })],
        summary: { count: 2, monthlySpent: 40 },
      },
    });
  });

  it('removes revoked group data from local snapshots after a complete group response', async () => {
    const first = { id: 'group-expense-1', groupId: 'group-1', amount: 10, type: 'group' };
    const revoked = { id: 'group-expense-2', groupId: 'group-2', amount: 20, type: 'group' };
    const personal = { id: 'personal-expense-1', amount: 30, type: 'personal' };
    native.mockImplementation(config => {
      if (config.url === '/groups') return response(config, {
        success: true, data: [{ id: 'group-1' }, { id: 'group-2' }],
      });
      if (config.url === '/groups/group-2') return response(config, {
        success: true, data: { id: 'group-2', name: 'Revoked' },
      });
      if (config.url === '/expenses') return response(config, {
        success: true, data: [first, revoked, personal],
      });
      if (config.url === '/expenses/group/group-2') return response(config, {
        success: true, data: [revoked],
      });
      if (config.url === '/expenses/group/group-1') return response(config, {
        success: true, data: [first],
      });
      if (config.url === '/expenses/group-expense-2') return response(config, {
        success: true, data: revoked,
      });
      return response(config);
    });
    await api.get('/expenses');
    await api.get('/expenses/group/group-1');
    await api.get('/expenses/group/group-2');
    await api.get('/expenses/group-expense-2');
    await api.get('/groups/group-2');
    await new Promise(resolve => setTimeout(resolve, 550));
    await refreshServerData(false);
    native.mockImplementation(config => response(config, {
      success: true, data: [{ id: 'group-1' }],
    }));
    await api.get('/groups');
    expect(queryClient.getQueryData(['user-a', '/groups/group-2', null])).toBeUndefined();
    expect(queryClient.getQueryData(['user-a', '/expenses/group/group-2', null])).toBeUndefined();
    expect(queryClient.getQueryData(['user-a', '/expenses/group-expense-2', null])).toBeUndefined();
    setDataOnline(false);
    await expect(api.get('/groups/group-2')).rejects.toMatchObject({ code: 'OFFLINE' });
    await expect(api.get('/expenses/group/group-2')).rejects.toMatchObject({ code: 'OFFLINE' });
    await expect(api.get('/expenses/group-expense-2')).rejects.toMatchObject({ code: 'OFFLINE' });
    await expect(api.get('/expenses')).resolves.toMatchObject({
      data: { data: [expect.objectContaining({ id: 'group-expense-1' }),
        expect.objectContaining({ id: 'personal-expense-1' })] },
    });
    expect(mockConfirmed.map(row => row.expense_id).sort()).toEqual(['group-expense-1', 'personal-expense-1']);
  });

  it('coalesces an unattempted local create edit and cancels its delete', async () => {
    const confirmed = { id: 'expense-41', amount: 41, type: 'personal' };
    native.mockImplementation(config => response(config, config.url === '/expenses'
      ? { success: true, data: [confirmed] } : config.url === '/offline-capabilities' ? capable : undefined));
    await api.get('/expenses');
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.post('/expenses/personal', {
      description: 'Lunch', amount: 12, date: '2026-11-01', type: 'personal',
    })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    const localId = `local-${getDataState().queue[0].id}`;
    await expect(api.get('/expenses')).resolves.toMatchObject({
      data: { data: expect.arrayContaining([expect.objectContaining({ id: localId, offlinePending: true })]) },
    });
    await expect(api.put(`/expenses/${localId}`, { description: 'Updated lunch' }))
      .rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    expect(JSON.parse(getDataState().queue[0].body!).description).toBe('Updated lunch');
    await expect(api.delete(`/expenses/${localId}`)).resolves.toMatchObject({
      data: { cancelledBeforeSync: true },
    });
    expect(getDataState().queue).toHaveLength(0);
    await expect(api.get('/expenses')).resolves.toMatchObject({
      data: { data: [expect.objectContaining({ id: 'expense-41' })] },
    });
  });

    it.each([
      ['equal', [333, 333, 333]],
      ['percentage', [111, 222, 666]],
      ['shares', [111, 222, 666]],
    ])('recalculates an unattempted offline %s expense when its total changes from 99 to 999', async (splitType, expected) => {
      await api.get('/offline-capabilities');
      setDataOnline(false);
      await expect(api.post('/expenses/unequal', {
        groupId: 'group-1', type: 'group', description: 'Offline allocation edit',
        amount: 99, paidBy: 'member-1', participants: ['member-1', 'member-2', 'member-3'],
        payers: [{ name: 'member-1', amountPaid: 99 }], splitType,
        splits: [
          { participant: 'member-1', amount: 11 },
          { participant: 'member-2', amount: 22 },
          { participant: 'member-3', amount: 66 },
        ],
      })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
      const original = getDataState().queue[0];
      await expect(api.put(`/expenses/local-${original.id}`, { amount: 999 }))
        .rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
      const updated = getDataState().queue[0];
      const body = JSON.parse(updated.body!);
      expect(updated).toMatchObject({ id: original.id, attemptedAt: null, status: 'pending' });
      expect(body.amount).toBe(999);
      expect(body.payers).toEqual([{ name: 'member-1', amountPaid: 999 }]);
      expect(body.splits.map((split: { amount: number }) => split.amount)).toEqual(expected);
      native.mockImplementation(config => response(config, config.url === '/offline-capabilities'
        ? capable : { success: true, data: { id: 'resized-expense', revision: 0 } }));
      setDataOnline(true);
      await replayQueuedExpenses();
      const sent = native.mock.calls.find(([config]) => config.method === 'post')![0];
      expect(JSON.parse(sent.data)).toEqual(body);
      expect(sent.headers.get('Idempotency-Key')).toBe(original.id);
      expect(getDataState().queue[0].status).toBe('synced');
    });

    it('keeps fixed unequal amounts unchanged unless explicitly updated', async () => {
      await api.get('/offline-capabilities');
      setDataOnline(false);
      await expect(api.post('/expenses/unequal', {
        groupId: 'group-1', type: 'group', amount: 99, paidBy: 'member-1',
        participants: ['member-1', 'member-2'], splitType: 'unequal',
        payers: [{ name: 'member-1', amountPaid: 99 }],
        splits: [{ participant: 'member-1', amount: 40 }, { participant: 'member-2', amount: 59 }],
      })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
      const original = { ...getDataState().queue[0] };
      await expect(api.put(`/expenses/local-${original.id}`, { amount: 999 }))
        .rejects.toThrow('Unequal splits use fixed amounts');
      expect(getDataState().queue[0]).toEqual(original);
      await expect(api.put(`/expenses/local-${original.id}`, {
        amount: 999,
        splits: [{ participant: 'member-1', amount: 400 }, { participant: 'member-2', amount: 599 }],
      })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
      expect(JSON.parse(getDataState().queue[0].body!).payers).toEqual([{ name: 'member-1', amountPaid: 999 }]);
    });

    it('rounds resized payer and split proportions to cents without losing the total', async () => {
      await api.get('/offline-capabilities');
      setDataOnline(false);
      await expect(api.post('/expenses/unequal', {
        groupId: 'group-1', type: 'group', amount: 99, paidBy: '',
        participants: ['a', 'b', 'c'], splitType: 'shares',
        payers: [{ name: 'a', amountPaid: 33 }, { name: 'b', amountPaid: 66 }],
        splits: ['a', 'b', 'c'].map(participant => ({ participant, amount: 33 })),
      })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
      const original = getDataState().queue[0];
      await expect(api.put(`/expenses/local-${original.id}`, { amount: 100 }))
        .rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
      const body = JSON.parse(getDataState().queue[0].body!);
      expect(body.payers.map((payer: { amountPaid: number }) => payer.amountPaid)).toEqual([33.33, 66.67]);
      expect(body.splits.map((split: { amount: number }) => split.amount)).toEqual([33.34, 33.33, 33.33]);
    });

  it('maps replayed local creates before queuing later revision-bound edits', async () => {
    const created = {
      id: 'server-expense-51', description: 'Shared meal', amount: 51,
      groupId: 'group-1', paidBy: 'member-1', participants: ['member-1'],
      date: '2026-11-01', createdAt: '2026-11-01', revision: 0, type: 'group',
    };
    native.mockImplementation(config => {
      if (config.url === '/offline-capabilities') return response(config, capable);
      if (config.method === 'post') return response(config, { success: true, data: created });
      if (config.url === '/expenses') return response(config, { success: true, data: [] });
      return response(config, { success: true, data: created });
    });
    await api.get('/expenses');
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.post('/expenses', created)).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    const localId = `local-${getDataState().queue[0].id}`;
    setDataOnline(true);
    await replayQueuedExpenses();
    expect(getDataState().queue[0].status).toBe('synced');
    await endDataSession();
    await startDataSession(token('user-a'));
    setDataOnline(false);
    await expect(api.get(`/expenses/${localId}`)).resolves.toMatchObject({
      data: { success: true, data: { id: 'server-expense-51', revision: 0 } },
    });
    setDataOnline(true);
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.put(`/expenses/${localId}`, { description: 'Changed meal' }, {
      headers: { 'If-Match': '"0"' },
    })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    expect(getDataState().queue.at(-1)).toMatchObject({
      method: 'put', path: '/expenses/server-expense-51', expenseId: 'server-expense-51', revision: 0,
    });
    setDataOnline(true);
    await replayQueuedExpenses();
    expect(getDataState().queue.at(-1)?.status).toBe('synced');
    expect(native.mock.calls.some(([config]) =>
      config.url === '/expenses/server-expense-51' && config.headers.get('If-Match') === '"0"')).toBe(true);
  });

  it('keeps expense drafts across restart but isolates them by account', async () => {
    const draft = { amount: '25', description: 'Groceries' };
    await saveExpenseDraft('personal-create', draft);
    await endDataSession();
    await startDataSession(token('user-a'));
    await expect(loadExpenseDraft('personal-create')).resolves.toEqual(draft);
    await startDataSession(token('user-b'));
    await expect(loadExpenseDraft('personal-create')).resolves.toBeNull();
    await saveExpenseDraft('personal-create', { amount: '10' });
    await deleteExpenseDraft('personal-create');
    await expect(loadExpenseDraft('personal-create')).resolves.toBeNull();
    await startDataSession(token('user-a'));
    await expect(loadExpenseDraft('personal-create')).resolves.toEqual(draft);
  });

  it('journals offline updates with their loaded revision and replays using the same key', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.put('/expenses/expense-1', { description: 'Updated' }, {
      headers: { 'If-Match': '"4"' },
    })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    const operation = getDataState().queue[0];
    expect(operation).toMatchObject({
      method: 'put', expenseId: 'expense-1', revision: 4, attemptedAt: null,
    });
    setDataOnline(true);
    await replayQueuedExpenses();
    const sent = native.mock.calls.find(([config]) => config.method === 'put')![0];
    expect(sent.headers.get('Idempotency-Key')).toBe(operation.id);
    expect(sent.headers.get('If-Match')).toBe('"4"');
    expect(getDataState().queue[0].status).toBe('synced');
  });

  it('journals bodyless deletes and replays the original revision', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.delete('/expenses/expense-2', {
      headers: { 'If-Match': '"8"' },
    })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    const operation = getDataState().queue[0];
    expect(operation).toMatchObject({ method: 'delete', body: null, revision: 8 });
    setDataOnline(true);
    await replayQueuedExpenses();
    const sent = native.mock.calls.find(([config]) => config.method === 'delete')![0];
    expect(sent.headers.get('Idempotency-Key')).toBe(operation.id);
    expect(sent.headers.get('If-Match')).toBe('"8"');
    expect(getDataState().queue[0].status).toBe('synced');
  });

  it('replays an ambiguous edit with its exact key, payload, and revision after restart', async () => {
    await api.get('/offline-capabilities');
    native.mockImplementationOnce(config => response(config, capable))
      .mockImplementationOnce(config => { throw new AxiosError('Lost response', 'ERR_NETWORK', config); });
    await expect(api.put('/expenses/expense-3', { amount: 25 }, {
      headers: { 'If-Match': '"6"' },
    })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    const operation = getDataState().queue[0];
    expect(operation.attemptedAt).not.toBeNull();
    await endDataSession();
    await startDataSession(token('user-a'));
    setDataOnline(true);
    await api.get('/users/profile');
    await replayQueuedExpenses();
    const edits = native.mock.calls.filter(([config]) => config.method === 'put');
    expect(edits).toHaveLength(2);
    const sent = edits.slice(-1)[0][0];
    expect(sent.data).toBe(operation.body);
    expect(sent.headers.get('Idempotency-Key')).toBe(operation.id);
    expect(sent.headers.get('If-Match')).toBe('"6"');
    expect(getDataState().queue[0].status).toBe('synced');
  });

  it('keeps stale-revision mutation conflicts for review without automatic retry', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.put('/expenses/expense-4', { amount: 21 }, {
      headers: { 'If-Match': '"2"' },
    })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    native.mockImplementation(config => {
      if (config.method === 'put') {
        throw new AxiosError('Stale revision', 'ERR_BAD_REQUEST', config, undefined, {
          ...response(config), status: 409,
        });
      }
      return response(config, capable);
    });
    setDataOnline(true);
    await replayQueuedExpenses();
    expect(getDataState().queue[0]).toMatchObject({
      status: 'failed', revision: 2, message: expect.stringContaining('409'),
    });
    const count = native.mock.calls.filter(([config]) => config.method === 'put').length;
    await replayQueuedExpenses();
    expect(native.mock.calls.filter(([config]) => config.method === 'put')).toHaveLength(count);
  });

  it('does not let users discard a possibly attempted operation', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    native.mockImplementation(config => {
      if (config.method === 'post') throw new AxiosError('Lost response', 'ERR_NETWORK', config);
      return response(config, capable);
    });
    setDataOnline(true);
    await replayQueuedExpenses();
    expect(getDataState().queue[0].attemptedAt).not.toBeNull();
    await expect(dismissQueuedExpense(getDataState().queue[0].id)).rejects.toThrow('cannot be removed');
    expect(getDataState().queue).toHaveLength(1);
  });

  it('keeps lost-response writes pending and retries with the same key', async () => {
    native.mockImplementationOnce(config => response(config, capable))
      .mockImplementationOnce(config => { throw new AxiosError('connection lost', 'ERR_NETWORK', config); });
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    const id = getDataState().queue[0].id;
    setDataOnline(true);
    await replayQueuedExpenses();
    const posts = native.mock.calls.filter(([config]) => config.method === 'post');
    expect(posts).toHaveLength(2);
    expect(posts.every(([config]) => config.headers.get('Idempotency-Key') === id)).toBe(true);
    expect(getDataState().queue[0].status).toBe('synced');
  });

  it('retains pending writes only for their account across logout', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    await endDataSession();
    await startDataSession(token('user-b'));
    expect(getDataState().queue).toHaveLength(0);
    await startDataSession(token('user-a'));
    expect(getDataState().queue).toHaveLength(1);
  });

  it('rejects overlapping enqueues rather than losing a saved expense', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    const results = await Promise.allSettled([
      api.post('/expenses', { amount: 10 }), api.post('/expenses', { amount: 20 }),
    ]);
    expect(results.map(result => result.status === 'rejected' && result.reason.code))
      .toEqual(['OFFLINE_QUEUED', 'SYNC_BUSY']);
    expect(getDataState().queue).toHaveLength(1);
  });

  it('never sends a write after journal persistence fails', async () => {
    await api.get('/offline-capabilities');
    mockFailNextSqlWrite = true;
    await expect(api.post('/expenses', { amount: 10 })).rejects.toThrow('SQLite full');
    expect(native.mock.calls.filter(([config]) => config.method === 'post')).toHaveLength(0);
    expect(getDataState().queue).toHaveLength(0);
    expect(getDataState().error).toContain('Could not save');
  });

  it('requires known backend support for offline writes', async () => {
    setDataOnline(false);
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({
      code: 'OFFLINE', message: expect.stringContaining('Connect to the server once'),
    });
    expect(getDataState().queue).toHaveLength(0);
  });

  it('queues the first offline expense after online capability preparation, including after restart', async () => {
    await api.get('/offline-capabilities');
    await new Promise(resolve => setTimeout(resolve, 600));
    const snapshot = disk.get('server-cache:v1:user-a')!;
    await endDataSession();
    disk.set('server-cache:v1:user-a', snapshot);
    await startDataSession(token('user-a'));
    setDataOnline(false);
    const calls = native.mock.calls.length;
    await expect(api.post('/expenses/personal', { description: 'Offline first', amount: 10 }))
      .rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    expect(native).toHaveBeenCalledTimes(calls);
    expect(getDataState().queue).toHaveLength(1);
    expect(getDataState().queue[0]).toMatchObject({ status: 'pending', attemptedAt: null });
  });

  it('stops replay on unauthorized without dropping pending work', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    const unauthorized = jest.fn(async () => { await endDataSession(); });
    setDataUnauthorizedHandler(unauthorized);
    native.mockImplementationOnce(config => {
      throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, {
        ...response(config), status: 401,
      });
    });
    setDataOnline(true);
    await replayQueuedExpenses();
    expect(unauthorized).toHaveBeenCalledTimes(1);
    await startDataSession(token('user-a'));
    expect(getDataState().queue[0].status).toBe('pending');
  });

  it('does not overwrite invalid saved journal entries', async () => {
    disk.set('offline-expenses:v1:user-b', '[{"bad":"entry"}]');
    await expect(startDataSession(token('user-b'))).rejects.toThrow('have not been overwritten');
    expect(disk.get('offline-expenses:v1:user-b')).toBe('[{"bad":"entry"}]');
  });

  it('removes synced local receipts without issuing a server delete', async () => {
    await api.post('/expenses', { amount: 10 });
    const count = native.mock.calls.length;
    await dismissQueuedExpense(getDataState().queue[0].id);
    expect(getDataState().queue).toHaveLength(0);
    expect(native).toHaveBeenCalledTimes(count);
  });

  it('cancels one consumer without cancelling the shared read for another', async () => {
    let complete!: () => void;
    let signal: AbortSignal | undefined;
    native.mockImplementationOnce(config => new Promise(resolve => {
      signal = config.signal;
      complete = () => resolve(response(config));
    }));
    const controller = new AbortController();
    const first = api.get('/groups', { signal: controller.signal }).catch(error => error);
    const second = api.get('/groups');
    await new Promise(resolve => setTimeout(resolve, 0));
    controller.abort();
    expect(await first).toMatchObject({ code: 'ERR_CANCELED' });
    expect(signal?.aborted).toBe(false);
    expect(getDataState().online).toBe(true);
    complete();
    await expect(second).resolves.toMatchObject({ status: 200 });
    expect(native).toHaveBeenCalledTimes(1);
  });

  it('isolates the same account cache and journal across API servers', async () => {
    await startDataSession(token('user-a'), 'https://staging.invalid/api');
    await api.get('/groups');
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    await startDataSession(token('user-a'), 'https://production.invalid/api');
    expect(getDataState().queue).toHaveLength(0);
    await expect(api.get('/groups')).rejects.toMatchObject({ code: 'OFFLINE' });
  });

  it('keeps rejected replay for manual review and never auto retries it', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    native.mockImplementation(config => {
      if (config.method === 'post') throw new AxiosError('Review required', 'ERR_BAD_REQUEST', config,
        undefined, { ...response(config), status: 409 });
      return response(config, capable);
    });
    setDataOnline(true);
    await replayQueuedExpenses();
    expect(getDataState().queue[0]).toMatchObject({ status: 'failed', message: expect.stringContaining('409') });
    const count = native.mock.calls.length;
    await replayQueuedExpenses();
    expect(native).toHaveBeenCalledTimes(count);
    expect(getDataState().queue[0].status).toBe('failed');
  });

  it.each([false, true])('preserves the server conflict message (raw JSON: %s)', async raw => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.post('/expenses/unequal', { amount: 10 })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    const body = { message: 'This expense request is in progress or its outcome is uncertain.' };
    native.mockImplementation(config => {
      if (config.method === 'post') throw new AxiosError('Conflict', 'ERR_BAD_REQUEST', config, undefined, {
        ...response(config), status: 409, data: raw ? JSON.stringify(body) : body,
      });
      return response(config, capable);
    });
    setDataOnline(true);
    await replayQueuedExpenses();
    expect(getDataState().queue[0].message).toBe(`Sync rejected (409). ${body.message}`);
    expect(getDataState().error).toBe(`Sync rejected (409). ${body.message}`);
    await expect(dismissQueuedExpense(getDataState().queue[0].id)).rejects.toThrow('cannot be removed');
  });

  it.each(['post', 'put', 'delete'])('retries a rejected %s only explicitly, with the original key, data and revision', async method => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    const path = method === 'post' ? '/expenses/unequal' : '/expenses/existing-expense';
    await expect(api.request({
      method, url: path, ...(method === 'delete' ? {} : { data: { amount: 10 } }),
      ...(method === 'post' ? {} : { headers: { 'If-Match': '"3"' } }),
    })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    native.mockImplementation(config => {
      if (config.url === path) throw new AxiosError('Conflict', 'ERR_BAD_REQUEST', config, undefined, {
        ...response(config, { message: 'Outcome uncertain. Review required.' }), status: 409,
      });
      return response(config, capable);
    });
    setDataOnline(true);
    await replayQueuedExpenses();
    const original = { ...getDataState().queue[0] };
    expect(original.status).toBe('failed');
    await replayQueuedExpenses();
    expect(native.mock.calls.filter(([config]) => config.url === path)).toHaveLength(1);
    native.mockImplementation(config => response(config, config.url === '/offline-capabilities'
      ? capable : { success: true, data: { id: 'confirmed-expense', revision: 4 } }));
    await retryQueuedExpense(original.id);
    const writes = native.mock.calls.filter(([config]) => config.url === path).map(([config]) => config);
    expect(writes).toHaveLength(2);
    expect(writes[1].data).toBe(writes[0].data);
    expect(writes[1].headers.get('Idempotency-Key')).toBe(original.id);
    expect(writes[1].headers.get('If-Match')).toBe(writes[0].headers.get('If-Match'));
    expect(getDataState().queue[0]).toMatchObject({
      id: original.id, status: 'synced', attemptedAt: original.attemptedAt,
    });
    await expect(retryQueuedExpense(original.id)).rejects.toThrow('Only entries needing review');
  });

  it('does not retry a rejected entry offline', async () => {
    setDataOnline(false);
    await expect(retryQueuedExpense('unknown')).rejects.toThrow('Connect to retry');
    expect(native).not.toHaveBeenCalled();
  });

  it('blocks replay after a server rollback and recovers after support returns', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    native.mockImplementation(config => response(config, { data: { expenseCreateIdempotency: false } }));
    setDataOnline(true);
    await replayQueuedExpenses();
    expect(getDataState().error).toContain('Could not confirm');
    expect(getDataState().queue[0].status).toBe('pending');
    expect(native.mock.calls.filter(([config]) => config.method === 'post')).toHaveLength(0);
    native.mockImplementation(config => response(config, config.url === '/offline-capabilities'
      ? capable : { success: true, data: { id: 'server-recovered', revision: 0 } }));
    await replayQueuedExpenses();
    expect(getDataState().error).toBeNull();
    expect(getDataState().queue[0].status).toBe('synced');
  });

  it('marks missing idempotency confirmation for review rather than unsafe replay', async () => {
    native.mockImplementation(config => ({
      ...response(config, capable),
      headers: new AxiosHeaders(),
    }));
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({ code: 'SYNC_UNCONFIRMED' });
    expect(getDataState().queue[0].status).toBe('failed');
    await replayQueuedExpenses();
    expect(native.mock.calls.filter(([config]) => config.method === 'post')).toHaveLength(1);
  });

  it('clears a storage error only after local persistence recovers', async () => {
    await api.get('/offline-capabilities');
    setDataOnline(false);
    mockFailNextSqlWrite = true;
    await expect(api.post('/expenses', { amount: 10 })).rejects.toThrow('SQLite full');
    expect(getDataState().error).toContain('Could not save');
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({ code: 'OFFLINE_QUEUED' });
    expect(getDataState().error).toBeNull();
  });

  it('rejects expired credentials and expired offline capabilities', async () => {
    await api.get('/offline-capabilities');
    queryClient.setQueryData(['user-a', '/offline-capabilities', null],
      { data: JSON.stringify(capable), status: 200, statusText: 'OK' },
      { updatedAt: Date.now() - 24 * 60 * 60 * 1000 - 1 });
    setDataOnline(false);
    await expect(api.post('/expenses', { amount: 10 })).rejects.toMatchObject({ code: 'OFFLINE' });
    const expired = `header.${Buffer.from(JSON.stringify({ id: 'user-a', exp: 1 })).toString('base64url')}.signature`;
    await expect(startDataSession(expired)).rejects.toThrow('Invalid or expired');
    expect(getDataState().queue).toHaveLength(0);
  });

  it('never journals an old-account create after a capability request finishes late', async () => {
    let complete!: () => void;
    native.mockImplementationOnce(config => new Promise(resolve => {
      complete = () => resolve(response(config, capable));
    }));
    const pending = api.post('/expenses', { amount: 10 }).catch(error => error);
    await new Promise(resolve => setTimeout(resolve, 0));
    await startDataSession(token('user-b'));
    complete();
    expect(await pending).toMatchObject({ code: 'ERR_CANCELED' });
    expect(getDataState().queue).toHaveLength(0);
    expect(disk.has('offline-expenses:v1:user-b')).toBe(false);
  });
});
