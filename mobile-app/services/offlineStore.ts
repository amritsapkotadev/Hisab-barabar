import * as SQLite from 'expo-sqlite';

export interface OfflineExpenseOperation {
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

interface OperationRow {
  operation_id: string;
  path: string;
  method: OfflineExpenseOperation['method'];
  body: string | null;
  created_at: number;
  attempted_at: number | null;
  status: OfflineExpenseOperation['status'];
  message: string | null;
  expense_id: string | null;
  expected_revision: number | null;
}

interface SnapshotRow {
  scope: string;
  cache_key: string;
  status: number;
  status_text: string;
  body: string;
  saved_at: number;
}

interface ExpenseRow {
  id: string;
  groupId?: string;
  type?: string;
  date?: string;
  createdAt?: string;
  amount?: number;
}

interface LocalExpenseIdRow {
  local_id: string;
  server_id: string;
}

interface DraftRow {
  payload: string;
  updated_at: number;
}

interface ConfirmedExpenseRow {
  payload: string;
}

interface ConfirmedExpenseRecord extends ConfirmedExpenseRow {
  expense_id: string;
}

let database: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabase() {
  if (!database) {
    database = SQLite.openDatabaseAsync('hisab-barabar.db').then(async db => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS expense_outbox (
          scope TEXT NOT NULL,
          operation_id TEXT NOT NULL,
          path TEXT NOT NULL,
          method TEXT NOT NULL,
          body TEXT,
          created_at INTEGER NOT NULL,
          attempted_at INTEGER,
          status TEXT NOT NULL,
          message TEXT,
          expense_id TEXT,
          expected_revision INTEGER,
          PRIMARY KEY (scope, operation_id)
        );
        CREATE INDEX IF NOT EXISTS expense_outbox_order
          ON expense_outbox(scope, status, created_at);
        CREATE TABLE IF NOT EXISTS expense_snapshots (
          scope TEXT NOT NULL,
          cache_key TEXT NOT NULL,
          status INTEGER NOT NULL,
          status_text TEXT NOT NULL,
          body TEXT NOT NULL,
          saved_at INTEGER NOT NULL,
          PRIMARY KEY (scope, cache_key)
        );
        CREATE TABLE IF NOT EXISTS confirmed_expenses (
          scope TEXT NOT NULL,
          expense_id TEXT NOT NULL,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (scope, expense_id)
        );
        CREATE TABLE IF NOT EXISTS local_expense_ids (
          scope TEXT NOT NULL,
          local_id TEXT NOT NULL,
          server_id TEXT NOT NULL,
          PRIMARY KEY (scope, local_id)
        );
        CREATE TABLE IF NOT EXISTS expense_drafts (
          scope TEXT NOT NULL,
          draft_key TEXT NOT NULL,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (scope, draft_key)
        );
      `);
      return db;
    }).catch(error => {
      database = null;
      throw error;
    });
  }
  return database;
}

function fromRow(row: OperationRow): OfflineExpenseOperation {
  return {
    id: row.operation_id,
    path: row.path,
    method: row.method,
    body: row.body,
    createdAt: row.created_at,
    attemptedAt: row.attempted_at,
    status: row.status,
    ...(row.message ? { message: row.message } : {}),
    ...(row.expense_id ? { expenseId: row.expense_id } : {}),
    ...(row.expected_revision === null ? {} : { revision: row.expected_revision }),
  };
}

function immutablePayloadMatches(
  previous: OfflineExpenseOperation,
  next: OfflineExpenseOperation,
) {
  return previous.path === next.path &&
    previous.method === next.method &&
    previous.body === next.body &&
    previous.expenseId === next.expenseId &&
    previous.revision === next.revision;
}

export async function loadExpenseOperations(scope: string) {
  const db = await openDatabase();
  const rows = await db.getAllAsync<OperationRow>(
    'SELECT * FROM expense_outbox WHERE scope = ? ORDER BY created_at, rowid',
    scope,
  );
  return rows.map(fromRow);
}

export async function replaceExpenseOperations(
  scope: string,
  operations: OfflineExpenseOperation[],
) {
  const db = await openDatabase();
  await db.withTransactionAsync(async () => {
    const rows = await db.getAllAsync<OperationRow>(
      'SELECT * FROM expense_outbox WHERE scope = ?',
      scope,
    );
    const previous = new Map(rows.map(row => [row.operation_id, fromRow(row)]));
    const next = new Map(operations.map(operation => [operation.id, operation]));
    for (const [id, operation] of previous) {
      if (operation.attemptedAt === null || operation.status === 'synced') continue;
      const replacement = next.get(id);
      if (!replacement || !immutablePayloadMatches(operation, replacement) ||
          replacement.attemptedAt === null) {
        throw new Error('Attempted offline expenses cannot be changed or removed before server review.');
      }
    }

    await db.runAsync('DELETE FROM expense_outbox WHERE scope = ?', scope);
    for (const operation of operations) {
      await db.runAsync(
        `INSERT INTO expense_outbox
          (scope, operation_id, path, method, body, created_at, attempted_at,
           status, message, expense_id, expected_revision)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        scope, operation.id, operation.path, operation.method, operation.body,
        operation.createdAt, operation.attemptedAt, operation.status,
        operation.message ?? null, operation.expenseId ?? null, operation.revision ?? null,
      );
    }
  });
}

