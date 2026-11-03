import assert from 'node:assert/strict'
import {
  hashRequest, idempotentCreate, MANUAL_REVIEW_MESSAGE, MAX_REQUEST_BYTES,
  MAX_RESPONSE_BYTES, type IdempotencyRecord, type IdempotencyStore,
} from './idempotency'
import Expense from '../models/Expense'
import { calculateGroupBalances, updateExpenseAllocations, validateExpenseMembers } from '../utils/groupBalances'

const KEY = 'd741b4a5-cd34-469f-b939-d2d2389c29be'
const PATH = '/api/expenses/personal'
const request = (body = '{"amount":10,"description":"Lunch"}', key: string | null = KEY, path = PATH) =>
  new Request(`https://example.test${path}`, {
    method: 'POST',
    headers: key === null ? {} : { 'Idempotency-Key': key },
    body,
  })
const mutationRequest = (method: 'PUT' | 'DELETE', ifMatch: string, body?: string, key = KEY) =>
  new Request(`https://example.test/api/expenses/expense-1`, {
    method,
    headers: { 'Idempotency-Key': key, 'If-Match': ifMatch },
    ...(body === undefined ? {} : { body }),
  })

class MemoryStore implements IdempotencyStore {
  records = new Map<string, IdempotencyRecord>()
  initialized = false
  completionFails = false
  reservationUncertain = false
  async initialize() { this.initialized = true }
  async reserve(userId: string, key: string, requestHash: string) {
    assert.equal(this.initialized, true, 'unique index initialization precedes reservation')
    const id = `${userId}:${key}`
    if (this.records.has(id)) return false
    this.records.set(id, { requestHash, state: 'reserved' })
    if (this.reservationUncertain) throw new Error('Acknowledgement lost')
    return true
  }
  async find(userId: string, key: string) { return this.records.get(`${userId}:${key}`) ?? null }
  async complete(userId: string, key: string, responseStatus: number, responseBody: string) {
    if (this.completionFails) throw new Error('Write failed')
    const record = this.records.get(`${userId}:${key}`)!
    Object.assign(record, { state: 'completed', responseStatus, responseBody })
  }
  async reopenRejectedUpdate(userId: string, key: string, requestHash: string, responseBody: string) {
    const record = this.records.get(`${userId}:${key}`)
    if (!record || record.state !== 'completed' || record.responseStatus !== 400 ||
        record.requestHash !== requestHash || record.responseBody !== responseBody) return false
    Object.assign(record, { state: 'reserved', responseStatus: undefined, responseBody: undefined })
    return true
  }
}

