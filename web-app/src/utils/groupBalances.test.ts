import assert from 'node:assert/strict'
import { calculateGroupBalances, updateExpenseAllocations, validateExpenseMembers } from './groupBalances'
import Expense from '../models/Expense'

const members = ['a', 'b', 'c']

for (const paidBy of ['Multiple', '', undefined]) {
  for (const payers of [
    [{ name: 'a', amountPaid: 100 }],
    [{ name: 'a', amountPaid: 60 }, { name: 'b', amountPaid: 40 }],
  ]) {
    const expense = { amount: 100, paidBy, payers, participants: members, splitType: 'equal' }
    assert.doesNotThrow(() => validateExpenseMembers(members, expense))
    assert.doesNotThrow(() => calculateGroupBalances(members, [expense]))
    const updated = updateExpenseAllocations(expense, { amount: 200 })
    assert.doesNotThrow(() => validateExpenseMembers(members, updated))
    assert.doesNotThrow(() => calculateGroupBalances(members, [updated]))
  }
  assert.throws(() => validateExpenseMembers(members, { amount: 100, paidBy }), /missing valid payer allocations/)
}
const invalidAllocations: Array<[string, Parameters<typeof validateExpenseMembers>[1]]> = [
  ['paidBy', { amount: 100, paidBy: 'not-a-member' }],
  ['participants[0]', { amount: 100, participants: ['not-a-member'] }],
  ['splits[0].participant', { amount: 100, splits: [{ participant: 'not-a-member', amount: 100 }] }],
  ['payers[0].name', { amount: 100, payers: [{ name: 'not-a-member', amountPaid: 100 }] }],
]
for (const [field, allocations] of invalidAllocations) {
  const expense = { paidBy: 'a', ...allocations }
  assert.throws(
    () => validateExpenseMembers(members, expense),
    (error: unknown) => error instanceof Error && error.message.includes(`${field}="not-a-member"`),
  )
}
assert.throws(
  () => validateExpenseMembers(members, {
    amount: 100, paidBy: 'Multiple', payers: [{ name: 'outside', amountPaid: 100 }],
  }),
  /payers\[0\].name="outside"/,
)

assert.deepEqual(
  calculateGroupBalances(members, [{
    amount: 10,
    paidBy: 'a',
    participants: members,
    splitType: 'equal',
  }]),
  { a: 6.66, b: -3.33, c: -3.33 },
)

assert.deepEqual(
  calculateGroupBalances(members, [{
    amount: 100,
    paidBy: 'Multiple',
    payers: [{ name: 'a', amountPaid: 60 }, { name: 'b', amountPaid: 40 }],
    splits: [{ participant: 'a', amount: 25 }, { participant: 'c', amount: 75 }],
    splitType: 'unequal',
  }], [{ fromUserId: 'c', toUserId: 'a', amount: 10 }]),
  { a: 25, b: 40, c: -65 },
)

assert.throws(
  () => calculateGroupBalances(members, [{
    amount: 10,
    paidBy: 'a',
    splits: [{ participant: 'b', amount: 8 }],
    splitType: 'unequal',
  }]),
  /split amounts do not equal/,
)

assert.throws(
  () => calculateGroupBalances(members, [{
    amount: 10,
    paidBy: 'outside',
    participants: ['a'],
    splitType: 'equal',
  }]),
  /unknown group member/,
)

const saved = {
  amount: 99,
  paidBy: 'a',
  participants: members,
  payers: [{ name: 'a', amountPaid: 99 }],
  splits: members.map(participant => ({ participant, amount: 33 })),
  splitType: 'equal',
}
const resized = updateExpenseAllocations(saved, { amount: 100 })
assert.deepEqual(resized.payers, [{ name: 'a', amountPaid: 100 }])
assert.deepEqual(resized.splits?.map(split => split.amount), [33.34, 33.33, 33.33])
assert.deepEqual(calculateGroupBalances(members, [resized]), { a: 66.66, b: -33.33, c: -33.33 })
assert.equal(saved.payers[0].amountPaid, 99, 'allocation updates do not mutate saved data')

for (const splitType of ['percentage', 'shares']) {
  const updated = updateExpenseAllocations({
    ...saved, splitType, paidBy: 'Multiple',
    payers: [{ name: 'a', amountPaid: 33 }, { name: 'b', amountPaid: 66 }],
    splits: [{ participant: 'a', amount: 11 }, { participant: 'b', amount: 22 }, { participant: 'c', amount: 66 }],
  }, { amount: 999 })
  assert.deepEqual(updated.payers, [{ name: 'a', amountPaid: 333 }, { name: 'b', amountPaid: 666 }])
  assert.deepEqual(updated.splits?.map(split => split.amount), [111, 222, 666])
  assert.doesNotThrow(() => calculateGroupBalances(members, [updated]))
}