export async function importLegacyExpenseOperations(
  scope: string,
  operations: Array<{
    id: string;
    path: string;
    body: string;
    createdAt: number;
    status: OfflineExpenseOperation['status'];
    message?: string;
  }>,
) {
  const db = await openDatabase();
  await db.withTransactionAsync(async () => {
    for (const operation of operations) {
      const payload: unknown = JSON.parse(operation.body);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Legacy expense journal contains an invalid request body.');
      }
      await db.runAsync(
        `INSERT OR IGNORE INTO expense_outbox
          (scope, operation_id, path, method, body, created_at, attempted_at,
           status, message, expense_id, expected_revision)
         VALUES (?, ?, ?, 'post', ?, ?, ?, ?, ?, NULL, NULL)`,
        scope, operation.id, operation.path, operation.body, operation.createdAt,
        operation.status === 'synced' ? null : operation.createdAt,
        operation.status, operation.message ?? null,
      );
    }
  });
}

export async function saveExpenseSnapshot(
  scope: string,
  cacheKey: string,
  status: number,
  statusText: string,
  responseBody: unknown,
  completeExpenseList = false,
) {
  const db = await openDatabase();
  const normalizedBody = typeof responseBody === 'string' ? JSON.parse(responseBody) as unknown : responseBody;
  const body = JSON.stringify(normalizedBody);
  if (body === undefined) throw new Error('Expense snapshot is not serializable.');
  const envelope = normalizedBody as { success?: unknown; data?: unknown };
  const expenses = Array.isArray(envelope?.data) ? envelope.data as ExpenseRow[] : null;
  const reconcile = completeExpenseList && status >= 200 && status < 300 &&
    envelope?.success === true && expenses !== null &&
    expenses.every(expense => expense && typeof expense.id === 'string');
  if (completeExpenseList && !reconcile) {
    throw new Error('Complete expense response is invalid; saved expense data was not reconciled.');
  }
  await db.withTransactionAsync(async () => {
    if (reconcile && expenses) {
      await db.runAsync('DELETE FROM confirmed_expenses WHERE scope = ?', scope);
      const snapshots = await db.getAllAsync<SnapshotRow>(
        'SELECT scope, cache_key, status, status_text, body, saved_at FROM expense_snapshots WHERE scope = ?',
        scope,
      );
      const byId = new Map(expenses.map(expense => [expense.id, expense]));
      const localIds = await db.getAllAsync<LocalExpenseIdRow>(
        'SELECT local_id, server_id FROM local_expense_ids WHERE scope = ?',
        scope,
      );
      for (const localId of localIds) {
        if (!byId.has(localId.server_id)) {
          await db.runAsync(
            'DELETE FROM local_expense_ids WHERE scope = ? AND local_id = ?',
            scope, localId.local_id,
          );
        }
      }
      for (const snapshot of snapshots) {
        let key: unknown;
        let cached: unknown;
        try {
          key = JSON.parse(snapshot.cache_key ?? '');
          cached = JSON.parse(snapshot.body);
        } catch {
          continue;
        }
        if (!Array.isArray(key) || typeof key[0] !== 'string' ||
            !cached || typeof cached !== 'object' || !('data' in cached)) continue;
        const path = key[0];
        let nextData: unknown;
        if (path === '/expenses' && key[1] == null) continue;
        if (path === '/expenses/personal') {
          const personal = expenses.filter(expense => expense.type === 'personal');
          const params = key[1] && typeof key[1] === 'object'
            ? key[1] as { monthStart?: string; monthEnd?: string } : {};
          const start = params.monthStart ? new Date(params.monthStart) : null;
          const end = params.monthEnd ? new Date(params.monthEnd) : null;
          const monthlySpent = personal.reduce((sum, expense) => {
            const date = new Date(expense.date || expense.createdAt || '');
            return start && end && date >= start && date < end ? sum + (expense.amount ?? 0) : sum;
          }, 0);
          nextData = {
            ...(cached as Record<string, unknown>),
            data: personal,
            summary: { count: personal.length, monthlySpent },
          };
        } else if (path.startsWith('/expenses/group/')) {
          const groupId = path.slice('/expenses/group/'.length);
          const groupExpenses = expenses.filter(expense => expense.groupId === groupId);
          nextData = { ...(cached as Record<string, unknown>), data: groupExpenses };
        } else {
          const detail = /^\/expenses\/([^/]+)$/.exec(path);
          if (!detail) continue;
          const expense = byId.get(detail[1]);
          if (!expense) {
            await db.runAsync(
              'DELETE FROM expense_snapshots WHERE scope = ? AND cache_key = ?',
              scope, snapshot.cache_key,
            );
            continue;
          }
          nextData = { ...(cached as Record<string, unknown>), data: expense };
        }
        const updatedBody = JSON.stringify(nextData);
        if (updatedBody !== undefined) {
          await db.runAsync(
            'UPDATE expense_snapshots SET body = ?, saved_at = ? WHERE scope = ? AND cache_key = ?',
            updatedBody, Date.now(), scope, snapshot.cache_key,
          );
        }
      }
    }
    await db.runAsync(
      `INSERT INTO expense_snapshots(scope, cache_key, status, status_text, body, saved_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(scope, cache_key) DO UPDATE SET
         status = excluded.status, status_text = excluded.status_text,
         body = excluded.body, saved_at = excluded.saved_at`,
      scope, cacheKey, status, statusText, body, Date.now(),
    );
    for (const expense of expenses ?? []) {
      if (!expense || typeof expense !== 'object' || !('id' in expense) ||
          typeof expense.id !== 'string') continue;
      await db.runAsync(
        `INSERT INTO confirmed_expenses(scope, expense_id, payload, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(scope, expense_id) DO UPDATE SET
           payload = excluded.payload, updated_at = excluded.updated_at`,
        scope, expense.id, JSON.stringify(expense), Date.now(),
      );
    }
  });
}

