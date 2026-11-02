import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import ExpenseIdempotency, { expenseIdempotencyStore as store } from '../models/ExpenseIdempotency'
import Expense from '../models/Expense'
import { expenseRevisionFilter } from './expenseRevision'
import { idempotentCreate, MANUAL_REVIEW_MESSAGE } from './idempotency'

async function main() {
  const uri = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017'
  const url = new URL(uri)
  assert.equal(url.protocol, 'mongodb:', 'Only a local MongoDB test instance is allowed')
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Remote databases are not allowed')
  const dbName = `hisab_idempotency_test_${randomUUID().replaceAll('-', '')}`
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 })
  try {
    const userId = new mongoose.Types.ObjectId().toHexString()
    const key = randomUUID()
    const request = (amount = 10, requestKey = key) => new Request('http://localhost/api/expenses/personal', {
      method: 'POST', headers: { 'Idempotency-Key': requestKey },
      body: JSON.stringify({ amount, description: 'Integration test' }),
    })
    let calls = 0
    let release!: () => void
    let entered!: () => void
    const started = new Promise<void>(resolve => { entered = resolve })
    const wait = new Promise<void>(resolve => { release = resolve })
    const execute = async () => {
      calls++
      entered()
      await wait
      return Response.json({ data: { id: 'expense-1' } }, { status: 201 })
    }
    const first = idempotentCreate(request(), userId, store, execute)
    const outcome = await Promise.race([started.then(() => 'started'), first.then(() => 'finished')])
    assert.equal(outcome, 'started', 'Mongo reservation must succeed before execution')
    let original: Response
    try {
      const concurrent = await Promise.all(Array.from({ length: 8 }, () =>
        idempotentCreate(request(), userId, store, execute)))
      assert.ok(concurrent.every(response => response.status === 409))
      assert.equal(calls, 1, 'The unique index permits only one side effect')
    } finally {
      release()
      original = await first
    }
    assert.equal(original.status, 201)
    assert.equal(await ExpenseIdempotency.countDocuments({ userId, key }), 1)
    const indexes = await ExpenseIdempotency.collection.indexes()
    assert.ok(indexes.some(index => index.unique && index.key.userId === 1 && index.key.key === 1))
    assert.ok(indexes.every(index => index.expireAfterSeconds === undefined), 'Reservations must not expire')

    const replay = await idempotentCreate(request(), userId, store, execute)
    assert.equal(replay.status, 201)
    assert.equal(await replay.text(), await original.text())
    assert.equal(replay.headers.get('X-Idempotency-Supported'), 'true')
    assert.equal(replay.headers.get('Cache-Control'), 'no-store')
    assert.equal(calls, 1)
    assert.equal((await idempotentCreate(request(11), userId, store, execute)).status, 409)
    assert.equal(calls, 1)

    const otherUser = new mongoose.Types.ObjectId().toHexString()
    assert.equal((await idempotentCreate(request(), otherUser, store, execute)).status, 201)
    assert.equal(calls, 2, 'The same key is independent for another user')

    const uncertainKey = randomUUID()
    let uncertainCalls = 0
    const uncertain = async () => { uncertainCalls++; throw new Error('Outcome unknown') }
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await idempotentCreate(request(10, uncertainKey), userId, store, uncertain)
      assert.equal(result.status, 409)
      assert.equal((await result.json()).message, MANUAL_REVIEW_MESSAGE)
    }
    assert.equal(uncertainCalls, 1)
    assert.equal((await store.find(userId, uncertainKey))?.state, 'reserved')
    await assert.rejects(store.complete(userId, key, 201, '{}'), /completion was not confirmed/)

    const expenseId = new mongoose.Types.ObjectId()
    await Expense.collection.insertOne({
      _id: expenseId, description: 'Legacy expense', amount: 10,
      date: '2026-11-01', type: 'personal', createdBy: new mongoose.Types.ObjectId(userId),
    })
    const edits = await Promise.all(Array.from({ length: 8 }, () => Expense.findOneAndUpdate(
      expenseRevisionFilter(expenseId.toHexString(), 0),
      { $set: { amount: 11 }, $inc: { revision: 1 } },
      { new: true, runValidators: true },
    )))
    assert.equal(edits.filter(Boolean).length, 1, 'Only one concurrent edit may match the legacy revision')
    assert.equal((await Expense.findById(expenseId))?.revision, 1)
    assert.equal(await Expense.findOneAndUpdate(
      expenseRevisionFilter(expenseId.toHexString(), 0),
      { $set: { amount: 99 }, $inc: { revision: 1 } },
      { new: true, runValidators: true },
    ), null, 'A stale edit must not overwrite confirmed data')
    assert.equal(await Expense.findOneAndDelete(expenseRevisionFilter(expenseId.toHexString(), 0)), null)
    assert.equal((await Expense.findById(expenseId))?.amount, 11, 'A stale delete must preserve the expense')
    assert.ok(await Expense.findOneAndDelete(expenseRevisionFilter(expenseId.toHexString(), 1)))
    assert.equal(await Expense.findById(expenseId), null)

    const mutationId = new mongoose.Types.ObjectId()
    await Expense.create({
      _id: mutationId, description: 'Replay mutation', amount: 10,
      date: '2026-11-01', type: 'personal', createdBy: new mongoose.Types.ObjectId(userId),
      revision: 0,
    })
    const editKey = randomUUID()
    const editRequest = () => new Request(`http://localhost/api/expenses/${mutationId}`, {
      method: 'PUT',
      headers: { 'Idempotency-Key': editKey, 'If-Match': '"0"' },
      body: JSON.stringify({ amount: 12 }),
    })
    let updateCalls = 0
    const update = async () => {
      updateCalls++
      const updated = await Expense.findOneAndUpdate(
        expenseRevisionFilter(mutationId.toHexString(), 0),
        { $set: { amount: 12 }, $inc: { revision: 1 } },
        { new: true, runValidators: true },
      )
      return updated ? Response.json({ id: String(updated._id), revision: updated.revision }) :
        Response.json({ code: 'EXPENSE_CONFLICT' }, { status: 409 })
    }
    const editResult = await idempotentCreate(editRequest(), userId, store, update)
    const editReplay = await idempotentCreate(editRequest(), userId, store, update)
    assert.equal(await editReplay.text(), await editResult.text())
    assert.equal(updateCalls, 1, 'a retried Mongo update executes once')
    assert.equal((await Expense.findById(mutationId))?.revision, 1)

    const deleteKey = randomUUID()
    const deleteRequest = () => new Request(`http://localhost/api/expenses/${mutationId}`, {
      method: 'DELETE',
      headers: { 'Idempotency-Key': deleteKey, 'If-Match': '"1"' },
    })
    let deleteCalls = 0
    const remove = async () => {
      deleteCalls++
      const deleted = await Expense.findOneAndDelete(expenseRevisionFilter(mutationId.toHexString(), 1))
      return deleted ? Response.json({ success: true }) :
        Response.json({ code: 'EXPENSE_CONFLICT' }, { status: 409 })
    }
    const deleteResult = await idempotentCreate(deleteRequest(), userId, store, remove)
    const deleteReplay = await idempotentCreate(deleteRequest(), userId, store, remove)
    assert.equal(await deleteReplay.text(), await deleteResult.text())
    assert.equal(deleteCalls, 1, 'a retried Mongo delete replays success after deletion')
    assert.equal(await Expense.findById(mutationId), null)
    console.log('Mongo expense idempotency integration checks passed')
  } finally {
    try {
      await mongoose.connection.dropDatabase()
    } finally {
      await mongoose.disconnect()
    }
  }
}

void main().catch(error => { console.error(error); process.exitCode = 1 })