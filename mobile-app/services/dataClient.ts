import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import * as Crypto from 'expo-crypto';
import {
  importLegacyExpenseOperations,
  deleteExpenseDraft as deleteStoredExpenseDraft,
  loadConfirmedExpense,
  loadExpenseDraft as loadStoredExpenseDraft,
  loadExpenseOperations,
  loadExpenseSnapshot,
  loadLocalExpenseId,
  reconcileExpenseGroupAccess,
  replaceExpenseOperations,
  saveLocalExpenseId,
  saveExpenseDraft as saveStoredExpenseDraft,
  saveExpenseSnapshot,
} from './offlineStore';

const MAX_AGE = 24 * 60 * 60 * 1000;
const STALE_TIME = 30_000;
const CACHE_VERSION = 1;
const CREATE_PATHS = new Set(['/expenses', '/expenses/personal', '/expenses/unequal']);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: STALE_TIME, gcTime: MAX_AGE, retry: false, networkMode: 'always' },
  },
});

export interface QueuedExpense {
  id: string;
  path: string;
  method: 'post' | 'put' | 'delete';
  body: string | null;
  createdAt: number;
  attemptedAt: number | null;
  status: 'pending' | 'failed' | 'synced';
  message?: string;
  expenseId?: string;
  revision?: number;
}

interface DataState {
  online: boolean;
  ready: boolean;
  queue: QueuedExpense[];
  error: string | null;
  revision: number;
  lastExpenseSyncAt: number | null;
  syncing: boolean;
}

interface LegacyQueuedExpense {
  id: string;
  path: string;
  body: string;
  createdAt: number;
  status: 'pending' | 'failed' | 'synced';
  message?: string;
}

let state: DataState = {
  online: true, ready: false, queue: [], error: null, revision: 0, lastExpenseSyncAt: null, syncing: false,
};
let account: string | null = null;
let session = 0;
let credential: string | null = null;
let serverScope = '';
let persistence = Promise.resolve();
let replay: Promise<void> | null = null;
let adapter: AxiosAdapter | null = null;
let baseConfig: InternalAxiosRequestConfig | null = null;
let cacheTimer: ReturnType<typeof setTimeout> | undefined;
let creating = false;
let expiresAt = 0;
let unauthorized: (() => Promise<void>) | null = null;
let sessionAbort = new AbortController();
const listeners = new Set<() => void>();

export const subscribeData = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const getDataState = () => state;
export const setDataUnauthorizedHandler = (handler: () => Promise<void>) => { unauthorized = handler; };

function updateState(update: Partial<DataState>) {
  state = { ...state, ...update };
  listeners.forEach(listener => listener());
}

function report(error: unknown, message: string) {
  console.error(message, error);
  updateState({ error: message });
}

function expenseFailureMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Sync failed. Review this expense.';
  }
  if (!error.response) return error.message;
  const data: unknown = error.response?.data;
  let body: unknown = data;
  if (typeof data === 'string') {
    try {
      body = JSON.parse(data);
    } catch {
      body = null;
    }
  }
  const message = body && typeof body === 'object' && 'message' in body &&
    typeof body.message === 'string' ? body.message.trim() : '';
  const status = error.response?.status;
  return `Sync rejected${status ? ` (${status})` : ''}. ${
    message || 'The server did not confirm this expense. Review before retrying.'
  }`;
}

function logCache(outcome: 'HIT' | 'MISS', path: string, source: string) {
  console.log(`[cache] ${outcome} GET ${path} (${source})`);
}

function cacheKey(userId: string) { return `server-cache:v${CACHE_VERSION}:${userId}`; }
function queueKey(userId: string) { return `offline-expenses:v1:${userId}`; }

function validQueue(value: unknown): value is QueuedExpense[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every(item => {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) ||
      typeof item.path !== 'string' || !['post', 'put', 'delete'].includes(item.method) ||
      (item.body !== null && typeof item.body !== 'string') ||
      !Number.isFinite(item.createdAt) || !['pending', 'failed', 'synced'].includes(item.status) ||
      (item.attemptedAt !== null && !Number.isFinite(item.attemptedAt)) ||
      (item.message !== undefined && typeof item.message !== 'string')) return false;
    ids.add(item.id);
    if (item.method === 'post') {
      if (!CREATE_PATHS.has(item.path) || typeof item.body !== 'string') return false;
    } else if (!/^\/expenses\/[^/]+$/.test(item.path) ||
      typeof item.expenseId !== 'string' || !Number.isSafeInteger(item.revision) || item.revision < 0 ||
      (item.method === 'delete' && item.body !== null) ||
      (item.method === 'put' && typeof item.body !== 'string')) {
      return false;
    }
    if (item.body === null) return item.method === 'delete';
    try {
      const body: unknown = JSON.parse(item.body);
      return typeof body === 'object' && body !== null && !Array.isArray(body);
    } catch {
      return false;
    }
  });
}

function validLegacyQueue(value: unknown): value is LegacyQueuedExpense[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every(item => {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) ||
      !CREATE_PATHS.has(item.path) || typeof item.body !== 'string' ||
      !Number.isFinite(item.createdAt) || !['pending', 'failed', 'synced'].includes(item.status) ||
      (item.message !== undefined && typeof item.message !== 'string')) return false;
    ids.add(item.id);
    try {
      const body: unknown = JSON.parse(item.body);
      return typeof body === 'object' && body !== null && !Array.isArray(body);
    } catch {
      return false;
    }
  });
}

function isExpenseRead(path: string) {
  return path === '/expenses' || path === '/expenses/personal' ||
    path.startsWith('/expenses/group/') || /^\/expenses\/[^/]+$/.test(path);
}