export async function saveLocalExpenseId(scope: string, localId: string, serverId: string, expense: unknown) {
  const db = await openDatabase();
  const payload = JSON.stringify(expense);
  if (payload === undefined) throw new Error('Confirmed expense is not serializable.');
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO local_expense_ids(scope, local_id, server_id) VALUES (?, ?, ?)
       ON CONFLICT(scope, local_id) DO UPDATE SET server_id = excluded.server_id`,
      scope, localId, serverId,
    );
    await db.runAsync(
      `INSERT INTO confirmed_expenses(scope, expense_id, payload, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(scope, expense_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      scope, serverId, payload, Date.now(),
    );
  });
}

export async function reconcileExpenseGroupAccess(scope: string, groupIds: string[]) {
  const db = await openDatabase();
  const allowedGroups = new Set(groupIds);
  await db.withTransactionAsync(async () => {
    const confirmed = await db.getAllAsync<ConfirmedExpenseRecord>(
      'SELECT expense_id, payload FROM confirmed_expenses WHERE scope = ?',
      scope,
    );
    for (const row of confirmed) {
      const expense = JSON.parse(row.payload) as { groupId?: unknown };
      if (typeof expense.groupId !== 'string' || allowedGroups.has(expense.groupId)) continue;
      await db.runAsync(
        'DELETE FROM confirmed_expenses WHERE scope = ? AND expense_id = ?',
        scope, row.expense_id,
      );
      await db.runAsync(
        'DELETE FROM local_expense_ids WHERE scope = ? AND server_id = ?',
        scope, row.expense_id,
      );
    }

    const snapshots = await db.getAllAsync<SnapshotRow>(
      'SELECT scope, cache_key, status, status_text, body, saved_at FROM expense_snapshots WHERE scope = ?',
      scope,
    );
    for (const snapshot of snapshots) {
      let key: unknown;
      let cached: unknown;
      try {
        key = JSON.parse(snapshot.cache_key);
        cached = JSON.parse(snapshot.body);
      } catch {
        continue;
      }
      if (!Array.isArray(key) || typeof key[0] !== 'string' ||
          !cached || typeof cached !== 'object' || !('data' in cached)) continue;
      const path = key[0];
      if (path === '/expenses' && key[1] == null) {
        const data = (cached as { data: unknown }).data;
        if (!Array.isArray(data)) continue;
        const safeData = data.filter(expense => expense && typeof expense === 'object' &&
          (!('groupId' in expense) || typeof expense.groupId !== 'string' ||
            allowedGroups.has(expense.groupId)));
        await db.runAsync(
          'UPDATE expense_snapshots SET body = ?, saved_at = ? WHERE scope = ? AND cache_key = ?',
          JSON.stringify({ ...(cached as Record<string, unknown>), data: safeData }),
          Date.now(), scope, snapshot.cache_key,
        );
        continue;
      }
      const groupPath = /^\/expenses\/group\/([^/]+)$/.exec(path);
      if (groupPath && !allowedGroups.has(groupPath[1])) {
        await db.runAsync(
          'DELETE FROM expense_snapshots WHERE scope = ? AND cache_key = ?',
          scope, snapshot.cache_key,
        );
        continue;
      }
      const detail = /^\/expenses\/([^/]+)$/.exec(path);
      const expense = (cached as { data?: unknown }).data;
      if (detail && expense && typeof expense === 'object' && 'groupId' in expense &&
          typeof expense.groupId === 'string' && !allowedGroups.has(expense.groupId)) {
        await db.runAsync(
          'DELETE FROM expense_snapshots WHERE scope = ? AND cache_key = ?',
          scope, snapshot.cache_key,
        );
      }
    }
  });
}