async function main() {
  assert.equal(
    hashRequest('post', PATH, { z: [{ b: 2, a: 1 }], a: 'é' }),
    hashRequest('POST', PATH, { a: 'é', z: [{ a: 1, b: 2 }] }),
  )
  const hash = hashRequest('POST', PATH, { a: [1, 2] })
  assert.notEqual(hash, hashRequest('POST', PATH, { a: [2, 1] }))
  assert.notEqual(hash, hashRequest('PUT', PATH, { a: [1, 2] }))
  assert.notEqual(hash, hashRequest('POST', '/api/expenses', { a: [1, 2] }))
  assert.notEqual(
    hashRequest('PUT', '/api/expenses/expense-1', { amount: 11 }, '"2"'),
    hashRequest('PUT', '/api/expenses/expense-1', { amount: 11 }, '"3"'),
  )
  assert.notEqual(hashRequest('POST', PATH, {}), hashRequest('POST', PATH, JSON.parse('{"__proto__":1}')))

  const store = new MemoryStore()
  let calls = 0
  let release!: () => void
  let entered!: () => void
  const started = new Promise<void>((resolve) => { entered = resolve })
  const wait = new Promise<void>((resolve) => { release = resolve })
  const execute = async () => {
    calls++
    entered()
    await wait
    return Response.json({ data: { id: 'expense-1' } }, {
      status: 201, headers: { 'Set-Cookie': 'private=secret', 'Authorization': 'secret' },
    })
  }
  const first = idempotentCreate(request(), 'user-1', store, execute)
  await started
  const concurrent = await idempotentCreate(request(), 'user-1', store, execute)
  assert.equal(concurrent.status, 409)
  assert.equal((await concurrent.json()).message, MANUAL_REVIEW_MESSAGE)
  release()
  const original = await first
  const replay = await idempotentCreate(
    request(' { "description": "Lunch", "amount": 10.0 } ', KEY.toUpperCase()),
    'user-1', store, execute,
  )
  assert.equal(calls, 1)
  assert.equal(original.status, 201)
  assert.equal(replay.status, 201)
  assert.equal(await original.text(), await replay.text())
  assert.equal(replay.headers.get('X-Idempotency-Supported'), 'true')
  assert.equal(replay.headers.get('Cache-Control'), 'no-store')
  assert.equal(replay.headers.get('Set-Cookie'), null)
  assert.equal(replay.headers.get('Authorization'), null)
  assert.equal(JSON.stringify([...store.records.values()]).includes('secret'), false)

  for (const changed of [
    request('{"amount":11,"description":"Lunch"}'),
    request(undefined, KEY, '/api/expenses'),
    request(undefined, KEY, `${PATH}?different=true`),
  ]) {
    const conflict = await idempotentCreate(changed, 'user-1', store, execute)
    assert.equal(conflict.status, 409)
    assert.match((await conflict.json()).message, /different request.*Manual review/)
  }
  assert.equal(calls, 1)
  await idempotentCreate(request(), 'user-2', store, execute)
  assert.equal(calls, 2, 'keys are scoped to the authenticated user')

  for (const status of [400, 403, 404, 500]) {
    const errors = new MemoryStore()
    let executions = 0
    const failure = async () => {
      executions++
      return Response.json({ message: `Failure ${status}` }, { status })
    }
    const result = await idempotentCreate(request(), 'u', errors, failure)
    const repeated = await idempotentCreate(request(), 'u', errors, failure)
    assert.equal(repeated.status, status)
    assert.equal(await result.text(), await repeated.text())
    assert.equal(executions, 1)
  }

  for (const mode of ['throw', 'completion', 'reservation', 'oversized-response']) {
    const uncertain = new MemoryStore()
    uncertain.completionFails = mode === 'completion'
    uncertain.reservationUncertain = mode === 'reservation'
    let executions = 0
    const fail = async () => {
      executions++
      if (mode === 'throw') throw new Error('Expense outcome unknown')
      return Response.json({ data: mode === 'oversized-response' ? 'x'.repeat(MAX_RESPONSE_BYTES) : 'ok' })
    }
    assert.equal((await idempotentCreate(request(), 'u', uncertain, fail)).status, 409)
    uncertain.completionFails = false
    uncertain.reservationUncertain = false
    assert.equal((await idempotentCreate(request(), 'u', uncertain, fail)).status, 409)
    assert.equal(executions, mode === 'reservation' ? 0 : 1)
    assert.equal([...uncertain.records.values()][0].state, 'reserved')
  }

  const invalid = new MemoryStore()
  const never = async () => { throw new Error('Must not execute') }
  for (const bad of [
    request('{}', ''), request('{}', 'not-a-uuid'), request('not-json'),
    request(JSON.stringify({ data: 'x'.repeat(MAX_REQUEST_BYTES) })),
  ]) {
    assert.equal((await idempotentCreate(bad, 'u', invalid, never)).status, 400)
  }
  assert.equal(invalid.records.size, 0)

  const mutations = new MemoryStore()
  let mutationCalls = 0
  const update = async () => {
    mutationCalls++
    return Response.json({ data: { id: 'expense-1', revision: 3 } })
  }
  const updated = await idempotentCreate(
    mutationRequest('PUT', '"2"', '{"amount":11}'), 'user-1', mutations, update,
  )
  const updateReplay = await idempotentCreate(
    mutationRequest('PUT', '"2"', '{"amount":11}'), 'user-1', mutations, update,
  )
  assert.equal(updated.status, 200)
  assert.equal(await updated.text(), await updateReplay.text())
  assert.equal(mutationCalls, 1, 'a retried update replays its saved result')
  const changedRevision = await idempotentCreate(
    mutationRequest('PUT', '"3"', '{"amount":11}'), 'user-1', mutations, update,
  )
  assert.equal(changedRevision.status, 409, 'the expected revision is part of the idempotency hash')
  assert.equal(mutationCalls, 1)

  for (const message of [
    'Expense payer amounts do not equal the expense total.',
    'Expense split amounts do not equal the expense total.',
    'Expense participants must match the saved splits',
    'Expense allocations must reference group members',
    'Expense allocations must reference group members: payers[0].name=undefined. Refresh the expense and review these references; names and account IDs are not group member IDs.',
    'Expense allocations must reference group members: splits[0].participant=undefined, splits[1].participant=undefined, payers[0].name=undefined, payers[1].name=undefined. Refresh the expense and review these references; names and account IDs are not group member IDs.',
  ]) {
    const rejected = new MemoryStore()
    const oldRequest = () => mutationRequest('PUT', '"2"', '{"amount":100,"participants":["a","b"]}')
    const originalFailure = () => Response.json({ message }, { status: 400 })
    assert.equal((await idempotentCreate(oldRequest(), 'u', rejected, async () => originalFailure())).status, 400)
    let updateCount = 0
    let release!: () => void
    let entered!: () => void
    const enteredUpdate = new Promise<void>(resolve => { entered = resolve })
    const wait = new Promise<void>(resolve => { release = resolve })
    const correctedUpdate = async () => {
      updateCount++
      entered()
      await wait
      return Response.json({ data: { id: 'expense-1', revision: 3 } })
    }
    const retry = idempotentCreate(oldRequest(), 'u', rejected, correctedUpdate)
    await enteredUpdate
    assert.equal((await idempotentCreate(oldRequest(), 'u', rejected, correctedUpdate)).status, 409)
    release()
    assert.equal((await retry).status, 200)
    assert.equal((await idempotentCreate(oldRequest(), 'u', rejected, correctedUpdate)).status, 200)
    assert.equal(updateCount, 1, 'a previously rejected update is recovered exactly once under its original key')
  }

  for (const body of ['{"amount":100,"payers":[]}', '{"amount":100,"splits":[]}']) {
    const explicit = new MemoryStore()
    const input = () => mutationRequest('PUT', '"2"', body)
    let attempts = 0
    const reject = async () => {
      attempts++
      return Response.json({ message: 'Expense payer amounts do not equal the expense total.' }, { status: 400 })
    }
    await idempotentCreate(input(), 'u', explicit, reject)
    await idempotentCreate(input(), 'u', explicit, reject)
    assert.equal(attempts, 1, 'explicit allocations are not rewritten or re-executed')
  }
  const invalidMemberUpdate = new MemoryStore()
  const invalidMemberRequest = () => mutationRequest('PUT', '"2"', '{"amount":100,"paidBy":"outside"}')
  await idempotentCreate(invalidMemberRequest(), 'u', invalidMemberUpdate, async () =>
    Response.json({ message: 'Expense allocations must reference group members' }, { status: 400 }))
  let memberChecks = 0
  const detailedMemberCheck = async () => {
    memberChecks++
    return Response.json({
      message: 'Expense allocations must reference group members: paidBy="outside".',
    }, { status: 400 })
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await idempotentCreate(invalidMemberRequest(), 'u', invalidMemberUpdate, detailedMemberCheck)
    assert.equal(result.status, 400, 'revalidating never bypasses membership validation')
    assert.match((await result.json()).message, /paidBy="outside"/)
  }
  assert.equal(memberChecks, 1, 'the detailed rejection is persisted instead of repeatedly executing')

  for (const references of [
    'payers[0].name="outside"',
    'splits[0].participant=undefined, payers[0].name="outside"',
    'participants[0]=undefined',
  ]) {
    const invalidReference = new MemoryStore()
    let attempts = 0
    const reject = async () => {
      attempts++
      return Response.json({
        message: `Expense allocations must reference group members: ${references}. Refresh the expense and review these references; names and account IDs are not group member IDs.`,
      }, { status: 400 })
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      assert.equal((await idempotentCreate(
        mutationRequest('PUT', '"2"', '{"amount":100}'), 'u', invalidReference, reject,
      )).status, 400)
    }
    assert.equal(attempts, 1, 'only dropped payer/split schema fields permit recovery')
  }

  const hydratedRecovery = new MemoryStore()
  const hydrationRequest = () => mutationRequest('PUT', '"2"', '{"amount":100}')
  const hydrationError = 'Expense allocations must reference group members: payers[0].name=undefined. Refresh the expense and review these references; names and account IDs are not group member IDs.'
  await idempotentCreate(hydrationRequest(), 'u', hydratedRecovery, async () =>
    Response.json({ message: hydrationError }, { status: 400 }))
  const document = Expense.hydrate({
    amount: 99, paidBy: 'a', participants: ['a', 'b', 'c'], splitType: 'equal', revision: 2,
    payers: [{ name: 'a', amountPaid: 99 }],
    splits: ['a', 'b', 'c'].map(participant => ({ participant, amount: 33 })),
  })
  let repairedWrites = 0
  const repairHydrated = async () => {
    const allocations = updateExpenseAllocations(document, { amount: 100 })
    validateExpenseMembers(['a', 'b', 'c'], allocations)
    calculateGroupBalances(['a', 'b', 'c'], [allocations])
    const recast = new Expense({ ...document.toObject(), ...allocations, revision: 3 })
    assert.equal(recast.payers?.[0].name, 'a')
    assert.deepEqual(recast.splits?.map(split => split.participant), ['a', 'b', 'c'])
    repairedWrites++
    return Response.json({ data: recast.toObject() })
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await idempotentCreate(hydrationRequest(), 'u', hydratedRecovery, repairHydrated)
    assert.equal(result.status, 200)
    assert.equal((await result.json()).data.payers[0].name, 'a')
  }
  assert.equal(repairedWrites, 1, 'the hydration failure recovers under the original key exactly once')

  const rejectedCreate = new MemoryStore()
  let createAttempts = 0
  const rejectCreate = async () => {
    createAttempts++
    return Response.json({ message: 'Expense payer amounts do not equal the expense total.' }, { status: 400 })
  }
  await idempotentCreate(request(), 'u', rejectedCreate, rejectCreate)
  await idempotentCreate(request(), 'u', rejectedCreate, rejectCreate)
  assert.equal(createAttempts, 1, 'recovery never reruns a create')

  const interruptedRecovery = new MemoryStore()
  const rejectedUpdate = () => mutationRequest('PUT', '"2"', '{"amount":100}')
  await idempotentCreate(rejectedUpdate(), 'u', interruptedRecovery, async () =>
    Response.json({ message: 'Expense payer amounts do not equal the expense total.' }, { status: 400 }))
  const reopen = interruptedRecovery.reopenRejectedUpdate.bind(interruptedRecovery)
  interruptedRecovery.reopenRejectedUpdate = async (...args) => {
    await reopen(...args)
    throw new Error('Recovery acknowledgement lost')
  }
  const mustNotExecute = async () => { throw new Error('Must not execute an uncertain recovery') }
  assert.equal((await idempotentCreate(rejectedUpdate(), 'u', interruptedRecovery, mustNotExecute)).status, 409)
  assert.equal((await idempotentCreate(rejectedUpdate(), 'u', interruptedRecovery, mustNotExecute)).status, 409)
  assert.equal([...interruptedRecovery.records.values()][0].state, 'reserved')

  const deleteStore = new MemoryStore()
  let deleteCalls = 0
  const remove = async () => {
    deleteCalls++
    return Response.json({ success: true })
  }
  const deleted = await idempotentCreate(
    mutationRequest('DELETE', '"3"'), 'user-1', deleteStore, remove,
  )
  const deleteReplay = await idempotentCreate(
    mutationRequest('DELETE', '"3"'), 'user-1', deleteStore, remove,
  )
  assert.equal(deleted.status, 200)
  assert.equal(await deleted.text(), await deleteReplay.text())
  assert.equal(deleteCalls, 1, 'a retried delete replays success instead of returning not found')
  assert.equal((await idempotentCreate(
    new Request('https://example.test/api/expenses/expense-2', { method: 'DELETE', headers: { 'Idempotency-Key': KEY } }),
    'user-1', new MemoryStore(), never,
  )).status, 400, 'keyed mutations require a precondition')
  const unavailable: IdempotencyStore = {
    ...invalid,
    initialize: async () => { throw new Error('Index unavailable') },
    reserve: invalid.reserve.bind(invalid),
    find: invalid.find.bind(invalid),
    complete: invalid.complete.bind(invalid),
  }
  assert.equal((await idempotentCreate(request(), 'u', unavailable, never)).status, 409)

  const recovering = new MemoryStore()
  let recoverCalls = 0
  let unavailableOnce = true
  recovering.initialize = async () => {
    if (unavailableOnce) {
      unavailableOnce = false
      throw new Error('Temporary index initialization failure')
    }
    recovering.initialized = true
  }
  const recover = async () => {
    recoverCalls++
    return Response.json({ data: { id: 'recovered' } }, { status: 201 })
  }
  assert.equal((await idempotentCreate(request(), 'u', recovering, recover)).status, 409)
  assert.equal(recoverCalls, 0)
  assert.equal((await idempotentCreate(request(), 'u', recovering, recover)).status, 201)
  assert.equal((await idempotentCreate(request(), 'u', recovering, recover)).status, 201)
  assert.equal(recoverCalls, 1, 'same-key retry after infrastructure recovery executes once')

  const lostCompletion = new MemoryStore()
  const complete = lostCompletion.complete.bind(lostCompletion)
  lostCompletion.complete = async (...args) => {
    await complete(...args)
    throw new Error('Completion acknowledgement lost')
  }
  let completedCalls = 0
  const completeOnce = async () => {
    completedCalls++
    return Response.json({ data: { id: 'already-saved' } }, { status: 201 })
  }
  assert.equal((await idempotentCreate(request(), 'u', lostCompletion, completeOnce)).status, 409)
  assert.equal((await idempotentCreate(request(), 'u', lostCompletion, completeOnce)).status, 201)
  assert.equal(completedCalls, 1, 'same-key retry returns a committed result after a lost acknowledgement')

  let legacyCalls = 0
  const legacy = async () => {
    legacyCalls++
    return Response.json({ message: 'legacy validation' }, { status: 400 })
  }
  for (let i = 0; i < 2; i++) {
    const response = await idempotentCreate(request('invalid legacy body', null), 'u', invalid, legacy)
    assert.equal(response.status, 400)
    assert.equal(response.headers.get('X-Idempotency-Supported'), 'true')
  }
  assert.equal(legacyCalls, 2)
  assert.equal(invalid.records.size, 0)
  console.log('Expense idempotency checks passed')
}

void main().catch((error) => { console.error(error); process.exitCode = 1 })