function expenseSnapshotKey(path: string, params: unknown) {
  return JSON.stringify([path, params ?? null]);
}

export function isLocalExpenseId(id: string) {
  return id.startsWith('local-');
}

function localExpenseId(operationId: string) {
  return `local-${operationId}`;
}

function queuedCreateForLocalId(id: string) {
  const operationId = id.slice('local-'.length);
  return state.queue.find(item => item.id === operationId && item.method === 'post' && item.status !== 'synced');
}

function resizeLocalExpense(create: Record<string, unknown>, updates: Record<string, unknown>) {
  const next = { ...create, ...updates };
  if (create.type === 'personal' || (!create.groupId && !next.groupId)) return next;
  const amountChanged = updates.amount !== undefined && updates.amount !== create.amount;
  const participantsChanged = updates.participants !== undefined &&
    JSON.stringify(updates.participants) !== JSON.stringify(create.participants);
  const payerChanged = updates.paidBy !== undefined && updates.paidBy !== create.paidBy;
  if (!amountChanged && !participantsChanged && !payerChanged) return next;
  if (typeof next.amount !== 'number' || !Number.isFinite(next.amount) || next.amount <= 0 ||
      !Number.isSafeInteger(Math.round(next.amount * 100))) {
    throw new Error('Enter a valid expense amount before saving.');
  }
  const total = Math.round(next.amount * 100);
  const allocate = (weights: number[]) => {
    const sum = weights.reduce((sum, weight) => sum + weight, 0);
    if (!weights.length || !Number.isFinite(sum) || sum <= 0 ||
        weights.some(weight => !Number.isFinite(weight) || weight < 0)) {
      throw new Error('Expense allocations are invalid. Review payer and split amounts.');
    }
    const rows = weights.map((weight, index) => {
      const exact = total * (weight / sum);
      return { index, cents: Math.floor(exact), fraction: exact - Math.floor(exact) };
    });
    const remainder = total - rows.reduce((sum, row) => sum + row.cents, 0);
    const ranked = [...rows].sort((a, b) => b.fraction - a.fraction || a.index - b.index);
    for (let i = 0; i < remainder; i++) ranked[i % ranked.length].cents++;
    return rows.map(row => row.cents / 100);
  };
  if (updates.payers === undefined && (amountChanged || payerChanged)) {
    if (payerChanged) {
      if (typeof next.paidBy !== 'string' || !next.paidBy || next.paidBy === 'Multiple') {
        throw new Error('Select a payer or provide explicit payer amounts.');
      }
      next.payers = [{ name: next.paidBy, amountPaid: next.amount }];
    } else if (Array.isArray(create.payers) && create.payers.length) {
      const payers = create.payers;
      if (!payers.every(payer => payer && typeof payer.name === 'string' && typeof payer.amountPaid === 'number')) {
        throw new Error('Saved payer amounts are invalid. Review this expense.');
      }
      const amounts = allocate(payers.map(payer => payer.amountPaid));
      next.payers = payers.map((payer, index) => ({ ...payer, amountPaid: amounts[index] }));
    }
  }
  if (updates.splits === undefined && (amountChanged || participantsChanged)) {
    if (next.splitType === 'equal' || next.splitType === undefined) {
      const participants = next.participants;
      if (!Array.isArray(participants) || !participants.every(id => typeof id === 'string')) {
        throw new Error('Select valid participants before saving.');
      }
      const amounts = allocate(participants.map(() => 1));
      next.splits = participants.map((participant, index) => ({ participant, amount: amounts[index] }));
    } else if (next.splitType === 'percentage' || next.splitType === 'shares') {
      if (participantsChanged || !Array.isArray(create.splits) ||
          !create.splits.every(split => split && typeof split.participant === 'string' && typeof split.amount === 'number')) {
        throw new Error('Review percentage or share allocations before changing participants.');
      }
      const splits = create.splits;
      const amounts = allocate(splits.map(split => split.amount));
      next.splits = splits.map((split, index) => ({ ...split, amount: amounts[index] }));
    } else {
      throw new Error('Unequal splits use fixed amounts. Update the split amounts explicitly before changing the total or participants.');
    }
  }
  return next;
}

function pendingExpense(item: QueuedExpense) {
  if (item.method !== 'post' || item.status !== 'pending' || !item.body) return null;
  const payload = JSON.parse(item.body) as Record<string, unknown>;
  const type = item.path === '/expenses/personal' ? 'personal' : 'group';
  return {
    ...payload,
    id: localExpenseId(item.id),
    groupId: typeof payload.groupId === 'string' ? payload.groupId : '',
    description: typeof payload.description === 'string' ? payload.description : '',
    amount: typeof payload.amount === 'number' ? payload.amount : 0,
    paidBy: typeof payload.paidBy === 'string' ? payload.paidBy : '',
    participants: Array.isArray(payload.participants) ? payload.participants : [],
    date: typeof payload.date === 'string' ? payload.date : new Date(item.createdAt).toISOString(),
    createdAt: new Date(item.createdAt).toISOString(),
    type,
    paymentMethod: typeof payload.paymentMethod === 'string' ? payload.paymentMethod : 'Cash',
    category: typeof payload.category === 'string' ? payload.category : 'Other',
    createdBy: typeof payload.createdBy === 'string' ? payload.createdBy : '',
    offlinePending: true,
  };
}