export async function loadLocalExpenseId(scope: string, localId: string) {
  const db = await openDatabase();
  const row = await db.getFirstAsync<LocalExpenseIdRow>(
    'SELECT local_id, server_id FROM local_expense_ids WHERE scope = ? AND local_id = ?',
    scope, localId,
  );
  return row?.server_id ?? null;
}

export async function loadExpenseSnapshot(scope: string, cacheKey: string) {
  const db = await openDatabase();
  const row = await db.getFirstAsync<SnapshotRow>(
    'SELECT status, status_text, body, saved_at FROM expense_snapshots WHERE scope = ? AND cache_key = ?',
    scope, cacheKey,
  );
  return row ? {
    status: row.status,
    statusText: row.status_text,
    data: JSON.parse(row.body) as unknown,
    savedAt: row.saved_at,
  } : null;
}

export async function loadConfirmedExpense(scope: string, expenseId: string) {
  const db = await openDatabase();
  const row = await db.getFirstAsync<ConfirmedExpenseRow & { updated_at: number }>(
    'SELECT payload, updated_at FROM confirmed_expenses WHERE scope = ? AND expense_id = ?',
    scope, expenseId,
  );
  return row ? { value: JSON.parse(row.payload) as unknown, updatedAt: row.updated_at } : null;
}

export async function loadExpenseDraft<T>(scope: string, key: string) {
  const db = await openDatabase();
  const row = await db.getFirstAsync<DraftRow>(
    'SELECT payload, updated_at FROM expense_drafts WHERE scope = ? AND draft_key = ?',
    scope, key,
  );
  return row ? { value: JSON.parse(row.payload) as T, updatedAt: row.updated_at } : null;
}

export async function saveExpenseDraft(scope: string, key: string, value: unknown) {
  const db = await openDatabase();
  const payload = JSON.stringify(value);
  if (payload === undefined) throw new Error('Expense draft is not serializable.');
  await db.runAsync(
    `INSERT INTO expense_drafts(scope, draft_key, payload, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(scope, draft_key) DO UPDATE SET
       payload = excluded.payload, updated_at = excluded.updated_at`,
    scope, key, payload, Date.now(),
  );
}

export async function deleteExpenseDraft(scope: string, key: string) {
  const db = await openDatabase();
  await db.runAsync(
    'DELETE FROM expense_drafts WHERE scope = ? AND draft_key = ?',
    scope, key,
  );
}
