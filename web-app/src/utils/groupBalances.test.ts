import assert from 'node:assert/strict'
import { calculateGroupBalances } from './groupBalances'

const members = ['a', 'b', 'c']

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

console.log('Group balance assertions passed')