function overlayPendingExpenses(path: string, value: unknown, params?: { page?: number; type?: string; createdAfter?: string }) {
  if (params?.page && params.page > 1) return value;
  const body = typeof value === 'string' ? JSON.parse(value) as unknown : value;
  if (!body || typeof body !== 'object' || !('data' in body) || !Array.isArray(body.data)) return value;
  const groupId = path.startsWith('/expenses/group/') ? path.slice('/expenses/group/'.length) : null;
  const pending = state.queue.flatMap(item => {
    const expense = pendingExpense(item);
    if (!expense || (path === '/expenses/personal' && expense.type !== 'personal') ||
        (params?.type && expense.type !== params.type) ||
        (params?.createdAfter && expense.createdAt < params.createdAfter) ||
        (groupId !== null && expense.groupId !== groupId)) return [];
    return [expense];
  });
  if (!pending.length) return value;
  const existing = body.data as Array<{ id?: unknown }>;
  const ids = new Set(existing.map(expense => expense?.id));
  const additions = pending.filter(expense => !ids.has(expense.id));
  if (!additions.length) return value;
  return { ...body, data: [...existing, ...additions] };
}

function createdExpenseId(responseBody: unknown) {
  const body = typeof responseBody === 'string' ? JSON.parse(responseBody) as unknown : responseBody;
  if (!body || typeof body !== 'object' || !('data' in body) ||
      !body.data || typeof body.data !== 'object') return null;
  const data = body.data as { id?: unknown; _id?: unknown };
  const id = typeof data.id === 'string' ? data.id : data._id;
  return typeof id === 'string' && id ? { id, expense: { ...data, id } } : null;
}

async function saveCreatedExpenseMapping(userId: string, item: QueuedExpense, responseBody: unknown) {
  const created = createdExpenseId(responseBody);
  if (!created) throw new Error('Server confirmed the create but returned no expense ID. The saved operation remains for safe review.');
  await enqueuePersistence(() =>
    saveLocalExpenseId(userId, localExpenseId(item.id), created.id, created.expense));
}

async function reconcileAccessibleGroups(userId: string, responseBody: unknown, generation: number) {
  const body = typeof responseBody === 'string' ? JSON.parse(responseBody) as unknown : responseBody;
  if (!body || typeof body !== 'object' || !('success' in body) || body.success !== true ||
      !('data' in body) || !Array.isArray(body.data) ||
      !body.data.every(group => group && typeof group === 'object' && 'id' in group &&
        typeof group.id === 'string')) return;
  const groupIds = body.data.map(group => (group as { id: string }).id);
  const accessible = new Set(groupIds);
  await enqueuePersistence(() => reconcileExpenseGroupAccess(userId, groupIds));
  if (session !== generation || account !== userId) return;

  const isRevokedGroupQuery = (queryKey: readonly unknown[], cachedData?: unknown) => {
    if (queryKey[0] !== userId || typeof queryKey[1] !== 'string') return false;
    const path = queryKey[1];
    const groupPath = /^\/groups\/([^/]+)/.exec(path) || /^\/expenses\/group\/([^/]+)$/.exec(path);
    if (groupPath) return !accessible.has(groupPath[1]);
    if (!/^\/expenses\/[^/]+$/.test(path) || !cachedData || typeof cachedData !== 'object' ||
        !('data' in cachedData)) return false;
    const responseBody = (cachedData as { data: unknown }).data;
    let response: unknown;
    try {
      response = typeof responseBody === 'string' ? JSON.parse(responseBody) as unknown : responseBody;
    } catch {
      return false;
    }
    if (!response || typeof response !== 'object' || !('data' in response) ||
        !response.data || typeof response.data !== 'object' || !('groupId' in response.data) ||
        typeof response.data.groupId !== 'string') return false;
    return !accessible.has(response.data.groupId);
  };
  for (const query of queryClient.getQueryCache().getAll()) {
    if (isRevokedGroupQuery(query.queryKey, query.state.data)) {
      queryClient.removeQueries({ queryKey: query.queryKey, exact: true });
    }
  }
  await enqueuePersistence(async () => {
    const saved = await AsyncStorage.getItem(cacheKey(userId));
    if (!saved) return;
    const restored: unknown = JSON.parse(saved);
    if (!restored || typeof restored !== 'object' || !('client' in restored) ||
        !restored.client || typeof restored.client !== 'object' ||
        !('queries' in restored.client) || !Array.isArray(restored.client.queries)) {
      throw new Error('Saved server cache could not be reconciled with current group access.');
    }
    const queries = restored.client.queries.filter((query: { queryKey?: unknown }) =>
      !Array.isArray(query.queryKey) || !isRevokedGroupQuery(query.queryKey));
    if (queries.length !== restored.client.queries.length) {
      await AsyncStorage.setItem(cacheKey(userId), JSON.stringify({
        ...restored,
        client: { ...restored.client, queries },
      }));
    }
  });
}

