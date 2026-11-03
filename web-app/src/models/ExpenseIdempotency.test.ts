import assert from 'node:assert/strict'
import { mock } from 'node:test'
import ExpenseIdempotency, { expenseIdempotencyStore as store } from './ExpenseIdempotency'

async function main() {
  assert.equal(ExpenseIdempotency.schema.options.autoCreate, false)
  assert.equal(ExpenseIdempotency.schema.options.autoIndex, false)
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      ExpenseIdempotency.init(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Model import must not wait for a database connection')), 1000)
      }),
    ])
  } finally {
    clearTimeout(timeout)
  }

  const calls: string[] = []
  let fail = true
  try {
    mock.method(ExpenseIdempotency, 'createCollection', async () => {
      calls.push('collection')
    })
    mock.method(ExpenseIdempotency, 'createIndexes', async () => {
      calls.push('indexes')
      if (fail) throw new Error('Temporary index failure')
    })
    await assert.rejects(store.initialize(), /Temporary index failure/)
    fail = false
    await Promise.all([store.initialize(), store.initialize(), store.initialize()])
    assert.deepEqual(calls, ['collection', 'indexes', 'collection', 'indexes'])
    await store.initialize()
    assert.equal(calls.length, 4, 'successful initialization is reused only after the unique index is ready')
    const updates: unknown[][] = []
    mock.method(ExpenseIdempotency, 'updateOne', async (...args: unknown[]) => {
      updates.push(args)
      return { modifiedCount: updates.length === 1 ? 1 : 0 }
    })
    const body = JSON.stringify({ message: 'Expense payer amounts do not equal the expense total.' })
    assert.equal(await store.reopenRejectedUpdate!('u', 'key', 'hash', body), true)
    assert.equal(await store.reopenRejectedUpdate!('u', 'key', 'hash', body), false)
    assert.deepEqual(updates[0], [
      { userId: 'u', key: 'key', requestHash: 'hash', state: 'completed', responseStatus: 400, responseBody: body },
      { $set: { state: 'reserved' }, $unset: { responseStatus: 1, responseBody: 1 } },
    ])
  } finally {
    mock.restoreAll()
  }
  console.log('Expense idempotency initialization checks passed')
}

void main().catch(error => { console.error(error); process.exitCode = 1 })