const changedMembers = updateExpenseAllocations(saved, { paidBy: 'b', participants: ['b', 'c'] })
assert.deepEqual(changedMembers.payers, [{ name: 'b', amountPaid: 99 }])
assert.deepEqual(changedMembers.splits, [{ participant: 'b', amount: 49.5 }, { participant: 'c', amount: 49.5 }])
assert.doesNotThrow(() => calculateGroupBalances(members, [changedMembers]))

const unequal = { ...saved, splitType: 'unequal' }
assert.throws(() => updateExpenseAllocations(unequal, { amount: 999 }), /Unequal splits use fixed amounts/)
assert.deepEqual(updateExpenseAllocations(unequal, {}).splits, unequal.splits)
const fixedSplits = [{ participant: 'a', amount: 333 }, { participant: 'b', amount: 333 }, { participant: 'c', amount: 333 }]
assert.doesNotThrow(() => calculateGroupBalances(members, [
  updateExpenseAllocations(unequal, { amount: 999, splits: fixedSplits }),
]))
const explicitMismatch = updateExpenseAllocations(saved, { amount: 100, payers: saved.payers })
assert.throws(() => calculateGroupBalances(members, [explicitMismatch]), /payer amounts do not equal/)
assert.throws(() => updateExpenseAllocations(saved, { amount: Infinity }), /positive finite/)
assert.throws(() => updateExpenseAllocations(saved, { amount: 0.001 }), /valid expense amount/)

for (const splitType of ['equal', 'percentage', 'shares', 'unequal'] as const) {
  const document = Expense.hydrate({
    description: 'Hydrated expense', amount: 99, paidBy: 'Multiple',
    date: '2026-01-01', type: 'group', createdBy: '000000000000000000000001',
    participants: members, splitType,
    payers: [{ name: 'a', amountPaid: 33 }, { name: 'b', amountPaid: 66 }],
    splits: [
      { participant: 'a', amount: 11, percentage: 11.11 },
      { participant: 'b', amount: 22, percentage: 22.22 },
      { participant: 'c', amount: 66, percentage: 66.67 },
    ],
  })
  const before = JSON.stringify(document.toObject())
  const updates = splitType === 'unequal'
    ? { amount: 999, splits: fixedSplits }
    : { amount: 999 }
  const allocations = updateExpenseAllocations(document, updates)
  assert.deepEqual(allocations.payers.map(payer => payer.name), ['a', 'b'])
  assert.deepEqual(allocations.payers.map(payer => payer.amountPaid), [333, 666])
  assert.deepEqual(allocations.splits.map(split => split.participant), members)
  if (splitType === 'percentage' || splitType === 'shares') {
    assert.deepEqual(allocations.splits.map(split => split.percentage), [11.11, 22.22, 66.67])
  }
  assert.doesNotThrow(() => validateExpenseMembers(members, allocations))
  assert.doesNotThrow(() => calculateGroupBalances(members, [allocations]))
  const recast = new Expense({ ...document.toObject(), ...allocations })
  assert.equal(recast.validateSync(), undefined)
  assert.deepEqual(recast.payers?.map(payer => payer.name), ['a', 'b'])
  assert.deepEqual(recast.splits?.map(split => split.participant), members)
  assert.deepEqual(calculateGroupBalances(members, [recast]), calculateGroupBalances(members, [allocations]))
  if (splitType !== 'unequal') {
    const rounded = updateExpenseAllocations(document, { amount: 100 })
    assert.deepEqual(rounded.payers.map(payer => payer.name), ['a', 'b'])
    assert.equal(rounded.payers.reduce((sum, payer) => sum + Math.round(payer.amountPaid * 100), 0), 10000)
    assert.equal(rounded.splits.reduce((sum, split) => sum + Math.round(split.amount! * 100), 0), 10000)
    assert.doesNotThrow(() => validateExpenseMembers(members, rounded))
    assert.doesNotThrow(() => calculateGroupBalances(members, [rounded]))
  }
  const explicit = updateExpenseAllocations(document, { amount: 999, payers: saved.payers, splits: fixedSplits })
  assert.equal(explicit.payers, saved.payers)
  assert.equal(explicit.splits, fixedSplits)
  assert.throws(() => calculateGroupBalances(members, [explicit]), /payer amounts do not equal/)
  assert.equal(JSON.stringify(document.toObject()), before, 'resizing must not mutate hydrated subdocuments')
}

console.log('Group balance assertions passed')