export async function startDataSession(token: string, server = '') {
  if (credential === token && serverScope === server && account && state.ready) return true;
  const generation = ++session;
  sessionAbort.abort();
  sessionAbort = new AbortController();
  clearTimeout(cacheTimer);
  credential = token;
  serverScope = server;
  account = null;
  baseConfig = null;
  await persistence;
  if (session !== generation) return false;
  await queryClient.cancelQueries();
  if (session !== generation) return false;
  queryClient.clear();
  updateState({ ready: false, queue: [], error: null, lastExpenseSyncAt: null, syncing: false });
  // The server still verifies the token; the claim is only a local storage namespace.
  const payload: unknown = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  if (!payload || typeof payload !== 'object' || !('id' in payload) ||
    typeof payload.id !== 'string' || !payload.id ||
    !('exp' in payload) || typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
    throw new Error('Invalid or expired session. Please sign in again.');
  }
  const userId = server ? `${encodeURIComponent(server)}:${payload.id}` : payload.id;
  expiresAt = payload.exp * 1000;
  const [cached, queued] = await Promise.all([
    AsyncStorage.getItem(cacheKey(userId)),
    AsyncStorage.getItem(queueKey(userId)),
  ]);
  if (session !== generation) return false;
  if (cached) {
    try {
      const restored = JSON.parse(cached);
      if (restored.version === CACHE_VERSION && Number.isFinite(restored.savedAt) && restored.savedAt <= Date.now() &&
        Date.now() - restored.savedAt < MAX_AGE && Array.isArray(restored.client?.queries)) {
        const validQueries = restored.client.queries.filter((query: {
          queryKey?: unknown;
          state?: { status?: string; dataUpdatedAt?: number; data?: { status?: number; statusText?: string; data?: unknown } };
        }) => Array.isArray(query.queryKey) && query.queryKey[0] === userId &&
          typeof query.queryKey[1] === 'string' && !query.queryKey[1].includes('settlement') &&
          query.state?.status === 'success' && typeof query.state.dataUpdatedAt === 'number' &&
          query.state.dataUpdatedAt <= Date.now() && Date.now() - query.state.dataUpdatedAt < MAX_AGE &&
          typeof query.state.data?.status === 'number' && query.state.data.status >= 200 &&
          query.state.data.status < 300 && typeof query.state.data.statusText === 'string' &&
          query.state.data.data !== undefined);
        hydrate(queryClient, { ...restored.client, queries: validQueries, mutations: [] });
        for (const query of validQueries) {
          if (session !== generation) return false;
          const path = query.queryKey[1];
          if (typeof path !== 'string' || !isExpenseRead(path)) continue;
          const cachedResponse = query.state.data;
          await saveExpenseSnapshot(
            userId,
            expenseSnapshotKey(path, query.queryKey[2]),
            cachedResponse.status,
            cachedResponse.statusText,
            cachedResponse.data,
          );
        }
      }
    } catch (error) {
      report(error, 'Saved server data could not be restored. Connect to refresh it.');
    }
  }
  let legacyQueue: LegacyQueuedExpense[] = [];
  if (queued) {
    const parsed: unknown = JSON.parse(queued);
    if (!validLegacyQueue(parsed)) throw new Error('Saved offline expenses are invalid. They have not been overwritten.');
    legacyQueue = parsed;
  }
  if (legacyQueue.length) {
    await importLegacyExpenseOperations(userId, legacyQueue);
    if (session !== generation) return false;
  }
  const queue = await loadExpenseOperations(userId) as QueuedExpense[];
  if (session !== generation) return false;
  if (!validQueue(queue)) throw new Error('SQLite offline expenses are invalid. They have not been overwritten.');
  if (legacyQueue.length) {
    try {
      await AsyncStorage.removeItem(queueKey(userId));
    } catch (error) {
      report(error, 'The old offline journal copy remains in storage; the SQLite copy is intact.');
    }
    if (session !== generation) return false;
  }
  account = userId;
  updateState({ ready: true, queue });
  return true;
}

export async function endDataSession() {
  const userId = account;
  const generation = ++session;
  sessionAbort.abort();
  account = null;
  credential = null;
  clearTimeout(cacheTimer);
  await queryClient.cancelQueries();
  if (session === generation) {
    queryClient.clear();
    updateState({ ready: false, queue: [], error: null, lastExpenseSyncAt: null, syncing: false });
  }
  await persistence;
  // Keep unsynced expenses for the SAME account to inspect after signing in again.
  if (userId) await AsyncStorage.removeItem(cacheKey(userId));
}

function enqueuePersistence(work: () => Promise<void>) {
  const generation = session;
  const result = persistence.then(work, work);
  persistence = result.catch(error => {
    if (session === generation) report(error, 'Could not save local data. Please retry.');
    else console.error('Previous session local persistence failed:', error);
  });
  return result;
}

async function saveQueue(userId: string, queue: QueuedExpense[]) {
  const generation = session;
  await enqueuePersistence(() => replaceExpenseOperations(userId, queue));
  if (account === userId && session === generation) {
    updateState({ queue });
    clearStorageError();
  }
}

function clearStorageError() {
  if (state.error === 'Could not save local data. Please retry.' ||
    state.error === 'Saved server data could not be restored. Connect to refresh it.') {
    updateState({ error: null });
  }
}

function persistCache() {
  clearTimeout(cacheTimer);
  const userId = account;
  if (!userId || !state.ready) return;
  cacheTimer = setTimeout(() => {
    const generation = session;
    const value = JSON.stringify({
      version: CACHE_VERSION,
      savedAt: Date.now(),
      client: dehydrate(queryClient, {
        shouldDehydrateQuery: query => query.state.status === 'success' &&
            !String(query.queryKey[1]).includes('settlement') &&
            !isExpenseRead(String(query.queryKey[1])),
      }),
    });
    void enqueuePersistence(async () => {
      if (session === generation) {
        await AsyncStorage.setItem(cacheKey(userId), value);
        if (session === generation) clearStorageError();
      }
    }).catch(() => { /* Reported by enqueuePersistence. */ });
  }, 500);
}

queryClient.getQueryCache().subscribe(persistCache);

export async function refreshServerData(notify = true) {
  await queryClient.cancelQueries();
  await queryClient.invalidateQueries();
  if (notify) updateState({ revision: state.revision + 1 });
}

export function resumeDataReads() {
  updateState({ revision: state.revision + 1 });
}

export function setDataOnline(online: boolean) {
  const reconnected = online && !state.online;
  updateState({ online });
  if (reconnected) {
    void refreshServerData();
    void replayQueuedExpenses().catch(error => report(error, 'Offline sync could not finish. Please retry.'));
  }
}

function queuedError(config: InternalAxiosRequestConfig, id: string) {
  return new AxiosError(
    `Expense change saved offline (${id}). It is pending server sync and has not changed confirmed balances.`,
    'OFFLINE_QUEUED', config
  );
}

function confirmsIdempotency(headers: unknown) {
  if (headers instanceof AxiosHeaders) {
    return headers.get('X-Idempotency-Supported') === 'true';
  }
  if (!headers || typeof headers !== 'object') return false;
  const entry = Object.entries(headers).find(([name]) =>
    name.toLowerCase() === 'x-idempotency-supported');
  return entry?.[1] === 'true';
}

async function rawRequest(config: InternalAxiosRequestConfig) {
  if (!adapter) throw new Error('API transport is not initialized');
  return adapter(config);
}

function makeConfig(
  path: string,
  method: string,
  body?: string | null,
  id?: string,
  revision?: number,
): InternalAxiosRequestConfig {
  if (!baseConfig || !credential) throw new Error('Sign in before syncing expenses');
  const headers = new AxiosHeaders(baseConfig.headers);
  headers.set('Authorization', `Bearer ${credential}`);
  headers.delete('Idempotency-Key');
  headers.delete('If-Match');
  if (id) headers.set('Idempotency-Key', id);
  if (revision !== undefined) headers.set('If-Match', `"${revision}"`);
  return { ...baseConfig, url: path, method, data: body ?? undefined, headers, signal: sessionAbort.signal, params: undefined };
}

export async function replayQueuedExpenses() {
  if (replay) return replay;
  if (creating) return;
  if (!account || !state.online || !state.ready || !baseConfig) return;
  if (Date.now() >= expiresAt) {
    if (unauthorized) await unauthorized();
    else report(new Error('Session expired'), 'Your session expired. Sign in before syncing.');
    return;
  }
  const userId = account;
  const generation = session;
  updateState({ syncing: true });
  replay = (async () => {
    if (!state.queue.some(item => item.status === 'pending')) return;
    try {
      const response = await rawRequest(makeConfig('/offline-capabilities', 'get'));
      const capabilities = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      if (session !== generation) return;
      const needsCreate = state.queue.some(item => item.method === 'post' && item.status === 'pending');
      const needsMutation = state.queue.some(item => item.method !== 'post' && item.status === 'pending');
      if ((needsCreate && capabilities?.data?.expenseCreateIdempotency !== true) ||
          (needsMutation && capabilities?.data?.expenseMutationIdempotency !== true)) {
        throw new Error('Server no longer supports safe offline sync. Saved expenses were not replayed.');
      }
      updateState({ error: null });
    } catch (error) {
      if (session !== generation) return;
      if (axios.isAxiosError(error) && error.response?.status === 401 && unauthorized) {
        await unauthorized();
      } else {
        report(error, 'Could not confirm safe server sync. No saved expense was replayed.');
        if (axios.isAxiosError(error) && !error.response) setDataOnline(false);
      }
      return;
    }
    for (const item of [...state.queue]) {
      if (session !== generation || !state.online) break;
      if (item.status !== 'pending') continue;
      try {
        if (item.attemptedAt === null) {
          await saveQueue(userId, state.queue.map(entry => entry.id === item.id
            ? { ...entry, attemptedAt: Date.now() } : entry));
        }
        const response = await rawRequest(makeConfig(
          item.path, item.method, item.body, item.id, item.revision,
        ));
        if (session !== generation) break;
        if (!confirmsIdempotency(response.headers)) {
          throw new Error('Server did not confirm safe replay. Check this expense before retrying.');
        }
        if (item.method === 'post') {
          await saveCreatedExpenseMapping(userId, item, response.data);
          if (session !== generation) break;
        }
        const queue = state.queue.map(entry => entry.id === item.id ? { ...entry, status: 'synced' as const, message: undefined } : entry);
        await saveQueue(userId, queue);
        if (session === generation) await refreshServerData();
      } catch (error) {
        if (session !== generation) break;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          if (unauthorized) await unauthorized();
          else report(error, 'Your session expired. Sign in before syncing.');
          break;
        }
        if (axios.isAxiosError(error) && !error.response) {
          setDataOnline(false);
          break;
        }
        const message = expenseFailureMessage(error);
        await saveQueue(userId, state.queue.map(entry => entry.id === item.id
          ? { ...entry, status: 'failed', message } : entry));
        report(error, message);
      }
    }
  })().finally(() => {
    replay = null;
    if (session === generation) updateState({ syncing: false });
    if (session !== generation && account && state.ready && state.online) {
      void replayQueuedExpenses().catch(error => report(error, 'Offline sync could not resume. Please retry.'));
    }
  });
  return replay;
}

export async function dismissQueuedExpense(id: string) {
  if (!account) throw new Error('Sign in to manage offline expenses');
  if (replay || creating) throw new Error('Wait for save or sync to finish before removing an entry');
  const item = state.queue.find(entry => entry.id === id);
  if (item && item.attemptedAt !== null && item.status !== 'synced') {
    throw new Error('This request may already exist on the server and cannot be removed before review.');
  }
  creating = true;
  try {
    await saveQueue(account, state.queue.filter(item => item.id !== id));
  } finally {
    creating = false;
  }
}

export async function retryQueuedExpense(id: string) {
  if (!account || !state.ready) throw new Error('Sign in before retrying an expense.');
  if (!state.online) throw new Error('Connect to retry this expense.');
  if (replay || creating) throw new Error('Wait for save or sync to finish before retrying.');
  const item = state.queue.find(entry => entry.id === id);
  if (!item || item.status !== 'failed') throw new Error('Only entries needing review can be retried.');
  const userId = account;
  const generation = session;
  creating = true;
  try {
    await saveQueue(userId, state.queue.map(entry => entry.id === id
      ? { ...entry, status: 'pending', message: undefined } : entry));
  } finally {
    creating = false;
  }
  if (session !== generation) throw new axios.CanceledError('Account changed while preparing retry');
  await replayQueuedExpenses();
}

export async function loadExpenseDraft<T>(key: string) {
  if (!account || !state.ready) throw new Error('Sign in before loading an expense draft.');
  const userId = account;
  const generation = session;
  const draft = await loadStoredExpenseDraft<T>(userId, key);
  if (session !== generation || account !== userId) throw new axios.CanceledError('Account changed while loading a draft');
  return draft?.value ?? null;
}

export async function saveExpenseDraft(key: string, value: unknown) {
  if (!account || !state.ready) throw new Error('Sign in before saving an expense draft.');
  const userId = account;
  await enqueuePersistence(() => saveStoredExpenseDraft(userId, key, value));
}

export async function deleteExpenseDraft(key: string) {
  if (!account || !state.ready) throw new Error('Sign in before deleting an expense draft.');
  const userId = account;
  await enqueuePersistence(() => deleteStoredExpenseDraft(userId, key));
}

async function awaitConsumer<T>(request: Promise<T>, config: InternalAxiosRequestConfig): Promise<T> {
  const signal = config.signal;
  if (!signal) return request;
  let cancel: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    cancel = () => reject(new axios.CanceledError('Request cancelled', undefined, config));
    signal.addEventListener?.('abort', cancel);
    if (signal.aborted) cancel();
  });
  try {
    return await Promise.race([request, cancelled]);
  } finally {
    signal.removeEventListener?.('abort', cancel);
  }
}

export function createDataAdapter(nativeAdapter: AxiosAdapter): AxiosAdapter {
  adapter = nativeAdapter;
  return async config => {
    const generation = session;
    const userId = account;
    if (credential) baseConfig = config;
    const method = (config.method || 'get').toLowerCase();
    let path = config.url || '';
    if (userId && Date.now() >= expiresAt && !path.includes('/auth/')) {
      throw new AxiosError('Your session expired. Please sign in again.', 'SESSION_EXPIRED', config);
    }
    if (method === 'get' && userId) {
      const localId = /^\/expenses\/(local-[^/]+)$/.exec(path)?.[1];
      if (localId) {
        const queued = queuedCreateForLocalId(localId);
        if (queued?.status === 'pending') {
          const expense = pendingExpense(queued);
          if (expense) {
            return {
              data: { success: true, data: expense },
              status: 200,
              statusText: 'OK',
              headers: new AxiosHeaders(),
              config,
            };
          }
        }
        const serverId = await loadLocalExpenseId(userId, localId);
        if (serverId) {
          path = `/expenses/${serverId}`;
          config = { ...config, url: path };
        }
      }
    }
    if (method === 'get' && userId && state.ready && config.headers.get('Cache-Control') !== 'no-cache' &&
      !path.includes('/auth/') && !path.includes('settlement')) {
      const key = [userId, path, config.params ?? null];
      const cachePath = axios.getUri({ url: path, params: config.params });
      if (!state.online) {
        if (isExpenseRead(path)) {
          const snapshot = await loadExpenseSnapshot(userId, expenseSnapshotKey(path, config.params));
          if (snapshot) {
            logCache('HIT', cachePath, 'SQLite expense snapshot');
            updateState({ lastExpenseSyncAt: snapshot.savedAt });
            return {
              ...snapshot,
              data: overlayPendingExpenses(path, snapshot.data, config.params),
              headers: new AxiosHeaders(),
              config,
            };
          }
          const expenseId = /^\/expenses\/([^/]+)$/.exec(path)?.[1];
          if (expenseId) {
            const confirmed = await loadConfirmedExpense(userId, expenseId);
            if (confirmed) {
              logCache('HIT', cachePath, 'SQLite confirmed expense');
              updateState({ lastExpenseSyncAt: confirmed.updatedAt });
              return {
                status: 200,
                statusText: 'OK',
                data: { success: true, data: confirmed.value },
                headers: new AxiosHeaders(),
                config,
              };
            }
          }
          logCache('MISS', cachePath, 'offline SQLite expense cache');
          throw new AxiosError('Offline: no saved expense snapshot is available. Connect and refresh expenses.', 'OFFLINE', config);
        }
        const cached = queryClient.getQueryState<{ data: unknown; status: number; statusText: string }>(key);
        if (!cached?.data || Date.now() - cached.dataUpdatedAt >= MAX_AGE) {
          logCache('MISS', cachePath, 'offline query cache');
          throw new AxiosError('Offline: no recent saved data for this screen. Connect and try again.', 'OFFLINE', config);
        }
        logCache('HIT', cachePath, 'offline query cache');
        return { ...cached.data, headers: new AxiosHeaders(), config };
      }
      const cached = queryClient.getQueryState(key);
      const hasFreshCache = cached?.status === 'success' && !cached.isInvalidated &&
        Date.now() - cached.dataUpdatedAt < STALE_TIME;
      if (hasFreshCache) {
        logCache('HIT', cachePath, 'fresh query cache');
      } else if (cached?.fetchStatus === 'fetching') {
        logCache('HIT', cachePath, 'shared in-flight request');
      }
      let result;
      try {
        result = await awaitConsumer(queryClient.fetchQuery({
        queryKey: key,
        queryFn: async ({ signal }) => {
          logCache('MISS', cachePath, 'network fetch');
          const response = await nativeAdapter({ ...config, signal });
          if (path === '/groups' && response.status >= 200 && response.status < 300) {
            await reconcileAccessibleGroups(userId, response.data, generation);
          }
          if (isExpenseRead(path) && response.status >= 200 && response.status < 300) {
            await saveExpenseSnapshot(
              userId,
              expenseSnapshotKey(path, config.params),
              response.status,
              response.statusText,
              response.data,
              path === '/expenses' && (config.params === undefined || config.params === null),
            );
            if (account === userId && session === generation) {
              updateState({ lastExpenseSyncAt: Date.now() });
            }
          }
          return { data: response.data, status: response.status, statusText: response.statusText };
        },
        retry: (attempt, error) => attempt < 2 && axios.isAxiosError(error) &&
          error.code !== 'ERR_CANCELED' && (!error.response || error.response.status === 429 || error.response.status >= 500),
        retryDelay: attempt => 500 * 2 ** attempt,
        }), config);
      } catch (error) {
        if (axios.isAxiosError(error) && !error.response && error.code !== 'ERR_CANCELED' && session === generation) {
          setDataOnline(false);
          const cached = queryClient.getQueryState<{ data: unknown; status: number; statusText: string }>(key);
          if (cached?.data && Date.now() - cached.dataUpdatedAt < MAX_AGE) {
            logCache('HIT', cachePath, 'stale offline fallback');
            return { ...cached.data, headers: new AxiosHeaders(), config };
          }
        }
        throw error;
      }
      if (session !== generation) throw new axios.CanceledError('Account changed', undefined, config);
      return {
        ...result,
        data: overlayPendingExpenses(path, result.data, config.params),
        headers: new AxiosHeaders(),
        config,
      };
    }
    if (method === 'get') {
      if (!state.online && !path.includes('/auth/')) throw new AxiosError('This screen requires an internet connection.', 'OFFLINE', config);
      if (!userId || path.includes('/auth/')) return nativeAdapter(config);
      const response = await awaitConsumer(nativeAdapter({ ...config, signal: sessionAbort.signal }), config);
      if (session !== generation) throw new axios.CanceledError('Account changed', undefined, config);
      return response;
    }
    if (!userId || path.includes('/auth/')) return nativeAdapter(config);
    const isCreate = method === 'post' && CREATE_PATHS.has(path);
    let isExpenseMutation = (method === 'put' || method === 'delete') && /^\/expenses\/[^/]+$/.test(path);
    if (!isCreate && !isExpenseMutation) {
      if (!state.online) throw new AxiosError('This action requires an internet connection. No change was made.', 'OFFLINE', config);
      const response = await awaitConsumer(nativeAdapter({ ...config, signal: sessionAbort.signal }), config);
      if (session !== generation) throw new axios.CanceledError('Account changed', undefined, config);
      if (path !== '/users/fcm-token') await refreshServerData();
      return response;
    }

    if (creating || replay) throw new AxiosError('Another expense is being saved or synced. Please wait before submitting.', 'SYNC_BUSY', config);
    creating = true;
    try {
    const localId = isExpenseMutation ? /^\/expenses\/(local-[^/]+)$/.exec(path)?.[1] : undefined;
    if (localId) {
      const localCreate = queuedCreateForLocalId(localId);
      if (localCreate) {
        if (localCreate.status !== 'pending' || localCreate.attemptedAt !== null) {
          throw new AxiosError('This offline create may already exist on the server. Sync or review it before editing or deleting.', 'SYNC_BUSY', config);
        }
        if (method === 'delete') {
          await saveQueue(userId, state.queue.filter(item => item.id !== localCreate.id));
          await refreshServerData();
          return {
            data: { success: true, data: null, cancelledBeforeSync: true },
            status: 200,
            statusText: 'OK',
            headers: new AxiosHeaders(),
            config,
          };
        }
        if (typeof config.data !== 'string' && (!config.data || typeof config.data !== 'object')) {
          throw new AxiosError('Expense updates must be an object.', 'BAD_INPUT', config);
        }
        let payload: unknown;
        try {
          payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        } catch {
          throw new AxiosError('Expense updates must be valid JSON.', 'BAD_INPUT', config);
        }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          throw new AxiosError('Expense updates must be an object.', 'BAD_INPUT', config);
        }
        const createBody = JSON.parse(localCreate.body!) as Record<string, unknown>;
        const updatedBody = JSON.stringify(resizeLocalExpense(createBody, { ...payload }));
        await saveQueue(userId, state.queue.map(item => item.id === localCreate.id
          ? { ...item, body: updatedBody } : item));
        await refreshServerData();
        throw queuedError(config, localCreate.id);
      }
      const serverId = await loadLocalExpenseId(userId, localId);
      if (serverId) {
        path = `/expenses/${serverId}`;
        config = { ...config, url: path };
        isExpenseMutation = true;
      } else {
        throw new AxiosError('This local expense is no longer available. Refresh your expenses and try again.', 'OFFLINE', config);
      }
    }
    const capabilityKey = [userId, '/offline-capabilities', null];
    let supported = queryClient.getQueryData<{ data: string; status: number; statusText: string }>(capabilityKey);
    if (state.online) {
      try {
        const response = await nativeAdapter(makeConfig('/offline-capabilities', 'get'));
        if (session !== generation) throw new axios.CanceledError('Account changed', undefined, config);
        supported = { data: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
          status: response.status, statusText: response.statusText };
        queryClient.setQueryData(capabilityKey, supported);
      } catch (error) {
        if (session !== generation) throw error;
        if (axios.isAxiosError(error) && !error.response) {
          setDataOnline(false);
        } else if (axios.isAxiosError(error) && error.response?.status === 404) {
          supported = undefined;
          queryClient.removeQueries({ queryKey: capabilityKey });
        } else {
          throw error;
        }
      }
    }
    if (session !== generation) throw new axios.CanceledError('Account changed', undefined, config);
    const capabilityState = queryClient.getQueryState(capabilityKey);
    const supportedData = supported && JSON.parse(supported.data)?.data;
    const capable = supported && capabilityState && Date.now() - capabilityState.dataUpdatedAt < MAX_AGE &&
      supported.status >= 200 && supported.status < 300 &&
      (isCreate ? supportedData?.expenseCreateIdempotency === true :
        supportedData?.expenseMutationIdempotency === true);
    if (!capable) {
      if (!state.online) {
        const message = !supported || !capabilityState || Date.now() - capabilityState.dataUpdatedAt >= MAX_AGE
          ? 'Connect to the server once to prepare offline expenses, then try again. No expense was queued.'
          : 'The server needs an update before offline expense sync is available. No expense was queued.';
        throw new AxiosError(message, 'OFFLINE', config);
      }
      const response = await nativeAdapter({ ...config, signal: sessionAbort.signal });
      if (session !== generation) throw new axios.CanceledError('Account changed', undefined, config);
      await refreshServerData();
      return response;
    }
    const body = method === 'delete' ? null :
      typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
    if (method !== 'delete') {
      if (typeof body !== 'string') throw new AxiosError('Expense payload is missing. No expense was queued.', 'BAD_INPUT', config);
      let payload: unknown;
      try {
        payload = JSON.parse(body);
      } catch {
        throw new AxiosError('Expense payload must be valid JSON. No expense was queued.', 'BAD_INPUT', config);
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new AxiosError('Expense payload must be an object. No expense was queued.', 'BAD_INPUT', config);
      }
    }
    const expenseId = isExpenseMutation ? path.slice('/expenses/'.length) : undefined;
    let ifMatch = config.headers.get('If-Match');
    if (isExpenseMutation && !ifMatch && localId) {
      const confirmed = await loadConfirmedExpense(userId, expenseId!);
      const expense = confirmed?.value as { revision?: unknown } | undefined;
      if (Number.isSafeInteger(expense?.revision) && Number(expense?.revision) >= 0) {
        config = { ...config, headers: new AxiosHeaders(config.headers).set('If-Match', `"${expense!.revision}"`) };
        ifMatch = config.headers.get('If-Match');
      }
    }
    let revision: number | undefined;
    if (isExpenseMutation) {
      const match = typeof ifMatch === 'string' && /^"(0|[1-9]\d*)"$/.exec(ifMatch);
      if (!match || !Number.isSafeInteger(Number(match[1]))) {
        throw new AxiosError('A valid expense revision is required before queuing this change.', 'BAD_INPUT', config);
      }
      revision = Number(match[1]);
    }
    const existing = state.queue.find(item => isCreate
      ? item.method === method && item.path === path && item.body === body && item.status !== 'synced'
      : item.expenseId === expenseId && item.status !== 'synced');
    if (existing) {
      if (isCreate && existing.method === method && existing.path === path && existing.body === body) {
        throw queuedError(config, existing.id);
      }
      throw new AxiosError('This expense already has an unresolved offline change. Review or sync it first.', 'SYNC_BUSY', config);
    }
    const item: QueuedExpense = {
      id: Crypto.randomUUID(), path, method: isCreate ? 'post' : method === 'put' ? 'put' : 'delete', body, createdAt: Date.now(),
      attemptedAt: null, status: 'pending', expenseId, revision,
    };
    await saveQueue(userId, [...state.queue, item]);
    if (session !== generation) throw new axios.CanceledError('Account changed', undefined, config);
    if (!state.online) throw queuedError(config, item.id);
    try {
      await saveQueue(userId, state.queue.map(entry => entry.id === item.id
        ? { ...entry, attemptedAt: Date.now() } : entry));
      const headers = new AxiosHeaders(config.headers).set('Idempotency-Key', item.id);
      if (revision !== undefined) headers.set('If-Match', `"${revision}"`);
      const response = await nativeAdapter({ ...config, signal: sessionAbort.signal, headers });
      if (session !== generation) throw new axios.CanceledError('Account changed', undefined, config);
      if (!confirmsIdempotency(response.headers)) {
        await saveQueue(userId, state.queue.map(entry => entry.id === item.id
          ? { ...entry, status: 'failed', message: 'Server did not confirm idempotency. Review before retrying.' } : entry));
        throw new AxiosError('Server did not confirm safe expense sync. Review offline sync before retrying.', 'SYNC_UNCONFIRMED', config);
      }
      if (item.method === 'post') {
        await saveCreatedExpenseMapping(userId, item, response.data);
        if (session !== generation) throw new axios.CanceledError('Account changed', undefined, config);
      }
      await saveQueue(userId, state.queue.map(entry => entry.id === item.id ? { ...entry, status: 'synced' } : entry));
      if (session === generation) await refreshServerData();
      return response;
    } catch (error) {
      if (session !== generation) throw error;
      if (axios.isAxiosError(error) && !error.response && error.code !== 'SYNC_UNCONFIRMED') {
        setDataOnline(false);
        throw queuedError(config, item.id);
      }
      await saveQueue(userId, state.queue.map(entry => entry.id === item.id
        ? { ...entry, status: 'failed', message: expenseFailureMessage(error) } : entry));
      throw error;
    }
    } finally {
      creating = false;
    }
  };
}
